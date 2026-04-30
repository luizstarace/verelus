import type { Metadata } from 'next';
import AtalaiaLanding from '../_components/AtalaiaLanding';
import { restauranteConfig } from '../_components/config';

export const metadata: Metadata = {
  title: 'Atendente IA WhatsApp para restaurantes e delivery | Atalaia',
  description:
    'Atendimento automático 24h para restaurante. IA responde cardápio, faz reserva e pega pedido pra delivery pelo WhatsApp. Aguenta pico sem perder cliente. 7 dias grátis.',
  openGraph: {
    title: 'Atendente IA WhatsApp para restaurantes | Atalaia',
    description:
      'Cardápio, reservas e pedidos respondidos em segundos. Cliente não espera mesmo no pico. 7 dias grátis.',
    type: 'website',
    url: 'https://atalaia.verelus.com/atalaia/restaurante',
    siteName: 'Atalaia',
    images: [
      {
        url: 'https://atalaia.verelus.com/og-atalaia.png',
        width: 1200,
        height: 630,
        alt: 'Atalaia — Atendente IA para restaurantes e delivery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendente IA para restaurantes | Atalaia',
    description: 'Cardápio + reservas + pedidos pelo WhatsApp. 7 dias grátis.',
    images: ['https://atalaia.verelus.com/og-atalaia.png'],
  },
  alternates: { canonical: 'https://atalaia.verelus.com/atalaia/restaurante' },
};

export default function RestaurantePage() {
  return <AtalaiaLanding config={restauranteConfig} />;
}
