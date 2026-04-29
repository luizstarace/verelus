interface BusinessData {
  name: string;
  category: string | null;
  phone: string | null;
  address: string | null;
  services: { name: string; price_cents: number; duration_min: number; description: string }[];
  hours: Record<string, { open: string; close: string }>;
  faq: { question: string; answer: string }[];
}

const DAY_NAMES: Record<string, string> = {
  mon: 'Segunda', tue: 'Terça', wed: 'Quarta',
  thu: 'Quinta', fri: 'Sexta', sat: 'Sábado', sun: 'Domingo',
};

function formatCents(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

// Sanitize user-entered fields before embedding into system prompt:
// - strip any occurrences of the [TRANSFER] marker (user-controlled data must not
//   be able to inject the signal that escalates a conversation to human)
// - neutralize markdown section breaks (## at line start) that could be parsed as
//   new context sections by the model
// - clamp length (defense in depth against oversized inputs)
function sanitize(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/\[TRANSFER\]/gi, '[transfer-]')
    .replace(/^\s*#+\s/gm, '- ')
    .replace(/```/g, '``')
    .slice(0, maxLen)
    .trim();
}

export function buildAiContext(business: BusinessData): string {
  const sections: string[] = [];

  // Identity
  const name = sanitize(business.name, 200) || 'seu negócio';
  sections.push(`Você é o atendente virtual de "${name}".`);
  sections.push(`Seu objetivo é ajudar os clientes com informações sobre serviços, preços, horários e dúvidas frequentes.`);
  sections.push(`Responda sempre em português brasileiro, de forma educada, clara e objetiva.`);
  sections.push(`Nunca invente informações. Use apenas os dados abaixo.`);

  // Category
  if (business.category) {
    sections.push(`\nCategoria do negócio: ${sanitize(business.category, 100)}`);
  }

  // Contact
  if (business.phone) {
    sections.push(`\nTelefone para contato direto: ${sanitize(business.phone, 30)}`);
  }
  if (business.address) {
    sections.push(`Endereço: ${sanitize(business.address, 300)}`);
  }

  // Services
  if (business.services.length > 0) {
    sections.push(`\n## Serviços oferecidos:`);
    for (const s of business.services) {
      const sname = sanitize(s.name, 150);
      const sdesc = sanitize(s.description, 500);
      sections.push(`- ${sname}: ${formatCents(s.price_cents)} (${s.duration_min} minutos) — ${sdesc}`);
    }
  }

  // Hours
  const hourEntries = Object.entries(business.hours || {});
  if (hourEntries.length > 0) {
    sections.push(`\n## Horário de funcionamento:`);
    for (const [day, time] of hourEntries) {
      if (!time || typeof time !== 'object') continue;
      const dayName = DAY_NAMES[day] || day;
      const open = typeof time.open === 'string' ? time.open : '??:??';
      const close = typeof time.close === 'string' ? time.close : '??:??';
      sections.push(`- ${dayName}: ${open} às ${close}`);
    }
  }

  // FAQ
  if (business.faq.length > 0) {
    sections.push(`\n## Perguntas frequentes:`);
    for (const f of business.faq) {
      sections.push(`P: ${sanitize(f.question, 300)}\nR: ${sanitize(f.answer, 1000)}`);
    }
  }

  // Transfer rules
  sections.push(`\n## Regras de transferência:`);
  sections.push(`Quando você NÃO souber a resposta, quando o assunto fugir dos serviços cadastrados acima, ou quando o cliente pedir explicitamente para falar com uma pessoa, responda EXATAMENTE com o marcador [TRANSFER] seguido da razão.`);
  sections.push(`Exemplo: "[TRANSFER] Cliente quer negociar desconto especial."`);
  sections.push(`NUNCA invente respostas. Se não tem a informação acima, use [TRANSFER].`);

  return sections.join('\n');
}
