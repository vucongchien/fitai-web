import { describe, expect, it } from "vitest";

import {
  detectIdentifierType,
  getEmailProviderUrl,
  isValidEmail,
  isValidVietnamesePhone,
  maskIdentifier,
  normalizePhoneNumber,
} from "@/features/auth/model/auth-validation";

describe("auth-validation", () => {
  describe("isValidVietnamesePhone", () => {
    it("validates domestic 10-digit Vietnamese phone numbers", () => {
      expect(isValidVietnamesePhone("0901234567")).toBe(true);
      expect(isValidVietnamesePhone("0387654321")).toBe(true);
      expect(isValidVietnamesePhone("0701122334")).toBe(true);
      expect(isValidVietnamesePhone("0523456789")).toBe(true);
      expect(isValidVietnamesePhone("0868123456")).toBe(true);
    });

    it("validates international E.164 Vietnamese phone numbers", () => {
      expect(isValidVietnamesePhone("+84901234567")).toBe(true);
      expect(isValidVietnamesePhone("+84387654321")).toBe(true);
      expect(isValidVietnamesePhone("+84 90 123 4567")).toBe(true);
    });

    it("rejects invalid phone numbers", () => {
      expect(isValidVietnamesePhone("0123456789")).toBe(false);
      expect(isValidVietnamesePhone("123456")).toBe(false);
      expect(isValidVietnamesePhone("090123456789")).toBe(false);
      expect(isValidVietnamesePhone("phone_number")).toBe(false);
      expect(isValidVietnamesePhone("+12025550123")).toBe(false);
    });
  });

  describe("normalizePhoneNumber", () => {
    it("converts 0x domestic number to +84 international format", () => {
      expect(normalizePhoneNumber("0901234567")).toBe("+84901234567");
      expect(normalizePhoneNumber("038 765 4321")).toBe("+84387654321");
      expect(normalizePhoneNumber("090-123-4567")).toBe("+84901234567");
    });

    it("preserves already normalized +84 number", () => {
      expect(normalizePhoneNumber("+84901234567")).toBe("+84901234567");
      expect(normalizePhoneNumber("+84 901 234 567")).toBe("+84901234567");
    });
  });

  describe("isValidEmail", () => {
    it("validates standard email formats", () => {
      expect(isValidEmail("user@gmail.com")).toBe(true);
      expect(isValidEmail("test.user+tag@outlook.com.vn")).toBe(true);
    });

    it("rejects invalid email formats", () => {
      expect(isValidEmail("plainaddress")).toBe(false);
      expect(isValidEmail("@missingusername.com")).toBe(false);
      expect(isValidEmail("missingdomain@.com")).toBe(false);
    });
  });

  describe("detectIdentifierType", () => {
    it("detects phone numbers correctly", () => {
      expect(detectIdentifierType("0901234567")).toBe("phone");
      expect(detectIdentifierType("+84901234567")).toBe("phone");
    });

    it("detects emails correctly", () => {
      expect(detectIdentifierType("user@gmail.com")).toBe("email");
    });

    it("returns invalid for unrecognized strings", () => {
      expect(detectIdentifierType("invalid-input")).toBe("invalid");
      expect(detectIdentifierType("123")).toBe("invalid");
    });
  });

  describe("maskIdentifier", () => {
    it("masks phone numbers cleanly", () => {
      expect(maskIdentifier("+84901234567")).toBe("+84 901 ••• 567");
      expect(maskIdentifier("0901234567")).toBe("+84 901 ••• 567");
    });

    it("masks emails cleanly", () => {
      expect(maskIdentifier("user@gmail.com")).toBe("u•••@gmail.com");
      expect(maskIdentifier("fitai@outlook.com")).toBe("f•••@outlook.com");
    });
  });

  describe("getEmailProviderUrl", () => {
    it("returns webmail url for major providers", () => {
      expect(getEmailProviderUrl("user@gmail.com")).toBe("https://mail.google.com");
      expect(getEmailProviderUrl("user@outlook.com")).toBe("https://outlook.live.com");
      expect(getEmailProviderUrl("user@hotmail.com")).toBe("https://outlook.live.com");
      expect(getEmailProviderUrl("user@icloud.com")).toBe("https://www.icloud.com/mail");
    });

    it("returns null for other domains", () => {
      expect(getEmailProviderUrl("user@customdomain.io")).toBeNull();
    });
  });
});
