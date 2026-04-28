import type { Metadata } from 'next';
import AttendlyLanding from '../_components/AttendlyLanding';
import { restauranteConfig } from '../_components/config';

export const metadata: Metadata = {
  title: 'Atendente IA WhatsApp para restaurantes e delivery | Attendly',
  description:
    'Atendimento automático 24h para restaurante. IA responde cardápio, faz reserva e pega pedido pra delivery pelo WhatsApp. Aguenta pico sem perder cliente. 7 dias grátis.',
  openGraph: {
    title: 'Atendente IA WhatsApp para restaurantes | Attendly',
    description:
      'Cardápio, reservas e pedidos respondidos em segundos. Cliente não espera mesmo no pico. 7 dias grátis.',
    type: 'website',
    url: 'https://verelus.com/attendly/restaurante',
    siteName: 'Attendly',
    images: [
      {
        url: 'https://verelus.com/og-attendly.png',
        width: 1200,
        height: 630,
        alt: 'Attendly — Atendente IA para restaurantes e delivery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendente IA para restaurantes | Attendly',
    description: 'Cardápio + reservas + pedidos pelo WhatsApp. 7 dias grátis.',
    images: ['https://verelus.com/og-attendly.png'],
  },
  alternates: { canonical: 'https://verelus.com/attendly/restaurante' },
};

export default function RestaurantePage() {
  return <AttendlyLanding config={restauranteConfig} />;
}
