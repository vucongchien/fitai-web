import { cookies } from "next/headers";

function parseJWTRole(token?: string): string | undefined {
  if (!token) return undefined;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
      return payload.role || payload.Role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    }
  } catch {
    // Ignore error
  }
  if (token.startsWith("mock_dev_access_token_admin")) {
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
  const cookieRole = cookieStore.get("fitai_user_role")?.value;
  const role = cookieRole || parseJWTRole(accessToken);

  if (!userId && accessToken?.startsWith("mock_dev_access_token_")) {
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
