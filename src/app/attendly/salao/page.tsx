import type { Metadata } from 'next';
import AttendlyLanding from '../_components/AttendlyLanding';
import { salaoConfig } from '../_components/config';

export const metadata: Metadata = {
  title: 'Atendente IA WhatsApp para salão de beleza e barbearia | Attendly',
  description:
    'Atendimento automático 24h para salão e barbearia. IA agenda manicure, corte, coloração e responde clientes no WhatsApp e no site. 7 dias grátis sem cartão.',
  openGraph: {
    title: 'Atendente IA WhatsApp para salão de beleza | Attendly',
    description:
      'Sua cliente quer marcar às 22h? IA atende, agenda e confirma 24h por dia. Teste 7 dias grátis.',
    type: 'website',
    url: 'https://verelus.com/attendly/salao',
    siteName: 'Attendly',
    images: [
      {
        url: 'https://verelus.com/og-attendly.png',
        width: 1200,
        height: 630,
        alt: 'Attendly — Atendente IA para salão de beleza',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendente IA para salão de beleza | Attendly',
    description: 'Agenda manicure, corte e coloração 24h pelo WhatsApp. 7 dias grátis.',
    images: ['https://verelus.com/og-attendly.png'],
  },
  alternates: { canonical: 'https://verelus.com/attendly/salao' },
};

export default function SalaoPage() {
  return <AttendlyLanding config={salaoConfig} />;
}
