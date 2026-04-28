import type { Metadata } from 'next';
import AttendlyLanding from '../_components/AttendlyLanding';
import { academiaConfig } from '../_components/config';

export const metadata: Metadata = {
  title: 'Atendente IA WhatsApp para academias e estúdios | Attendly',
  description:
    'Atendimento automático 24h para academia, estúdio de yoga, pilates ou crossfit. IA tira dúvida sobre planos, horários e marca avaliação. 7 dias grátis sem cartão.',
  openGraph: {
    title: 'Atendente IA WhatsApp para academias | Attendly',
    description:
      'Aluno quer saber preço ou horário de aula? IA responde 24h pelo WhatsApp. 7 dias grátis.',
    type: 'website',
    url: 'https://verelus.com/attendly/academia',
    siteName: 'Attendly',
    images: [
      {
        url: 'https://verelus.com/og-attendly.png',
        width: 1200,
        height: 630,
        alt: 'Attendly — Atendente IA para academias e estúdios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendente IA para academias | Attendly',
    description: 'Planos, horários e avaliação física pelo WhatsApp. 7 dias grátis.',
    images: ['https://verelus.com/og-attendly.png'],
  },
  alternates: { canonical: 'https://verelus.com/attendly/academia' },
};

export default function AcademiaPage() {
  return <AttendlyLanding config={academiaConfig} />;
}
