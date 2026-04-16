'use client';

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: Props) {
  return (
    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
      <span className="text-red-400 text-lg shrink-0">!</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-red-300">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs font-mono uppercase tracking-wider text-red-400 hover:text-red-300 transition-colors"
          >
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}
