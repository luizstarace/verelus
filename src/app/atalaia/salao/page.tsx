import type { Metadata } from 'next';
import AtalaiaLanding from '../_components/AtalaiaLanding';
import { salaoConfig } from '../_components/config';

export const metadata: Metadata = {
  title: 'Atendente IA WhatsApp para salão de beleza e barbearia | Atalaia',
  description:
    'Atendimento automático 24h para salão e barbearia. IA agenda manicure, corte, coloração e responde clientes no WhatsApp e no site. 7 dias grátis sem cartão.',
  openGraph: {
    title: 'Atendente IA WhatsApp para salão de beleza | Atalaia',
    description:
      'Sua cliente quer marcar às 22h? IA atende, agenda e confirma 24h por dia. Teste 7 dias grátis.',
    type: 'website',
    url: 'https://atalaia.verelus.com/atalaia/salao',
    siteName: 'Atalaia',
    images: [
      {
        url: 'https://atalaia.verelus.com/og-atalaia.png',
        width: 1200,
        height: 630,
        alt: 'Atalaia — Atendente IA para salão de beleza',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendente IA para salão de beleza | Atalaia',
    description: 'Agenda manicure, corte e coloração 24h pelo WhatsApp. 7 dias grátis.',
    images: ['https://atalaia.verelus.com/og-atalaia.png'],
  },
  alternates: { canonical: 'https://atalaia.verelus.com/atalaia/salao' },
};

export default function SalaoPage() {
  return <AtalaiaLanding config={salaoConfig} />;
}
