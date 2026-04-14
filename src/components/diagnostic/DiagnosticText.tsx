import type { DiagnosticText as DT } from '@/lib/types/career';

interface Props { text: DT }

export function DiagnosticText({ text }: Props) {
  return (
    <div className="space-y-6">
      <div className="bg-brand-surface rounded-2xl p-8 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Diagnostico</h2>
        <p className="text-white/80 leading-relaxed">{text.summary}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Section title="Pontos Fortes" items={text.strengths} color="green" />
        <Section title="Pontos de Atencao" items={text.weaknesses} color="orange" />
        <Section title="Oportunidades" items={text.opportunities} color="purple" />
      </div>
    </div>
  );
}

function Section({ title, items, color }: { title: string; items: string[]; color: 'green' | 'orange' | 'purple' }) {
  const colorClass = color === 'green' ? 'text-brand-green' : color === 'orange' ? 'text-brand-orange' : 'text-brand-purple';
  return (
    <div className="bg-brand-surface rounded-xl p-6 border border-white/10">
      <h3 className={`text-lg font-bold mb-4 ${colorClass}`}>{title}</h3>
      <ul className="space-y-3 text-sm text-white/80">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className={colorClass}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
