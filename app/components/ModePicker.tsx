import { memo } from "react";
import { ROAST_MODES, type RoastModeId } from "@/lib/roast/roast-modes";

export const ModePicker = memo(function ModePicker({
  value,
  onChange,
  disabled,
}: {
  value: RoastModeId;
  onChange: (mode: RoastModeId) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <span className="font-mono text-xs uppercase tracking-widest text-muted">
        roast_mode:
      </span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {Object.values(ROAST_MODES).map((roastMode) => {
          const active = roastMode.id === value;
          return (
            <button
              key={roastMode.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(roastMode.id)}
              aria-pressed={active}
              className={`rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-wide transition-colors disabled:opacity-60 ${
                active
                  ? "border-transparent bg-gradient-to-r from-flame-orange to-flame-red text-background"
                  : "border-white/15 text-muted hover:border-white/30 hover:text-foreground"
              }`}
            >
              {roastMode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});
