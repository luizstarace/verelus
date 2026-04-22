'use client';

export interface Preset<T> {
  label: string;
  description?: string;
  values: T;
}

interface Props<T> {
  presets: Preset<T>[];
  onSelect: (values: T) => void;
  label?: string;
}

export function PresetSelector<T>({ presets, onSelect, label = 'Comecar com um preset' }: Props<T>) {
  return (
    <div>
      <p className="text-xs font-mono uppercase tracking-wider text-brand-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {presets.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(p.values)}
            title={p.description}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-brand-border bg-brand-surface text-brand-muted hover:bg-brand-surface hover:text-brand-text hover:border-brand-border transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
