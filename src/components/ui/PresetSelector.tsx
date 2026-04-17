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
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
