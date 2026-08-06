import { PainStopView } from "@/features/workout/ui/live/pain-stop-view";

export const metadata = { title: "Session stopped | FITAI" };

/**
 * Where a pain-stopped session lands instead of the summary. It is a route of
 * its own so the back-stack behaves: the live screen is replaced, and reloading
 * or sharing the URL never resurrects a session that was deliberately ended.
 *
 * `params` is deliberately not read. The screen shows no session data — that is
 * the whole point of it — so touching `params` would opt the route out of being
 * prerendered under Cache Components for nothing in return.
 */
export default function SessionStoppedPage() {
  return <PainStopView />;
}
