import { notFound } from "next/navigation";

import { PainStopView } from "@/features/workout/ui/live/pain-stop-view";

export const metadata = { title: "Session stopped | FITAI" };

/**
 * Where a pain-stopped session lands instead of the summary. It is a route of
 * its own so the back-stack behaves: the live screen is replaced, and reloading
 * or sharing the URL never resurrects a session that was deliberately ended.
 */
export default async function SessionStoppedPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  if (!sessionId || typeof sessionId !== "string" || sessionId.trim() === "") {
    notFound();
  }

  return <PainStopView />;
}
