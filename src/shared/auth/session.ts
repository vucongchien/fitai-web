import { cookies } from "next/headers";

export async function getAuthenticatedSession(): Promise<{
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
}> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("fitai_access_token")?.value;
  const refreshToken = cookieStore.get("fitai_refresh_token")?.value;
  const userId = cookieStore.get("fitai_user_id")?.value;

  return {
    accessToken,
    refreshToken,
    userId,
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
