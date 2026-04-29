export const translations = {
  en: {
    nav: {
      logo: "Verelus",
      features: "Features",
      pricing: "Pricing",
      about: "About",
      cta: "Get Started",
      language: "Português",
    },
    hero: {
      headline: "Proposals That Close",
      subheadline: "Create professional proposals in 2 minutes, send as a link, know when the client opened it.",
      description: "For digital freelancers who want to stop sending quotes via WhatsApp and start closing more projects.",
      cta: "Start Free Today",
      secondaryCta: "View Plans",
      trust: "Free to start. No credit card required.",
    },
    form: {
      email: "Email address",
      artistName: "Your name",
      genre: "Area of expertise",
      spotifyUrl: "Website URL",
      submit: "Get Started Free",
      submitting: "Creating your account...",
      success: "Welcome! Check your email to verify your account.",
      error: "Something went wrong. Please try again.",
      agreeTerms: "I agree to the Terms of Service and Privacy Policy",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
    },
    promotion: {
      title: "Your Proposal Toolkit",
      subtitle: "Professional Proposals, Simple to Create",
      description: "Everything a freelancer needs to send polished proposals, track client engagement, and close more deals.",
      features: {
        spotifyConnect: {
          title: "View Tracking",
          description: "Know exactly when the client opened your proposal, how long they spent, and which sections got attention.",
        },
        aiMatching: {
          title: "Digital Acceptance",
          description: "Clients accept with one click. No printing, no scanning. Legally valid digital signature.",
        },
        pitchGeneration: {
          title: "Professional Templates",
          description: "Beautiful, conversion-optimized templates. Just fill in the details and send.",
        },
        unlimitedPitches: {
          title: "AI Suggestions",
          description: "AI helps you write better descriptions, set competitive pricing, and structure your proposal for impact.",
        },
        weeklyReports: {
          title: "Shareable Links",
          description: "Send proposals as a clean link. No attachments, no downloads. Works on any device.",
        },
        curatorNetwork: {
          title: "Version History",
          description: "Track every revision. See what changed between versions and when the client last viewed.",
        },
      },
      cta: "Try It Free",
    },
    management: {
      title: "Manage & Grow",
      subtitle: "Track, Analyze, Close More",
      description: "Monitor your pipeline, understand what works, and optimize your close rate over time.",
      features: {
        epk: {
          title: "Proposal Dashboard",
          description: "See all your proposals in one place. Filter by status, client, value, and date.",
        },
        pressReleases: {
          title: "Conversion Analytics",
          description: "Track your close rate, average deal size, and response time. Data-driven improvement.",
        },
        socialCalendar: {
          title: "Client Management",
          description: "Keep client details organized. Reuse info across proposals for faster creation.",
        },
        setlists: {
          title: "Revenue Tracking",
          description: "See your monthly revenue from accepted proposals. Set goals and track progress.",
        },
        budgetTools: {
          title: "Custom Branding",
          description: "Add your logo, colors, and brand identity to every proposal you send.",
        },
        tourPlanning: {
          title: "More Coming Soon",
          description: "Recurring proposals, team collaboration, and integrations on the roadmap.",
        },
        riders: {
          title: "",
          description: "",
        },
        monthlyReports: {
          title: "",
          description: "",
        },
      },
      cta: "Start Growing",
    },
    features: {
      title: "Why Verelus?",
      description: "Simple tools, well made. That's it.",
      aiPowered: {
        title: "Built for Brazil",
        description: "Templates, pricing suggestions, and workflows designed for Brazilian freelancers. In Portuguese.",
      },
      expertTuned: {
        title: "AI That Actually Helps",
        description: "AI generates proposal copy, pricing suggestions, and scope descriptions that sound like you.",
      },
      integrated: {
        title: "No Learning Curve",
        description: "Fill a form, get a proposal. Share a link. Each proposal takes under 2 minutes.",
      },
      realTime: {
        title: "Real-Time Tracking",
        description: "Know instantly when a client opens your proposal. No more guessing if they saw it.",
      },
      teamCollaboration: {
        title: "Professional Output",
        description: "Proposals that look like they came from an agency. Clean, branded, and conversion-optimized.",
      },
      apiIntegration: {
        title: "Simple Pricing",
        description: "Free plan to start. Pro at R$29/month for unlimited proposals and advanced features.",
      },
    },
    pricing: {
      title: "Simple, Transparent Pricing",
      subtitle: "Start free. Upgrade when you need more.",
      billingToggle: "Monthly",
      description: "No hidden fees. Cancel anytime.",
      plans: {
        free: {
          name: "Free",
          price: "0",
          period: "Forever free",
          description: "Perfect for getting started",
          features: [
            "3 proposals per month",
            "Basic view tracking",
            "Verelus branding on proposals",
            "Community support",
          ],
          cta: "Get Started",
          popular: false,
        },
        pro: {
          name: "Pro",
          price: "29",
          period: "/month",
          description: "For freelancers who mean business",
          features: [
            "Unlimited proposals",
            "Detailed view tracking",
            "No Verelus branding",
            "AI suggestions",
            "Custom branding",
            "Conversion analytics",
            "Priority support",
          ],
          cta: "Start Pro",
          popular: true,
        },
        business: {
          name: "",
          price: "",
          period: "",
          description: "",
          features: [] as string[],
          cta: "",
          popular: false,
        },
      },
      faq: {
        title: "Frequently Asked Questions",
        items: [
          {
            question: "Can I try before paying?",
            answer: "Yes! The free plan gives you 3 proposals per month with basic tracking. Upgrade when you need more.",
          },
          {
            question: "What payment methods do you accept?",
            answer: "Credit card via Stripe. Pix coming soon.",
          },
          {
            question: "Can I cancel anytime?",
            answer: "Yes. Cancel through your dashboard. No cancellation fees, no questions asked.",
          },
          {
            question: "Is my data safe?",
            answer: "Your data is encrypted and stored securely on Supabase. We never share your information.",
          },
          {
            question: "Can my client see the proposal without creating an account?",
            answer: "Yes! Clients open your proposal via a simple link — no signup needed. They can view and accept directly.",
          },
        ],
      },
      comparison: {
        title: "",
        features: [],
      },
    },
    social: {
      title: "What Freelancers Say",
      testimonials: [
        {
          quote: "I stopped sending PDFs by WhatsApp. Now I know exactly when the client opened my proposal.",
          author: "Clara M.",
          role: "UX Designer",
        },
        {
          quote: "The templates are beautiful and I can send a proposal in 2 minutes. My close rate went up 40%.",
          author: "Pedro R.",
          role: "Web Developer",
        },
        {
          quote: "Finally something simple that makes me look professional. Clients take me more seriously now.",
          author: "Ana L.",
          role: "Social Media Manager",
        },
      ],
    },
    footer: {
      copyright: "© 2026 Verelus. All rights reserved.",
      company: "Company",
      companyLinks: { about: "About", blog: "Blog", careers: "Careers", pressKit: "Press Kit" },
      product: "Product",
      productLinks: { features: "Features", pricing: "Pricing", security: "Security", roadmap: "Roadmap" },
      legal: "Legal",
      legalLinks: { privacy: "Privacy Policy", terms: "Terms of Service", cookies: "Cookie Policy", gdpr: "GDPR" },
      support: "Support",
      supportLinks: { help: "Help Center", faq: "FAQ", contact: "Contact Us", status: "Status Page" },
      social: { instagram: "Instagram", twitter: "Twitter", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn" },
      newsletter: {
        title: "Get Freelancing Tips Weekly",
        description: "Tips and tools for freelancers who want to close more.",
        placeholder: "Enter your email",
        subscribe: "Subscribe",
      },
    },
    atalaia: {
      nav: { product: 'Atalaia', about: 'About', login: 'Sign In' },
      hero: {
        title: 'Your business answering customers 24/7',
        subtitle: 'AI that responds on WhatsApp and your website as if it were you. No robot, no waiting.',
        cta: 'Try 7 days free',
        noCreditCard: 'No credit card required',
      },
      comparison: {
        title: 'Why Atalaia?',
        human: 'Human agent',
        ai: 'Atalaia',
        price: { human: '$800-2,000/mo', ai: 'From $30/mo' },
        hours: { human: '8h per day', ai: '24/7/365' },
        absence: { human: 'Vacations, absences', ai: 'Never misses' },
        concurrent: { human: '1 chat at a time', ai: 'Unlimited' },
        setup: { human: 'Long training', ai: 'Ready in minutes' },
      },
      steps: {
        title: 'How it works',
        step1: { title: 'Tell us about your business', desc: 'Fill a simple form with your services, prices, and hours.' },
        step2: { title: 'AI learns in minutes', desc: 'Our AI studies your business and creates a personalized agent.' },
        step3: { title: 'Customers served', desc: 'Your agent starts responding on WhatsApp and your website.' },
      },
      features: {
        whatsapp: { title: 'WhatsApp + Website', desc: 'Where your customers already are' },
        voice: { title: 'Voice responses', desc: 'Natural audio, not robotic' },
        transfer: { title: 'Transfers to you', desc: 'When a human touch is needed, you get notified and take over' },
        learns: { title: 'Learns over time', desc: 'Every conversation improves the agent' },
      },
      faq: {
        q1: { q: 'Do I need to code?', a: 'No, zero code. Fill a form and AI does the rest.' },
        q2: { q: 'What if the agent makes a mistake?', a: 'You see everything in the dashboard and can correct it.' },
        q3: { q: 'Can I cancel anytime?', a: 'Yes, 2 clicks, no penalty, no hassle.' },
        q4: { q: 'Is my data secure?', a: 'Yes. End-to-end encryption, LGPD compliant.' },
      },
      cta_final: {
        title: 'Your competitor is already serving customers 24/7. Are you?',
        button: 'Start now — 7 days free',
      },
      pricing: {
        title: 'Plans',
        monthly: 'Monthly',
        annual: 'Annual (2 months free)',
        starter: { name: 'Starter', price: '30', messages: '500 messages/mo', channels: 'Widget + WhatsApp' },
        pro: { name: 'Pro', price: '60', messages: '2,500 messages/mo', channels: 'Widget + WhatsApp', voice: '30 min voice/mo', badge: 'Most popular' },
        business: { name: 'Business', price: '120', messages: '10,000 messages/mo', channels: 'Widget + WhatsApp', voice: '120 min voice/mo', extra: 'Dedicated support' },
      },
    },
  },
  pt: {
    nav: {
      logo: "Verelus",
      features: "Funcionalidades",
      pricing: "Preços",
      about: "Sobre",
      cta: "Começar",
      language: "English",
    },
    hero: {
      headline: "Propostas que fecham",
      subheadline: "Crie propostas profissionais em 2 minutos, envie como link, saiba quando o cliente abriu.",
      description: "Para freelancers digitais que querem parar de mandar orçamento por WhatsApp e começar a fechar mais projetos.",
      cta: "Comece Grátis",
      secondaryCta: "Ver Planos",
      trust: "Grátis pra começar. Sem cartão de crédito.",
    },
    form: {
      email: "Seu e-mail",
      artistName: "Seu nome",
      genre: "Área de atuação",
      spotifyUrl: "URL do seu site",
      submit: "Começar Grátis",
      submitting: "Criando sua conta...",
      success: "Bem-vindo! Verifique seu e-mail para confirmar.",
      error: "Algo deu errado. Tente novamente.",
      agreeTerms: "Concordo com os Termos de Serviço e Política de Privacidade",
      privacyPolicy: "Política de Privacidade",
      termsOfService: "Termos de Serviço",
    },
    promotion: {
      title: "Seu Kit de Propostas",
      subtitle: "Propostas Profissionais, Simples de Criar",
      description: "Tudo que um freelancer precisa pra enviar propostas polidas, rastrear engajamento do cliente e fechar mais negócios.",
      features: {
        spotifyConnect: {
          title: "Tracking de Visualização",
          description: "Saiba exatamente quando o cliente abriu sua proposta, quanto tempo ficou e quais seções chamaram atenção.",
        },
        aiMatching: {
          title: "Aceite Digital",
          description: "Clientes aceitam com um clique. Sem imprimir, sem escanear. Assinatura digital válida.",
        },
        pitchGeneration: {
          title: "Templates Profissionais",
          description: "Templates bonitos e otimizados pra conversão. Preencha os dados e envie.",
        },
        unlimitedPitches: {
          title: "Sugestão com IA",
          description: "IA ajuda a escrever descrições melhores, precificar competitivamente e estruturar sua proposta pra impacto.",
        },
        weeklyReports: {
          title: "Links Compartilháveis",
          description: "Envie propostas como um link limpo. Sem anexos, sem downloads. Funciona em qualquer dispositivo.",
        },
        curatorNetwork: {
          title: "Histórico de Versões",
          description: "Acompanhe cada revisão. Veja o que mudou entre versões e quando o cliente visualizou por último.",
        },
      },
      cta: "Testar Grátis",
    },
    management: {
      title: "Gerencie e Cresça",
      subtitle: "Acompanhe, Analise, Feche Mais",
      description: "Monitore seu pipeline, entenda o que funciona e otimize sua taxa de conversão ao longo do tempo.",
      features: {
        epk: {
          title: "Painel de Propostas",
          description: "Veja todas as suas propostas num só lugar. Filtre por status, cliente, valor e data.",
        },
        pressReleases: {
          title: "Analytics de Conversão",
          description: "Acompanhe sua taxa de fechamento, ticket médio e tempo de resposta. Melhoria baseada em dados.",
        },
        socialCalendar: {
          title: "Gestão de Clientes",
          description: "Mantenha dados de clientes organizados. Reutilize informações em propostas futuras.",
        },
        setlists: {
          title: "Tracking de Receita",
          description: "Veja sua receita mensal de propostas aceitas. Defina metas e acompanhe o progresso.",
        },
        budgetTools: {
          title: "Marca Personalizada",
          description: "Adicione seu logo, cores e identidade visual em cada proposta enviada.",
        },
        tourPlanning: {
          title: "Mais em Breve",
          description: "Propostas recorrentes, colaboração em equipe e integrações no roadmap.",
        },
        riders: {
          title: "",
          description: "",
        },
        monthlyReports: {
          title: "",
          description: "",
        },
      },
      cta: "Começar a Crescer",
    },
    features: {
      title: "Por Que Verelus?",
      description: "Ferramentas simples, bem feitas. Só isso.",
      aiPowered: {
        title: "Feito Pro Brasil",
        description: "Templates, sugestões de preço e fluxos pensados pra freelancers brasileiros. Em português.",
      },
      expertTuned: {
        title: "IA Que Realmente Ajuda",
        description: "IA gera textos de proposta, sugestões de preço e descrições de escopo que soam como você.",
      },
      integrated: {
        title: "Sem Curva de Aprendizado",
        description: "Preenche um formulário, recebe a proposta. Compartilhe um link. Cada proposta leva menos de 2 minutos.",
      },
      realTime: {
        title: "Tracking em Tempo Real",
        description: "Saiba na hora quando o cliente abrir sua proposta. Sem mais ficar no escuro.",
      },
      teamCollaboration: {
        title: "Resultado Profissional",
        description: "Propostas que parecem feitas por uma agência. Limpas, com sua marca e otimizadas pra conversão.",
      },
      apiIntegration: {
        title: "Preço Simples",
        description: "Plano grátis pra começar. Pro a R$29/mês pra propostas ilimitadas e funcionalidades avançadas.",
      },
    },
    pricing: {
      title: "Preços Simples e Transparentes",
      subtitle: "Comece grátis. Assine quando precisar de mais.",
      billingToggle: "Mensal",
      description: "Sem taxas escondidas. Cancele quando quiser.",
      plans: {
        free: {
          name: "Grátis",
          price: "0",
          period: "Sempre grátis",
          description: "Perfeito pra começar",
          features: [
            "3 propostas/mês",
            "Tracking básico",
            "Marca Verelus nas propostas",
            "Suporte comunitário",
          ],
          cta: "Começar",
          popular: false,
        },
        pro: {
          name: "Pro",
          price: "29",
          period: "/mês",
          description: "Pra freelancers que levam a sério",
          features: [
            "Propostas ilimitadas",
            "Tracking detalhado",
            "Sem marca Verelus",
            "Sugestão com IA",
            "Marca personalizada",
            "Analytics de conversão",
            "Suporte prioritário",
          ],
          cta: "Assinar Pro",
          popular: true,
        },
        business: {
          name: "",
          price: "",
          period: "",
          description: "",
          features: [] as string[],
          cta: "",
          popular: false,
        },
      },
      faq: {
        title: "Perguntas Frequentes",
        items: [
          {
            question: "Posso testar antes de pagar?",
            answer: "Sim! O plano grátis te dá 3 propostas por mês com tracking básico. Assine quando precisar de mais.",
          },
          {
            question: "Quais meios de pagamento?",
            answer: "Cartão de crédito via Stripe. Pix em breve.",
          },
          {
            question: "Posso cancelar a qualquer momento?",
            answer: "Sim. Cancele pelo seu dashboard. Sem taxas de cancelamento, sem perguntas.",
          },
          {
            question: "Meus dados estão seguros?",
            answer: "Seus dados são criptografados e armazenados com segurança no Supabase. Nunca compartilhamos suas informações.",
          },
          {
            question: "O cliente precisa criar conta pra ver a proposta?",
            answer: "Não! O cliente abre sua proposta por um link simples — sem cadastro. Pode visualizar e aceitar direto.",
          },
        ],
      },
      comparison: {
        title: "",
        features: [],
      },
    },
    social: {
      title: "O Que Freelancers Dizem",
      testimonials: [
        {
          quote: "Parei de mandar PDF por WhatsApp. Agora sei exatamente quando o cliente abriu minha proposta.",
          author: "Clara M.",
          role: "UX Designer",
        },
        {
          quote: "Os templates são lindos e consigo enviar uma proposta em 2 minutos. Minha taxa de fechamento subiu 40%.",
          author: "Pedro R.",
          role: "Desenvolvedor Web",
        },
        {
          quote: "Finalmente algo simples que me faz parecer profissional. Clientes me levam mais a sério agora.",
          author: "Ana L.",
          role: "Social Media Manager",
        },
      ],
    },
    footer: {
      copyright: "© 2026 Verelus. Todos os direitos reservados.",
      company: "Empresa",
      companyLinks: { about: "Sobre", blog: "Blog", careers: "Carreiras", pressKit: "Kit de Imprensa" },
      product: "Produto",
      productLinks: { features: "Funcionalidades", pricing: "Preços", security: "Segurança", roadmap: "Roadmap" },
      legal: "Legal",
      legalLinks: { privacy: "Política de Privacidade", terms: "Termos de Serviço", cookies: "Política de Cookies", gdpr: "LGPD" },
      support: "Suporte",
      supportLinks: { help: "Central de Ajuda", faq: "FAQ", contact: "Contato", status: "Status" },
      social: { instagram: "Instagram", twitter: "Twitter", tiktok: "TikTok", youtube: "YouTube", linkedin: "LinkedIn" },
      newsletter: {
        title: "Receba Dicas pra Freelancers",
        description: "Dicas e ferramentas pra freelancers que querem fechar mais.",
        placeholder: "Seu e-mail",
        subscribe: "Inscrever-se",
      },
    },
    atalaia: {
      nav: { product: 'Atalaia', about: 'Sobre', login: 'Entrar' },
      hero: {
        title: 'Seu negócio atendendo clientes 24/7',
        subtitle: 'IA que responde no WhatsApp e no seu site como se fosse você. Sem robô, sem espera.',
        cta: 'Testar 7 dias grátis',
        noCreditCard: 'Sem cartão de crédito',
      },
      comparison: {
        title: 'Por que Atalaia?',
        human: 'Atendente humano',
        ai: 'Atalaia',
        price: { human: 'R$ 1.500-3.000/mês', ai: 'A partir de R$ 147/mês' },
        hours: { human: '8h por dia', ai: '24/7/365' },
        absence: { human: 'Férias, faltas', ai: 'Nunca falta' },
        concurrent: { human: '1 conversa por vez', ai: 'Ilimitadas' },
        setup: { human: 'Treinamento longo', ai: 'Pronto em minutos' },
      },
      steps: {
        title: 'Como funciona',
        step1: { title: 'Conte sobre seu negócio', desc: 'Preencha um formulário simples com seus serviços, preços e horários.' },
        step2: { title: 'IA aprende em minutos', desc: 'Nossa IA estuda seu negócio e cria um atendente personalizado.' },
        step3: { title: 'Clientes atendidos', desc: 'Seu atendente começa a responder no WhatsApp e no seu site.' },
      },
      features: {
        whatsapp: { title: 'WhatsApp + Site', desc: 'Onde seus clientes já estão' },
        voice: { title: 'Responde com voz', desc: 'Áudio natural, não robô' },
        transfer: { title: 'Transfere pra você', desc: 'Quando precisa do toque humano, você recebe notificação e assume' },
        learns: { title: 'Aprende com o tempo', desc: 'Cada conversa melhora o atendente' },
      },
      faq: {
        q1: { q: 'Preciso saber programar?', a: 'Não, zero código. Você preenche um formulário e a IA faz o resto.' },
        q2: { q: 'E se o atendente errar?', a: 'Você vê tudo no dashboard e pode corrigir. Ele aprende.' },
        q3: { q: 'Posso cancelar quando quiser?', a: 'Sim, 2 cliques, sem multa, sem burocracia.' },
        q4: { q: 'Meus dados estão seguros?', a: 'Sim. Criptografia ponta a ponta, conformidade com LGPD.' },
      },
      cta_final: {
        title: 'Seu concorrente já está atendendo 24/7. E você?',
        button: 'Começar agora — 7 dias grátis',
      },
      pricing: {
        title: 'Planos',
        monthly: 'Mensal',
        annual: 'Anual (2 meses grátis)',
        starter: { name: 'Starter', price: '147', messages: '500 mensagens/mês', channels: 'Widget + WhatsApp' },
        pro: { name: 'Pro', price: '297', messages: '2.500 mensagens/mês', channels: 'Widget + WhatsApp', voice: '30 min voz/mês', badge: 'Mais popular' },
        business: { name: 'Business', price: '597', messages: '10.000 mensagens/mês', channels: 'Widget + WhatsApp', voice: '120 min voz/mês', extra: 'Suporte dedicado' },
      },
    },
  },
};
