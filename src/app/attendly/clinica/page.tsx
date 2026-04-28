import type { Metadata } from 'next';
import AttendlyLanding from '../_components/AttendlyLanding';
import { clinicaConfig } from '../_components/config';

export const metadata: Metadata = {
  title: 'Atendente IA WhatsApp para clínicas e consultórios | Attendly',
  description:
    'Atendimento automático 24h para clínica médica, odontológica e consultório. IA marca consulta pelo WhatsApp em conformidade com a LGPD. 7 dias grátis sem cartão.',
  openGraph: {
    title: 'Atendente IA WhatsApp para clínicas | Attendly',
    description:
      'Pacientes marcam consulta 24h pelo WhatsApp. Recepção liberada pra cuidar de quem está na clínica. 7 dias grátis.',
    type: 'website',
    url: 'https://verelus.com/attendly/clinica',
    siteName: 'Attendly',
    images: [
      {
        url: 'https://verelus.com/og-attendly.png',
        width: 1200,
        height: 630,
        alt: 'Attendly — Atendente IA para clínicas e consultórios',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Atendente IA para clínicas e consultórios | Attendly',
    description: 'Marca consulta 24h pelo WhatsApp. LGPD compliant. 7 dias grátis.',
    images: ['https://verelus.com/og-attendly.png'],
  },
  alternates: { canonical: 'https://verelus.com/attendly/clinica' },
};

export default function ClinicaPage() {
  return <AttendlyLanding config={clinicaConfig} />;
}
