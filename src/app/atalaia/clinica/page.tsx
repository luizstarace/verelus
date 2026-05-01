import type { Metadata } from 'next';
import AtalaiaLanding from '../_components/AtalaiaLanding';
import { clinicaConfig } from '../_components/config';

export const metadata: Metadata = {
  title: 'Atendente IA WhatsApp para clínicas e consultórios | Atalaia',
  description:
    'Atendimento automático 24h para clínica médica, odontológica e consultório. IA marca consulta pelo WhatsApp em conformidade com a LGPD. 7 dias grátis sem cartão.',
  openGraph: {
    title: 'Atendente IA WhatsApp para clínicas | Atalaia',
    description:
      'Pacientes marcam consulta 24h pelo WhatsApp. Recepção liberada pra cuidar de quem está na clínica. 7 dias grátis.',
    type: 'website',
    url: 'https://atalaia.verelus.com/atalaia/clinica',
    siteName: 'Atalaia',
    images: [
      {
        url: 'https://atalaia.verelus.com/og-atalaia.png',
        width: 1200,
        height: 630,
        alt: 'Atalaia — Atendente IA para clínicas e consultórios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendente IA para clínicas e consultórios | Atalaia',
    description: 'Marca consulta 24h pelo WhatsApp. LGPD compliant. 7 dias grátis.',
    images: ['https://atalaia.verelus.com/og-atalaia.png'],
  },
  alternates: { canonical: 'https://atalaia.verelus.com/atalaia/clinica' },
};

export default function ClinicaPage() {
  return <AtalaiaLanding config={clinicaConfig} />;
}
