interface ChartEmptyProps {
  height: number;
  message: string;
}

/**
 * Holds a chart's footprint when nothing is logged. A flat baseline reads as absent data;
 * a line dropping to zero would read as a measured zero.
 */
export function ChartEmpty({ height, message }: ChartEmptyProps) {
  return (
    <div className="chart-empty" style={{ height: `${height}px` }}>
      <span aria-hidden="true" className="chart-empty__baseline" />
      <p>{message}</p>
    </div>
  );
}
