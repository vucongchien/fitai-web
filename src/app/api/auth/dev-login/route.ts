import crypto from "crypto";
import { NextResponse } from "next/server";

import { createAuthCookieOptions } from "@/shared/auth/cookies";

const DEV_RSA_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQC3HRmo/AtDQSK1
ItX5bgXCTUZleQOdmHE5ISdhwNsLp13eM335QwH/z58XnQnjnTfBu220XYv7kfC3
TClALg0ZKMI1w+wY4ZsHff8h2HHHEK93nNJQdUJGxBK21tS+vUvrkCecLU7LvhyF
XsBYugnSbotx+utVKIMBrGW8g+X3aU9cVvjTN7jjOKcMt+1XQZBlnir78kCQl4Zu
jxL9jTxl7ELfeVGc1U06BYUmXPSYYRWgcqQM5hkfzWwIIvnWFjvQKw6cePk1di2n
StKU+E7xd/icbMpQB/bakmMFI9EwVowVAPiFbBgz5OF0AUJnu+N+OnWut429NcJf
yZrmb0LZAgMBAAECggEADm4MIh1uk8ezwPt0Sjop2QR26jMtnkMvlPVwYYstl88C
HisHn9dwdmS5oEY/S8ENbkZjYEXI7LO0+PTXAVg/rv5fw5XjapiIu3/p1ZR1bt75
PN9OUYnUBbiY0vC+BiPrsi4DeRK29WZPYBE17igG8x7D/WDtH6JYJI8d20u3mRYA
w7YAQEDy4NTi9atN4TIEu1w9tsqwq26nV6XUGGSE5wlDHRtBEqnTf2PI8xAYt0h4
838GhUS0Bu7KHINJUs9fo4rEVdl53uWN/nKEYneWBFz0o9KKWFrE+98DkPky5ZW4
hvfdiUYWtGEIenQJ34t7YJL7cTL0ZhtAyZRhTa9kAwKBgQDiBfIN2Bcxb/zHB+p3
1ieDULJnpC2mhX7BwmtYrpvgpp/w92ubb6SvmhmH9GuX2J6Gmeq2zHxm0t7euTzq
3CL9F8emhdtU0KMHJkUdH6w41GMAt6BpmkaSVojKKjKVxJteaDSFWxocKFxDaJ0P
d1tkRMnWGejrioq+TL+01duESwKBgQDPZkSZxicKeOvUyeBkWne3NYnvQm7mBt4K
OlH9ESyHg5vSTBDgCrHb/y4F7UMv63IlWHhPx9Mj6ASiA1w9UZp+chRALewyyaCe
u+KY7pHUvACFWbLEWWcC4d8+SwFMiG0G7WSAyjlmOUyL7Xm+0a0Pd8e3MSdIf91P
IWFxku826wKBgAz2yFZw8YudX8NOue0btHJ8u27kZNXrTETy0NNqWHh/NidNGbf1
pF2KGjLJGy6/dwBDbcoEWpJPQAdIWq0h6UPZDFOJ0/W+bctoL4inG2q7C96rqaDE
/40/N2NZHkOm3j6A/Zo0in/Y9MnNA00yzGQo6ebE36466RBXOJu3tHqXAoGAfwi3
EDFtDF8QpF+a0B0RouhqOmDIqKCgNEeQnJ9+VOrp8J+i3nfuhUACIqM3OgzO98z+
tG9DBoVBATNpti1bogOiH8WBHYKenVub6eyG6nTVJNjSRK42CG/tW6x5eTU/ArU5
kCFNky2Zk0O8BINNq2HEtJKo6yFWnvdlRjmnyE0CgYAfCYd1RExmWSGri2Nlz46F
1T8zNwUY70t8sHfOLTPjMCKhCvVqSl3tNd4mT2P/0mmulJ9fkd1OHRBbMmwFY49E
v1Ri+OqHpV1KmHCwgfFxeZtDzztRO/G9TzwN4TkEjGvWCleXfyn4MWwJ2nl6Io3n
LPgsvf29iimBLGlQeSJPdw==
-----END PRIVATE KEY-----`;

function generateDevJWT(userId: string, role = "user"): string {
  const header = {
    alg: "RS256",
    typ: "JWT",
    kid: "91ecc9f5-6b30-406f-abaa-d3119bb6051b",
  };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: "fitai-app",
    sub: userId,
    role: role,
    iat: now,
    exp: now + 30 * 24 * 3600,
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signInput = `${b64Header}.${b64Payload}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signInput);
  const signature = signer.sign(DEV_RSA_PRIVATE_KEY, "base64url");

  return `${signInput}.${signature}`;
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not Found", { status: 404 });
  }

  const { searchParams, origin } = new URL(request.url);
  const target = searchParams.get("target") ?? "new";

  const dest = target === "existing" ? "/home" : "/onboarding";
  const userId =
    target === "existing"
      ? "00000000-0000-0000-0000-000000000002"
      : "00000000-0000-0000-0000-000000000001";

  const response = NextResponse.redirect(new URL(dest, origin));
  const token = generateDevJWT(userId, "user");

  response.cookies.set(
    "fitai_access_token",
    token,
    createAuthCookieOptions({ maxAge: 60 * 60 }),
  );
  response.cookies.set(
    "fitai_refresh_token",
    `mock_dev_refresh_token_${userId}`,
    createAuthCookieOptions({ maxAge: 60 * 60 * 24 }),
  );
  response.cookies.set("fitai_user_id", userId, createAuthCookieOptions({ maxAge: 60 * 60 * 24 }));

  console.info(`[dev-login] Mock login triggered for target=${target} -> dest=${dest}`);

  return response;
}
