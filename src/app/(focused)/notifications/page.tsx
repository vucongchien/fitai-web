import { ArrowLeft, Bell, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";

import { BrandMark } from "@/shared/ui/brand-mark";
import { HeaderActions } from "@/shared/ui/header-actions";

export const metadata = { title: "Notifications" };

type NotificationItem = {
  id: string;
  icon: "coach" | "pr" | "plan";
  title: string;
  body: string;
  time: string;
  read: boolean;
};

const ITEMS: NotificationItem[] = [
  {
    id: "n1",
    icon: "pr",
    title: "Personal record",
    body: "Supported dumbbell row — 22 kg × 8 reps. Nicely done.",
    time: "2h ago",
    read: false,
  },
  {
    id: "n2",
    icon: "coach",
    title: "Coach adjusted Wednesday",
    body: "Lightened the top set because RPE ran high on Monday.",
    time: "Yesterday",
    read: false,
  },
  {
    id: "n3",
    icon: "plan",
    title: "Roadmap refreshed",
    body: "Week 3 now emphasises the posterior chain.",
    time: "3d ago",
    read: true,
  },
];

const ICON = {
  coach: Sparkles,
  pr: Trophy,
  plan: Bell,
} as const;

export default function NotificationsPage() {
  return (
    <div className="focused-page">
      <header className="focused-header">
        <Link
          aria-label="Back"
          className="focused-header__back"
          href="/home"
          transitionTypes={["nav-back"]}
        >
          <ArrowLeft aria-hidden="true" size={20} />
        </Link>
        <BrandMark />
        <HeaderActions hasNotifications={false} />
      </header>

      <main className="focused-main">
        <header className="page-hero">
          <h1 className="page-hero__title">Notifications</h1>
          <p className="page-hero__lede">Coach messages, milestones, and plan updates.</p>
        </header>

        <ol className="notification-list">
          {ITEMS.map((item) => {
            const Icon = ICON[item.icon];
            return (
              <li className="notification-item" data-unread={!item.read || undefined} key={item.id}>
                <span className="notification-item__icon" aria-hidden="true">
                  <Icon size={18} />
                </span>
                <div className="notification-item__body">
                  <div className="notification-item__head">
                    <strong>{item.title}</strong>
                    <span>{item.time}</span>
                  </div>
                  <p>{item.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </main>
    </div>
  );
}
