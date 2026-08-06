export function ExerciseMetaRow({
  currentSet,
  name,
  target,
  totalSets,
}: {
  name: string;
  target: string;
  currentSet: number;
  totalSets: number;
}) {
  return (
    <div className="live-meta">
      <div className="live-meta__col">
        <p className="live-meta__name">{name}</p>
        <p className="live-meta__target">{target}</p>
      </div>

      <div className="live-meta__col live-meta__col--end">
        <p className="live-meta__sets">
          {currentSet} / {totalSets} {totalSets === 1 ? "Set" : "Sets"}
        </p>
      </div>
    </div>
  );
}
