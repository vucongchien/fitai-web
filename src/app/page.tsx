import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { resolveEntryRoute } from "@/shared/auth/route-decision";

export default async function IndexPage() {
  const cookieStore = await cookies();
  const hasValidSession = Boolean(
    cookieStore.get("fitai_access_token") || cookieStore.get("fitai_preview_session"),
  );
  const profileCompletionRate = Number(
    cookieStore.get("fitai_profile_completion")?.value ?? "0",
  );
  const hasActiveRoadmap = cookieStore.get("fitai_active_roadmap")?.value === "true";

  redirect(resolveEntryRoute({ hasActiveRoadmap, hasValidSession, profileCompletionRate }));
}
