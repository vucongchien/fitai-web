import type { MacroReading } from "@/features/nutrition/model/nutrition-page.types";
import { toPercentage } from "@/shared/ui/charts/circular-progress";

type MacroRowProps = {
  macros: MacroReading[];
};

/**
 * Macros as stacked bars rather than tiles: the shared baseline makes the three
 * comparable at a glance, which a row of separate cards cannot do.
 */
export function MacroRow({ macros }: MacroRowProps) {
  return (
    <ul className="macro-list">
      {macros.map((macro) => {
        const percentage = macro.targetGrams ? toPercentage(macro.grams, macro.targetGrams) : null;

        return (
          <li className="macro-list__item" key={macro.label}>
            <span className="macro-list__label">{macro.label}</span>

            <span className="macro-list__reading">
              <strong className="data-value">{macro.grams.toLocaleString()}</strong>
              <span className="macro-list__unit">g</span>
              {macro.targetGrams === null ? null : (
                <span className="macro-list__target data-value">
                  / {macro.targetGrams.toLocaleString()}g
                </span>
              )}
            </span>

            {percentage === null ? (
              <span className="macro-list__no-target">No target set</span>
            ) : (
              <div
                aria-label={`${macro.label}: ${macro.grams} of ${macro.targetGrams} grams`}
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={percentage}
                className="macro-list__track"
                role="progressbar"
              >
                <span style={{ inlineSize: `${percentage}%` }} />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
