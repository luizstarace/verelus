interface Props {
  current: number;
  max: number;
}

export function CharCounter({ current, max }: Props) {
  const pct = (current / max) * 100;
  const color = pct > 95 ? 'text-orange-400' : pct > 80 ? 'text-yellow-400' : 'text-brand-muted';
  return (
    <span className={`text-xs font-mono ${color}`}>
      {current}/{max}
    </span>
  );
}
