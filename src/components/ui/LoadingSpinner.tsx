interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZE_CLASS = {
  sm: 'w-4 h-4 border',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-2',
};

export function LoadingSpinner({ size = 'md', label }: Props) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`${SIZE_CLASS[size]} border-brand-trust border-t-transparent rounded-full animate-spin`} />
      {label && <span className="text-sm text-brand-muted">{label}</span>}
    </div>
  );
}
