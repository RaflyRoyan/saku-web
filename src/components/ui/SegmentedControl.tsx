import { fokus } from "./Button";

interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({ label, value, options, onChange }: SegmentedControlProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex rounded-xl bg-brand-50 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${fokus} ${
              active ? "bg-white text-brand-700 shadow-sm" : "text-stone-500 hover:text-stone-700"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
