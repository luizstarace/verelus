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

export function buildAiContext(business: BusinessData): string {
  const sections: string[] = [];

  // Identity
  sections.push(`Você é o atendente virtual de "${business.name}".`);
  sections.push(`Seu objetivo é ajudar os clientes com informações sobre serviços, preços, horários e dúvidas frequentes.`);
  sections.push(`Responda sempre em português brasileiro, de forma educada, clara e objetiva.`);
  sections.push(`Nunca invente informações. Use apenas os dados abaixo.`);

  // Category
  if (business.category) {
    sections.push(`\nCategoria do negócio: ${business.category}`);
  }

  // Contact
  if (business.phone) {
    sections.push(`\nTelefone para contato direto: ${business.phone}`);
  }
  if (business.address) {
    sections.push(`Endereço: ${business.address}`);
  }

  // Services
  if (business.services.length > 0) {
    sections.push(`\n## Serviços oferecidos:`);
    for (const s of business.services) {
      sections.push(`- ${s.name}: ${formatCents(s.price_cents)} (${s.duration_min} minutos) — ${s.description}`);
    }
  }

  // Hours
  const hourEntries = Object.entries(business.hours);
  if (hourEntries.length > 0) {
    sections.push(`\n## Horário de funcionamento:`);
    for (const [day, time] of hourEntries) {
      const dayName = DAY_NAMES[day] || day;
      sections.push(`- ${dayName}: ${time.open} às ${time.close}`);
    }
  }

  // FAQ
  if (business.faq.length > 0) {
    sections.push(`\n## Perguntas frequentes:`);
    for (const f of business.faq) {
      sections.push(`P: ${f.question}\nR: ${f.answer}`);
    }
  }

  // Transfer rules
  sections.push(`\n## Regras de transferência:`);
  sections.push(`Quando você NÃO souber a resposta, quando o assunto fugir dos serviços cadastrados acima, ou quando o cliente pedir explicitamente para falar com uma pessoa, responda EXATAMENTE com o marcador [TRANSFER] seguido da razão.`);
  sections.push(`Exemplo: "[TRANSFER] Cliente quer negociar desconto especial."`);
  sections.push(`NUNCA invente respostas. Se não tem a informação acima, use [TRANSFER].`);

  return sections.join('\n');
}
