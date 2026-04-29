// Per-vertical landing-page config consumed by AtalaiaLanding.
// Each vertical reuses the same shell (nav / tech-trust / pricing / etc.)
// and only differentiates: H1, hero subtitle, FAQ, canonical, breadcrumb.

import type { ReactNode } from 'react';

export type FaqEntry = { q: string; a: string };

export type VerticalConfig = {
  slug: string;            // 'atalaia' (main) | 'salao' | 'clinica' | 'restaurante' | 'academia'
  canonicalPath: string;   // '/atalaia' or '/atalaia/salao' etc.
  breadcrumbName: string;  // label in the BreadcrumbList JSON-LD
  heroH1: ReactNode;       // can include <span> / <br/> for accent
  heroSubtitle: string;
  faq: FaqEntry[];
};

const sharedFaq: FaqEntry[] = [
  { q: 'Preciso saber programar?', a: 'Não. Zero código. Você preenche um formulário simples com informações do seu negócio, e a IA faz o resto. Leva menos de 5 minutos.' },
  { q: 'Quanto tempo leva pra configurar?', a: 'Em média 5 minutos. Você cadastra seus serviços, preços e horários, e o atendente já está pronto pra funcionar.' },
  { q: 'E se o atendente errar?', a: 'Você acompanha todas as conversas no dashboard e pode corrigir a qualquer momento. A IA aprende com cada ajuste.' },
  { q: 'Meus dados estão seguros?', a: 'Sim. Usamos criptografia ponta a ponta e estamos em total conformidade com a LGPD. Seus dados e os dos seus clientes estão protegidos.' },
  { q: 'Posso cancelar quando quiser?', a: 'Sim, 2 cliques no painel. Sem multa, sem burocracia, sem período de fidelidade.' },
  { q: 'Funciona com WhatsApp?', a: 'Sim. O Atalaia funciona tanto no WhatsApp quanto via widget no seu site. Seus clientes escolhem onde preferem falar.' },
  { q: 'O atendente responde em outros idiomas?', a: 'Sim. A IA detecta o idioma do cliente e responde automaticamente. Ideal se você recebe turistas ou clientes internacionais.' },
  { q: 'O que é a "voz natural" mencionada no plano Pro e Business?', a: 'Síntese de voz feita pela ElevenLabs (provedor especializado, mesma tecnologia usada por podcasts e audiobooks profissionais). O atendente pode mandar áudios em português brasileiro nas respostas. Você escolhe entre 6 vozes prontas (3 femininas, 3 masculinas). O preview funciona em qualquer plano — você ouve antes de assinar.' },
  { q: 'Tem risco de o WhatsApp banir o número conectado?', a: 'Sim, é um risco real. Conexões via API podem ser banidas pelo WhatsApp se o número for novo, pessoal, ou se comportar de forma muito automatizada. Recomendamos um chip dedicado ao negócio com 30+ dias de uso normal antes de conectar. Mostramos esse aviso explícito no momento da conexão.' },
];

export const mainConfig: VerticalConfig = {
  slug: 'atalaia',
  canonicalPath: '/atalaia',
  breadcrumbName: 'Atalaia',
  heroH1: (
    <>
      Seu negócio nunca mais perde cliente
      <br className="hidden sm:block" />
      <span className="text-brand-trust"> por falta de atendimento</span>
    </>
  ),
  heroSubtitle:
    'Uma IA que responde no WhatsApp e no seu site como se fosse você. Agenda, tira dúvidas e vende — mesmo de madrugada.',
  faq: sharedFaq,
};

export const salaoConfig: VerticalConfig = {
  slug: 'salao',
  canonicalPath: '/atalaia/salao',
  breadcrumbName: 'Salão de beleza',
  heroH1: (
    <>
      Atendente IA 24/7 para
      <br className="hidden sm:block" />
      <span className="text-brand-trust"> salão de beleza e barbearia</span>
    </>
  ),
  heroSubtitle:
    'Sua cliente quer marcar manicure às 22h? O Atalaia responde no WhatsApp e no site do salão, agenda e confirma — sem você precisar olhar o celular.',
  faq: [
    { q: 'O atendente sabe agendar manicure, corte, coloração e outros serviços?', a: 'Sim. Você cadastra cada serviço com duração e preço; a IA aprende e oferece o que faz sentido pra dúvida da cliente.' },
    { q: 'E se cada profissional tem agenda diferente?', a: 'Você pode definir horários gerais do salão. Para agenda por profissional individual, recomendamos integrar com seu sistema atual (estamos lançando integrações nativas em breve).' },
    { q: 'O atendente confirma o agendamento de véspera?', a: 'Sim. Configure mensagens automáticas de confirmação 24h antes — reduz drasticamente o no-show.' },
    { q: 'Cliente pergunta o preço, ele responde?', a: 'Responde, com base na lista de serviços que você cadastrou. Atualizou o preço? É só editar uma vez no painel.' },
    { q: 'E se a cliente quer remarcar ou cancelar?', a: 'O atendente recebe a solicitação e te avisa. Você confirma a remarcação no seu sistema de agenda atual.' },
    ...sharedFaq.slice(0, 4),
  ],
};

export const clinicaConfig: VerticalConfig = {
  slug: 'clinica',
  canonicalPath: '/atalaia/clinica',
  breadcrumbName: 'Clínicas e consultórios',
  heroH1: (
    <>
      Atendente IA 24/7 para
      <br className="hidden sm:block" />
      <span className="text-brand-trust"> clínicas e consultórios</span>
    </>
  ),
  heroSubtitle:
    'Pacientes marcam consulta a qualquer hora pelo WhatsApp. O Atalaia responde com seus horários reais e libera sua recepcionista pra cuidar de quem está na clínica.',
  faq: [
    { q: 'Funciona pra clínica médica, consultório odontológico, fisioterapia, psicologia?', a: 'Sim, qualquer prática que receba marcações por WhatsApp. Você define os tipos de consulta, horários e perguntas frequentes.' },
    { q: 'O atendente sabe diferenciar dúvida clínica de agendamento?', a: 'Sim. Para qualquer pergunta sobre saúde, sintoma ou tratamento, o Atalaia transfere automaticamente pra um profissional humano em vez de inventar resposta.' },
    { q: 'Como integra com Doctoralia, iClinic ou meu sistema da clínica?', a: 'Hoje o atendente recebe a solicitação e você confirma manualmente no seu sistema. Integrações nativas com sistemas de gestão estão na roadmap.' },
    { q: 'LGPD para dados sensíveis de saúde — está em compliance?', a: 'Sim. Dados criptografados em trânsito e em repouso, hospedagem no Brasil, retenção configurável e direito de exclusão garantido. Veja nossa página de privacidade pra detalhes.' },
    { q: 'O atendente envia receita ou atestado?', a: 'Não — isso fica com o profissional. O atendente apenas qualifica a solicitação ("posso te transferir pro Dr. X agora") e te avisa.' },
    ...sharedFaq.slice(0, 4),
  ],
};

export const restauranteConfig: VerticalConfig = {
  slug: 'restaurante',
  canonicalPath: '/atalaia/restaurante',
  breadcrumbName: 'Restaurantes e delivery',
  heroH1: (
    <>
      Atendente IA 24/7 para
      <br className="hidden sm:block" />
      <span className="text-brand-trust"> restaurantes e delivery</span>
    </>
  ),
  heroSubtitle:
    'Cardápio, reservas e pedidos respondidos em segundos. Cliente não fica esperando, mesmo na hora do pico — e você não perde venda por falta de atenção.',
  faq: [
    { q: 'Atende cardápio, faz reserva e pega pedido pra delivery?', a: 'Sim. Você cadastra o cardápio (com preços e descrição), define se aceita reserva e como funciona delivery, e o atendente atende cada caso de acordo.' },
    { q: 'E se algum prato acabou no dia?', a: 'Você marca como indisponível direto no painel — leva 5 segundos. O atendente para de oferecê-lo até você reativar.' },
    { q: 'Funciona se eu uso iFood ou Rappi paralelamente?', a: 'Sim. O Atalaia cuida do canal direto (WhatsApp + site). Os apps continuam normais. Cliente que vem direto evita a comissão dos apps.' },
    { q: 'Cliente pergunta se entrega no bairro X — atende?', a: 'Sim, com base na área de entrega que você cadastrou. Fora da área, o atendente explica isso de forma educada.' },
    { q: 'No horário de pico aguenta múltiplas conversas simultâneas?', a: 'Sim, sem limite. A IA processa cada conversa em paralelo, então 50 clientes ao mesmo tempo recebem resposta na mesma velocidade.' },
    ...sharedFaq.slice(0, 4),
  ],
};

export const academiaConfig: VerticalConfig = {
  slug: 'academia',
  canonicalPath: '/atalaia/academia',
  breadcrumbName: 'Academias e estúdios',
  heroH1: (
    <>
      Atendente IA 24/7 para
      <br className="hidden sm:block" />
      <span className="text-brand-trust"> academias e estúdios</span>
    </>
  ),
  heroSubtitle:
    'Aluno quer saber preço, horário de aula ou marcar avaliação física? O Atalaia responde 24h pelo WhatsApp e site, e te conecta com o lead quando ele estiver pronto pra matricular.',
  faq: [
    { q: 'Atende dúvidas sobre planos (mensal, trimestral, anual)?', a: 'Sim. Você cadastra cada plano com valor e benefícios; o atendente apresenta de forma clara e oferece o que faz mais sentido pra dúvida do lead.' },
    { q: 'Atende sobre horários das aulas coletivas?', a: 'Sim. Você cadastra a grade da semana, e o atendente responde "tem aula de spinning na quinta às 19h?" com a resposta certa.' },
    { q: 'Funciona pra estúdio pequeno de yoga, pilates, crossfit ou funcional?', a: 'Sim. Quanto mais nicho, melhor — a IA usa as informações específicas do seu estúdio e responde como você responderia.' },
    { q: 'Cliente pede pra cancelar matrícula — atende ou transfere?', a: 'Esse tipo de solicitação o atendente transfere pra você direto, com o contexto. Cancelamento é conversa que precisa de humano.' },
    { q: 'Funciona pra agendar avaliação física?', a: 'Sim. O atendente coleta nome, telefone e horário preferido, e te avisa pra confirmar.' },
    ...sharedFaq.slice(0, 4),
  ],
};

export const allVerticals: VerticalConfig[] = [salaoConfig, clinicaConfig, restauranteConfig, academiaConfig];
