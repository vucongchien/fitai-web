import { describe, expect, it } from "vitest";

import {
  cleanAuthErrorMessage,
  detectIdentifierType,
  getEmailProviderUrl,
  isValidEmail,
  isValidVietnamesePhone,
  maskIdentifier,
  normalizePhoneNumber,
} from "@/features/auth/model/auth-validation";

describe("auth-validation edge cases & security tests", () => {
  describe("isValidVietnamesePhone", () => {
    it("validates valid 10-digit mobile prefixes across all Vietnamese carriers", () => {
      const validNumbers = [
        "0901234567", // MobiFone 090
        "0912345678", // VinaPhone 091
        "0987654321", // Viettel 098
        "0923456789", // Vietnamobile 092
        "0993456789", // Gmobile 099
        "0868123456", // Viettel 086
        "0888123456", // VinaPhone 088
        "0898123456", // MobiFone 089
        "0701122334", // MobiFone 070
        "0568999888", // Vietnamobile 056
        "0387654321", // Viettel 038
        "0326543210", // Viettel 032
      ];

      for (const num of validNumbers) {
        expect(isValidVietnamesePhone(num), `Expected ${num} to be valid`).toBe(true);
      }
    });

    it("validates international E.164 formats (+84...)", () => {
      expect(isValidVietnamesePhone("+84901234567")).toBe(true);
      expect(isValidVietnamesePhone("+84387654321")).toBe(true);
      expect(isValidVietnamesePhone("+84 90 123 4567")).toBe(true);
      expect(isValidVietnamesePhone("+84 (090) 123-4567")).toBe(true);
    });

    it("handles common user separators (spaces, dots, hyphens, parentheses)", () => {
      expect(isValidVietnamesePhone("090 123 4567")).toBe(true);
      expect(isValidVietnamesePhone("090-123-4567")).toBe(true);
      expect(isValidVietnamesePhone("090.123.4567")).toBe(true);
      expect(isValidVietnamesePhone("(090) 123 4567")).toBe(true);
    });

    it("rejects empty strings and whitespace-only strings", () => {
      expect(isValidVietnamesePhone("")).toBe(false);
      expect(isValidVietnamesePhone("   ")).toBe(false);
      expect(isValidVietnamesePhone("\t\n\r")).toBe(false);
    });

    it("rejects boundary length errors (too short or too long)", () => {
      expect(isValidVietnamesePhone("090123456")).toBe(false); // 9 digits
      expect(isValidVietnamesePhone("09012345678")).toBe(false); // 11 digits
      expect(isValidVietnamesePhone("0")).toBe(false);
      expect(isValidVietnamesePhone("+8490123456")).toBe(false); // E.164 short
      expect(isValidVietnamesePhone("+849012345678")).toBe(false); // E.164 long
    });

    it("rejects legacy discontinued 11-digit numbers and landlines", () => {
      expect(isValidVietnamesePhone("01234567890")).toBe(false); // Old 11-digit prefix 012
      expect(isValidVietnamesePhone("01681234567")).toBe(false); // Old Viettel 016
      expect(isValidVietnamesePhone("0243123456")).toBe(false); // Hanoi landline 024
      expect(isValidVietnamesePhone("0283123456")).toBe(false); // HCMC landline 028
    });

    it("rejects input containing letters, special characters, or emojis", () => {
      expect(isValidVietnamesePhone("090abc1234")).toBe(false);
      expect(isValidVietnamesePhone("0901234567📞")).toBe(false);
      expect(isValidVietnamesePhone("🔥0901234567")).toBe(false);
      expect(isValidVietnamesePhone("090❤️123456")).toBe(false);
      expect(isValidVietnamesePhone("0901234567#")).toBe(false);
      expect(isValidVietnamesePhone("0901234567*")).toBe(false);
      expect(isValidVietnamesePhone("<script>alert(1)</script>")).toBe(false);
    });
  });

  describe("normalizePhoneNumber", () => {
    it("converts domestic 0x numbers to international +84 format", () => {
      expect(normalizePhoneNumber("0901234567")).toBe("+84901234567");
      expect(normalizePhoneNumber("038 765 4321")).toBe("+84387654321");
      expect(normalizePhoneNumber("(090) 123-4567")).toBe("+84901234567");
      expect(normalizePhoneNumber("090.123.4567")).toBe("+84901234567");
    });

    it("preserves already normalized +84 numbers", () => {
      expect(normalizePhoneNumber("+84901234567")).toBe("+84901234567");
      expect(normalizePhoneNumber("+84 901 234 567")).toBe("+84901234567");
    });

    it("handles empty or whitespace strings gracefully without crashing", () => {
      expect(normalizePhoneNumber("")).toBe("");
      expect(normalizePhoneNumber("   ")).toBe("");
    });
  });

  describe("isValidEmail", () => {
    it("validates standard corporate and personal emails", () => {
      expect(isValidEmail("user@gmail.com")).toBe(true);
      expect(isValidEmail("test.user+tag@outlook.com.vn")).toBe(true);
      expect(isValidEmail("john_doe@fitai.app")).toBe(true);
      expect(isValidEmail("coach-alex@fitness-center.co.uk")).toBe(true);
    });

    it("rejects empty strings and whitespace-only strings", () => {
      expect(isValidEmail("")).toBe(false);
      expect(isValidEmail("   ")).toBe(false);
      expect(isValidEmail("\n\t")).toBe(false);
    });

    it("rejects emails with syntax errors and multiple @", () => {
      expect(isValidEmail("user@@gmail.com")).toBe(false);
      expect(isValidEmail("user@domain@gmail.com")).toBe(false);
      expect(isValidEmail("user name@gmail.com")).toBe(false);
      expect(isValidEmail("user@ gmail.com")).toBe(false);
      expect(isValidEmail("@missingusername.com")).toBe(false);
      expect(isValidEmail("missingdomain@")).toBe(false);
      expect(isValidEmail("missingtld@domain")).toBe(false);
      expect(isValidEmail("missingdomain@.com")).toBe(false);
    });

    it("rejects inputs with malicious injection payloads or emojis", () => {
      expect(isValidEmail("<script>alert(1)</script>")).toBe(false);
      expect(isValidEmail("' OR '1'='1")).toBe(false);
      expect(isValidEmail("user@🔥gmail.com")).toBe(false);
      expect(isValidEmail("user❤️@gmail.com")).toBe(false);
      expect(isValidEmail("admin';DROP TABLE users;--")).toBe(false);
    });
  });

  describe("detectIdentifierType", () => {
    it("detects valid phone inputs", () => {
      expect(detectIdentifierType("0901234567")).toBe("phone");
      expect(detectIdentifierType("+84901234567")).toBe("phone");
      expect(detectIdentifierType("  0901234567  ")).toBe("phone");
    });

    it("detects valid email inputs", () => {
      expect(detectIdentifierType("user@gmail.com")).toBe("email");
      expect(detectIdentifierType("  athlete@fitai.app  ")).toBe("email");
    });

    it("returns invalid for corrupt, malicious, or empty inputs", () => {
      expect(detectIdentifierType("")).toBe("invalid");
      expect(detectIdentifierType("   ")).toBe("invalid");
      expect(detectIdentifierType("invalid-text")).toBe("invalid");
      expect(detectIdentifierType("12345")).toBe("invalid");
      expect(detectIdentifierType("090abc1234")).toBe("invalid");
      expect(detectIdentifierType("<script>")).toBe("invalid");
      expect(detectIdentifierType("user@invalid-domain")).toBe("invalid");
    });
  });

  describe("maskIdentifier", () => {
    it("masks phone numbers into spaced format with center dots", () => {
      expect(maskIdentifier("+84901234567")).toBe("0901 ••• 567");
      expect(maskIdentifier("0901234567")).toBe("0901 ••• 567");
      expect(maskIdentifier("  0987654321  ")).toBe("0987 ••• 321");
    });

    it("masks emails preserving first char and full domain", () => {
      expect(maskIdentifier("user@gmail.com")).toBe("u•••@gmail.com");
      expect(maskIdentifier("fitai@outlook.com")).toBe("f•••@outlook.com");
      expect(maskIdentifier("a@domain.com")).toBe("a•••@domain.com");
    });

    it("handles empty or unrecognized strings safely without throwing", () => {
      expect(maskIdentifier("")).toBe("");
      expect(maskIdentifier("   ")).toBe("");
      expect(maskIdentifier("unrecognized_data")).toBe("unrecognized_data");
    });
  });

  describe("getEmailProviderUrl", () => {
    it("returns correct webmail URLs for known email services", () => {
      expect(getEmailProviderUrl("user@gmail.com")).toBe("https://mail.google.com");
      expect(getEmailProviderUrl("ATHLETE@GMAIL.COM")).toBe("https://mail.google.com");
      expect(getEmailProviderUrl("user@outlook.com")).toBe("https://outlook.live.com");
      expect(getEmailProviderUrl("user@hotmail.com")).toBe("https://outlook.live.com");
      expect(getEmailProviderUrl("user@icloud.com")).toBe("https://www.icloud.com/mail");
    });

    it("returns null for custom or unsupported domains", () => {
      expect(getEmailProviderUrl("user@fitai.vn")).toBeNull();
      expect(getEmailProviderUrl("user@yahoo.com")).toBeNull();
      expect(getEmailProviderUrl("")).toBeNull();
      expect(getEmailProviderUrl("invalid-email")).toBeNull();
    });
  });

  describe("cleanAuthErrorMessage", () => {
    it("handles maximum attempts exceeded error with gRPC code and Vietnamese text", () => {
      const raw =
        "[invalid_argument] xác thực OTP thất bại: maximum otp verification attempts exceeded";
      expect(cleanAuthErrorMessage(raw)).toBe(
        "Maximum verification attempts exceeded. Please request a new code.",
      );
    });

    it("strips gRPC status code prefix and maps invalid OTP to English", () => {
      const raw = "[invalid_argument] xác thực OTP thất bại: mã OTP không chính xác";
      expect(cleanAuthErrorMessage(raw)).toBe(
        "Invalid verification code. Please check and try again.",
      );
    });

    it("maps expired token message to English", () => {
      const raw = "[deadline_exceeded] Mã OTP đã hết hạn";
      expect(cleanAuthErrorMessage(raw)).toBe(
        "Verification code has expired. Please request a new code.",
      );
    });

    it("falls back to English default if backend message is unmapped Vietnamese", () => {
      const raw = "[internal] lỗi hệ thống nội bộ không xác định";
      expect(cleanAuthErrorMessage(raw, "Something went wrong. Please try again.")).toBe(
        "Something went wrong. Please try again.",
      );
    });

    it("preserves already clean English messages without gRPC prefix", () => {
      const raw = "[permission_denied] Access denied for this resource";
      expect(cleanAuthErrorMessage(raw)).toBe("Access denied for this resource");
    });
  });
});
