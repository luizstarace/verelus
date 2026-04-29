import type { Metadata } from 'next';
import AtalaiaLanding from './_components/AtalaiaLanding';
import { mainConfig } from './_components/config';

export const metadata: Metadata = {
  title: 'Atalaia — Atendente IA 24/7 no WhatsApp e no seu site',
  description:
    'Responde clientes no WhatsApp e no seu site 24 horas por dia. Agenda, tira dúvidas e vende no piloto automático. Teste 7 dias grátis, sem cartão.',
  openGraph: {
    title: 'Atalaia — Atendente IA 24/7 no WhatsApp e no seu site',
    description:
      'Atendente de IA para PMEs brasileiras. WhatsApp + widget no site, com voz natural. 7 dias grátis.',
    type: 'website',
    url: 'https://verelus.com/atalaia',
    siteName: 'Atalaia',
    images: [
      {
        url: 'https://verelus.com/og-atalaia.png',
        width: 1200,
        height: 630,
        alt: 'Atalaia — Atendente IA 24/7 no WhatsApp e no site',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atalaia — Atendente IA 24/7',
    description:
      'Atendente de IA no WhatsApp e no seu site. 7 dias grátis, sem cartão.',
    images: ['https://verelus.com/og-atalaia.png'],
  },
  alternates: { canonical: 'https://verelus.com/atalaia' },
};

export default function AtalaiaPage() {
  return <AtalaiaLanding config={mainConfig} />;
}
