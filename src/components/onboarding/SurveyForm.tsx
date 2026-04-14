'use client';

import type { SurveyResponse } from '@/lib/types/career';

interface Props {
  value: SurveyResponse;
  onChange: (v: SurveyResponse) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}

interface SelectField {
  name: keyof SurveyResponse;
  label: string;
  type: 'select';
  options: Array<{ value: string; label: string }>;
}

interface TextField {
  name: keyof SurveyResponse;
  label: string;
  type: 'text';
}

type Field = SelectField | TextField;

const FIELDS: Field[] = [
  { name: 'years_releasing', label: 'Ha quanto tempo voce lanca musica?', type: 'select', options: [
    { value: 'lt_6m', label: 'Menos de 6 meses' },
    { value: '6m_1y', label: '6 meses a 1 ano' },
    { value: '1_3y', label: '1 a 3 anos' },
    { value: '3_5y', label: '3 a 5 anos' },
    { value: 'gt_5y', label: 'Mais de 5 anos' },
  ]},
  { name: 'shows_performed', label: 'Quantos shows ja fez?', type: 'select', options: [
    { value: '0', label: 'Nenhum' },
    { value: '1_10', label: '1 a 10' },
    { value: '10_50', label: '10 a 50' },
    { value: '50_200', label: '50 a 200' },
    { value: 'gt_200', label: 'Mais de 200' },
  ]},
  { name: 'lives_from_music', label: 'Voce vive de musica?', type: 'select', options: [
    { value: 'no', label: 'Nao' },
    { value: 'partial', label: 'Parcialmente' },
    { value: 'yes', label: 'Sim' },
  ]},
  { name: 'monthly_revenue', label: 'Receita mensal com musica', type: 'select', options: [
    { value: 'zero', label: 'R$ 0' },
    { value: '1k_2k', label: 'R$ 1k - 2k' },
    { value: '2k_5k', label: 'R$ 2k - 5k' },
    { value: '5k_15k', label: 'R$ 5k - 15k' },
    { value: 'gt_15k', label: 'R$ 15k+' },
  ]},
  { name: 'has_management', label: 'Voce tem empresario ou gravadora?', type: 'select', options: [
    { value: 'none', label: 'Nao' },
    { value: 'partnership', label: 'Tenho parceria' },
    { value: 'traditional', label: 'Sim, tradicional' },
  ]},
  { name: 'release_frequency', label: 'Frequencia de lancamento', type: 'select', options: [
    { value: 'sporadic', label: 'Esporadico' },
    { value: 'quarterly', label: 'A cada 3-6 meses' },
    { value: 'monthly', label: 'Mensal' },
    { value: 'weekly', label: 'Semanal' },
  ]},
  { name: 'main_goal_12m', label: 'Principal objetivo para os proximos 12 meses', type: 'select', options: [
    { value: 'discovery', label: 'Ser descoberto' },
    { value: 'grow_base', label: 'Crescer minha base' },
    { value: 'monetize', label: 'Monetizar' },
    { value: 'sign_contract', label: 'Assinar contrato' },
    { value: 'internationalize', label: 'Internacionalizar' },
  ]},
  { name: 'primary_genre', label: 'Genero primario (ex: indie rock, MPB, trap)', type: 'text' },
  { name: 'city', label: 'Cidade de atuacao', type: 'text' },
  { name: 'has_press_kit', label: 'Voce tem press kit?', type: 'select', options: [
    { value: 'none', label: 'Nao' },
    { value: 'basic', label: 'Basico' },
    { value: 'complete', label: 'Completo' },
  ]},
  { name: 'production_quality', label: 'Qualidade media da producao', type: 'select', options: [
    { value: 'home', label: 'Gravacao caseira' },
    { value: 'simple_studio', label: 'Estudio simples' },
    { value: 'professional', label: 'Estudio profissional' },
  ]},
  { name: 'rights_registration', label: 'Registro de direitos autorais', type: 'select', options: [
    { value: 'none', label: 'Nao tenho' },
    { value: 'partial', label: 'Parcial' },
    { value: 'complete', label: 'Completo' },
  ]},
];

export function SurveyForm({ value, onChange, onSubmit, onBack, submitting }: Props) {
  const update = (key: keyof SurveyResponse, v: string) => {
    onChange({ ...value, [key]: v } as SurveyResponse);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-2">Sobre sua carreira</h2>
      <p className="text-brand-muted mb-6">12 perguntas rapidas. Suas respostas calibram a analise.</p>
      <div className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.name}>
            <label className="block text-sm text-white/60 mb-1">{field.label}</label>
            {field.type === 'select' ? (
              <select
                value={value[field.name] as string}
                onChange={(e) => update(field.name, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-green/50"
              >
                {field.options.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={value[field.name] as string}
                onChange={(e) => update(field.name, e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-brand-green/50"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6">
        <button onClick={onBack} disabled={submitting} className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl disabled:opacity-50">Voltar</button>
        <button onClick={onSubmit} disabled={submitting} className="flex-1 px-4 py-3 bg-gradient-to-r from-brand-green to-brand-green/80 text-black font-bold rounded-xl disabled:opacity-50">
          {submitting ? 'Gerando diagnostico...' : 'Gerar diagnostico'}
        </button>
      </div>
    </div>
  );
}
