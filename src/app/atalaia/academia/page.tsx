import type { Metadata } from 'next';
import AtalaiaLanding from '../_components/AtalaiaLanding';
import { academiaConfig } from '../_components/config';

export const metadata: Metadata = {
  title: 'Atendente IA WhatsApp para academias e estúdios | Atalaia',
  description:
    'Atendimento automático 24h para academia, estúdio de yoga, pilates ou crossfit. IA tira dúvida sobre planos, horários e marca avaliação. 7 dias grátis sem cartão.',
  openGraph: {
    title: 'Atendente IA WhatsApp para academias | Atalaia',
    description:
      'Aluno quer saber preço ou horário de aula? IA responde 24h pelo WhatsApp. 7 dias grátis.',
    type: 'website',
    url: 'https://verelus.com/atalaia/academia',
    siteName: 'Atalaia',
    images: [
      {
        url: 'https://verelus.com/og-atalaia.png',
        width: 1200,
        height: 630,
        alt: 'Atalaia — Atendente IA para academias e estúdios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendente IA para academias | Atalaia',
    description: 'Planos, horários e avaliação física pelo WhatsApp. 7 dias grátis.',
    images: ['https://verelus.com/og-atalaia.png'],
  },
  alternates: { canonical: 'https://verelus.com/atalaia/academia' },
};

export default function AcademiaPage() {
  return <AtalaiaLanding config={academiaConfig} />;
}
