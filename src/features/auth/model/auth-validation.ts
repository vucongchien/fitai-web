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
    const prefix = normalized.slice(0, 6);
    const suffix = normalized.slice(-3);
    return `${prefix.slice(0, 3)} ${prefix.slice(3)} ••• ${suffix}`;
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
