import { Clock3, Gauge } from "lucide-react";

interface AdhocEstimatesProps {
  estimatedDuration: number;
  exerciseCount: number;
  targetRpe: number;
}

export function AdhocEstimates({
  estimatedDuration,
  exerciseCount,
  targetRpe,
}: AdhocEstimatesProps) {
  return (
    <div className="session-facts adhoc-estimates-bottom">
      <span>
        <Clock3 aria-hidden="true" size={17} />~{estimatedDuration} min estimated
      </span>
      <span>
        <Gauge aria-hidden="true" size={17} />
        {exerciseCount} movements
      </span>
      <span>Target {targetRpe} RPE</span>
    </div>
  );
}
