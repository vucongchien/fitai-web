import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const backendUrl = process.env.FITAI_RPC_URL || "http://localhost:8080";
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("fitai_access_token")?.value || "dev-client";
    const res = await fetch(
      `${backendUrl}/api/v1/execution/wt-config?token=${encodeURIComponent(token)}`,
      {
        cache: "no-store",
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch wt-config from backend" },
        { status: res.status },
      );
    }
    const data = await res.json();
    return NextResponse.json({
      ...data,
      token,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Backend wt-config unreachable",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
