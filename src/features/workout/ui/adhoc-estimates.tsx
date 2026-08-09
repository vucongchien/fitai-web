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
  if (exerciseCount === 0) {
    return (
      <div className="session-facts adhoc-estimates-bottom">
        <span>
          <Clock3 aria-hidden="true" size={17} />
          0 min estimated
        </span>
        <span>
          <Gauge aria-hidden="true" size={17} />
          0 movements
        </span>
        <span>Target -- RPE</span>
      </div>
    );
  }

  return (
    <div className="session-facts adhoc-estimates-bottom">
      <span>
        <Clock3 aria-hidden="true" size={17} />~{estimatedDuration} min estimated
      </span>
      <span>
        <Gauge aria-hidden="true" size={17} />
        {exerciseCount} {exerciseCount === 1 ? "movement" : "movements"}
      </span>
      <span>Target {targetRpe} RPE</span>
    </div>
  );
}
