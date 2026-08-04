import { Flame } from "lucide-react";

type TodayHeaderProps = {
  dateLabel?: string;
  streakDays?: number;
};

export function TodayHeader({
  dateLabel = "Today",
  streakDays = 4,
}: TodayHeaderProps) {
  return (
    <header className="today-header">
      <div className="today-header__titles">
        <h1 className="display-title">{dateLabel}</h1>
      </div>

      <div className="today-header__badges">
        <div className="streak-badge" title={`${streakDays} consecutive training days`}>
          <Flame aria-hidden="true" className="streak-badge__icon" size={16} />
          <span>{streakDays}-day streak</span>
        </div>
      </div>
    </header>
  );
}
