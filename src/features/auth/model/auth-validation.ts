export type IdentifierType = "phone" | "email" | "invalid";

const VN_DOMESTIC_REGEX = /^0[35789]\d{8}$/;
const VN_E164_REGEX = /^\+84[35789]\d{8}$/;
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

function sanitizePhone(raw: string): string {
  let cleaned = raw.replace(/[\s\-().]/g, "");
  if (cleaned.startsWith("+840")) {
    cleaned = `+84${cleaned.slice(4)}`;
  } else if (cleaned.startsWith("84") && cleaned.length === 11) {
    cleaned = `+${cleaned}`;
  }
  return cleaned;
}

export function isValidVietnamesePhone(phone: string): boolean {
  const sanitized = sanitizePhone(phone);
  return VN_DOMESTIC_REGEX.test(sanitized) || VN_E164_REGEX.test(sanitized);
}

export function normalizePhoneNumber(phone: string): string {
  const sanitized = sanitizePhone(phone);
  if (sanitized.startsWith("+84")) {
    return sanitized;
  }
  if (sanitized.startsWith("0")) {
    return `+84${sanitized.slice(1)}`;
  }
  return sanitized;
}

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function detectIdentifierType(value: string): IdentifierType {
  const trimmed = value.trim();
  if (!trimmed) {
    return "invalid";
  }
  if (trimmed.includes("@")) {
    return isValidEmail(trimmed) ? "email" : "invalid";
  }
  return isValidVietnamesePhone(trimmed) ? "phone" : "invalid";
}

export function maskIdentifier(value: string): string {
  const trimmed = value.trim();
  const type = detectIdentifierType(trimmed);

  if (type === "phone") {
    const normalized = normalizePhoneNumber(trimmed);
    const domestic = `0${normalized.replace(/^\+84/, "")}`;
    const prefix = domestic.slice(0, 4);
    const suffix = domestic.slice(-3);
    return `${prefix} ••• ${suffix}`;
  }

  if (type === "email") {
    const [local, domain] = trimmed.split("@");
    const firstChar = local.charAt(0);
    return `${firstChar}•••@${domain}`;
  }

  return trimmed;
}

export function getEmailProviderUrl(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (trimmed.endsWith("@gmail.com")) {
    return "https://mail.google.com";
  }
  if (trimmed.endsWith("@outlook.com") || trimmed.endsWith("@hotmail.com")) {
    return "https://outlook.live.com";
  }
  if (trimmed.endsWith("@icloud.com")) {
    return "https://www.icloud.com/mail";
  }
  return null;
}

export function cleanAuthErrorMessage(
  error: unknown,
  fallback = "An error occurred. Please try again.",
): string {
  if (!error) {
    return fallback;
  }

  let raw = "";
  if (typeof error === "string") {
    raw = error.trim();
  } else if (error instanceof Error) {
    raw = error.message.trim();
  } else if (typeof error === "object" && error !== null && "message" in error) {
    raw = String((error as { message?: unknown }).message ?? "").trim();
  } else {
    raw = String(error).trim();
  }

  if (!raw) {
    return fallback;
  }

  // Strip gRPC/ConnectRPC status code e.g. "[invalid_argument] ", "[not_found] "
  raw = raw.replace(/^\[[a-z0-9_-]+\]\s*/i, "").trim();

  const lower = raw.toLowerCase();

  // Maximum attempts exceeded
  if (
    lower.includes("maximum otp verification attempts exceeded") ||
    lower.includes("maximum attempts") ||
    lower.includes("quá số lần")
  ) {
    return "Maximum verification attempts exceeded. Please request a new code.";
  }

  // Expired code / token
  if (
    lower.includes("otp expired") ||
    lower.includes("hết hạn") ||
    lower.includes("verification code has expired")
  ) {
    return "Verification code has expired. Please request a new code.";
  }

  // Invalid OTP code from Vietnamese backend
  if (
    lower.includes("xác thực otp thất bại") ||
    lower.includes("xác thực thất bại") ||
    lower.includes("mã xác thực không đúng") ||
    lower.includes("mã xác thực không hợp lệ") ||
    lower.includes("mã sai")
  ) {
    return "Invalid verification code. Please check and try again.";
  }

  // Account already exists
  if (
    lower.includes("already exists") ||
    lower.includes("đã tồn tại") ||
    lower.includes("tài khoản đã có")
  ) {
    return "An account with this email or phone number already exists.";
  }

  // Account / user not found
  if (lower.includes("not found") || lower.includes("không tìm thấy")) {
    return "Account not found. Please check your credentials.";
  }

  // Incorrect password
  if (
    lower.includes("invalid password") ||
    lower.includes("wrong password") ||
    lower.includes("sai mật khẩu") ||
    lower.includes("mật khẩu không đúng")
  ) {
    return "Invalid email, phone number, or password. Please try again.";
  }

  // Rate limiting
  if (
    lower.includes("rate limit") ||
    lower.includes("too many requests") ||
    lower.includes("resource_exhausted")
  ) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // If there are still Vietnamese diacritics in the message, fallback to English fallback
  const hasVietnamese =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(raw);
  if (hasVietnamese) {
    return fallback;
  }

  return raw;
}
