"use client";

interface TodayHeaderProps {
  dateLabel?: string;
}

export function TodayHeader({ dateLabel = "Hôm nay" }: TodayHeaderProps) {
  return (
    <header className="today-header px-5 sm:px-6 pt-6 pb-2">
      <div className="today-header__titles">
        <h1 className="display-title">{dateLabel}</h1>
      </div>
      <div className="today-header__badges" id="today-header-badges" />
    </header>
  );
}
