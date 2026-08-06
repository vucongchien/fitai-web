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
      {/* Row one: what you are doing, and where you are in it. The name is a
          paragraph, not a heading — the header already carries it as the page's
          h1, and a second heading with identical text is noise in a screen
          reader's outline. */}
      <div className="live-meta__top">
        <p className="live-meta__name">{name}</p>

        {/* Spaces sit inside the spans, not in a flex gap, so the text reads
            as "1 / 3 Sets" to a screen reader as well as on screen. */}
        <p className="live-meta__sets">
          <span className="live-meta__sets-current">{currentSet}</span>
          <span className="live-meta__sets-total">
            {" / "}
            {totalSets} {totalSets === 1 ? "Set" : "Sets"}
          </span>
        </p>
      </div>

      {/* Row two: the prescription, on its own line so a long exercise name
          never squeezes it out. */}
      <p className="live-meta__target">{target}</p>
    </div>
  );
}
