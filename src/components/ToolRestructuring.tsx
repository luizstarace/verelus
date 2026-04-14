import Link from 'next/link';

export function ToolRestructuring({ name }: { name: string }) {
  return (
    <div className="min-h-screen bg-brand-dark text-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">{name} esta em reestruturacao</h1>
        <p className="text-brand-muted mb-8">
          Estamos refocando o Verulus em inteligencia de carreira. Essa ferramenta volta em breve, muito melhor e contextualizada com o seu diagnostico.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl"
        >
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}
