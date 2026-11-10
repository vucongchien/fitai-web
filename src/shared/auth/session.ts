import { cookies } from "next/headers";

function decodeJwtPayload(base64Payload: string): Record<string, unknown> {
  let base64 = base64Payload.replaceAll("-", "+").replaceAll("_", "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  if (typeof atob === "function") {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  if (typeof Buffer !== "undefined") {
    return JSON.parse(Buffer.from(base64, "base64").toString("utf-8"));
  }
  throw new Error("No base64 decoder available in current runtime");
}

function parseJWTRole(token?: string): string | undefined {
  if (!token) return undefined;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = decodeJwtPayload(parts[1]) as Record<string, string | undefined>;
      return (
        payload.role ||
        payload.Role ||
        payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
      );
    }
  } catch {
    // Ignore error
  }
  if (process.env.NODE_ENV !== "production" && token.startsWith("mock_dev_access_token_admin")) {
    return "ADMIN";
  }
  return undefined;
}

export async function getAuthenticatedSession(): Promise<{
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  userName?: string;
  role?: string;
}> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fitai_access_token")?.value;
  const refreshToken = cookieStore.get("fitai_refresh_token")?.value;
  let userId = cookieStore.get("fitai_user_id")?.value;
  const userName = cookieStore.get("fitai_user_name")?.value;
  const role = parseJWTRole(accessToken);

  if (
    process.env.NODE_ENV !== "production" &&
    !userId &&
    accessToken?.startsWith("mock_dev_access_token_")
  ) {
    userId = accessToken.replace("mock_dev_access_token_", "");
  }

  return {
    accessToken,
    refreshToken,
    userId,
    userName,
    role,
  };
}

export async function getAuthenticatedUserId(): Promise<string | undefined> {
  const { userId } = await getAuthenticatedSession();
  return userId;
}

export async function getAccessToken(): Promise<string | undefined> {
  const { accessToken } = await getAuthenticatedSession();
  return accessToken;
}

export async function getAuthenticatedRole(): Promise<string | undefined> {
  const { role } = await getAuthenticatedSession();
  return role;
}

export async function isAdmin(): Promise<boolean> {
  const { role } = await getAuthenticatedSession();
  if (!role) return false;
  return role.toUpperCase() === "ADMIN" || role.toUpperCase() === "SUPERADMIN";
}
