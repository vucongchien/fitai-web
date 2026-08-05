import { Trophy } from "lucide-react";

import { getTopPersonalRecords } from "../model/progress-aggregator";
import type { PersonalRecord } from "../model/types";

type PersonalRecordsCardProps = {
  records: PersonalRecord[];
};

export function PersonalRecordsCard({ records }: PersonalRecordsCardProps) {
  const topRecords = getTopPersonalRecords(records, 3);

  return (
    <div className="bento-card bento-card--prs p-5 rounded-[14px] bg-[var(--color-clear-white,#FFFFFF)] border border-[var(--color-mist,#ECEEF0)] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-blue-tint,#EEF0FF)] flex items-center justify-center text-[var(--color-relay-blue,#4B57F2)]">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-graphite,#50565C)]">
            Personal Records
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[var(--color-relay-blue,#4B57F2)]">Best Performances</span>
      </div>

      {topRecords.length === 0 ? (
        <p className="text-xs text-[var(--color-graphite,#50565C)] py-2">No personal records logged yet.</p>
      ) : (
        <div className="space-y-2.5">
          {topRecords.map((pr) => (
            <div
              className="flex items-center justify-between p-2.5 rounded-[10px] bg-[var(--color-soft-paper,#F7F8F6)] border border-[var(--color-mist,#ECEEF0)]"
              key={pr.id}
            >
              <span className="text-xs font-semibold text-[var(--color-true-ink,#101214)]">{pr.exerciseName}</span>
              <span className="font-mono text-xs font-bold text-[var(--color-relay-blue,#4B57F2)] tabular-nums bg-[var(--color-blue-tint,#EEF0FF)] px-2 py-0.5 rounded-[6px]">
                {pr.metric}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
