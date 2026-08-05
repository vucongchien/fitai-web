import { Bell, Search } from "lucide-react";
import Link from "next/link";

type HeaderActionsProps = {
  hasNotifications?: boolean;
};

export function HeaderActions({ hasNotifications = true }: HeaderActionsProps) {
  return (
    <div className="header-actions">
      <Link
        aria-label="Search exercises"
        className="header-actions__button"
        href="/search"
        transitionTypes={["nav-forward"]}
      >
        <Search aria-hidden="true" size={18} strokeWidth={2} />
      </Link>
      <Link
        aria-label={hasNotifications ? "Notifications, unread items available" : "Notifications"}
        className="header-actions__button"
        data-badge={hasNotifications || undefined}
        href="/notifications"
        transitionTypes={["nav-forward"]}
      >
        <Bell aria-hidden="true" size={18} strokeWidth={2} />
      </Link>
    </div>
  );
}
