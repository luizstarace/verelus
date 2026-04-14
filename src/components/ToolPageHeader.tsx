import Link from 'next/link';

interface Props {
  title: string;
  description: string;
  icon?: React.ReactNode;
  accent?: 'green' | 'purple' | 'orange' | 'blue';
}

/**
 * Cabecalho padrao de cada pagina de ferramenta.
 * Breadcrumb + titulo + subtitulo com acento colorido.
 */
export function ToolPageHeader({ title, description, icon, accent = 'green' }: Props) {
  const accentClass = {
    green: 'bg-brand-green',
    purple: 'bg-brand-purple',
    orange: 'bg-brand-orange',
    blue: 'bg-blue-500',
  }[accent];

  return (
    <div className="mb-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-brand-muted hover:text-white transition-colors mb-6 group"
      >
        <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
        <span>Voltar para ferramentas</span>
      </Link>

      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/80">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-1 h-6 rounded-full ${accentClass}`} />
            <h1 className="text-3xl font-bold text-white tracking-tight">{title}</h1>
          </div>
          <p className="text-brand-muted leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
