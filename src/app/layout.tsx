import type { Metadata } from "next";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atalaia — Atendente IA 24/7 para PMEs brasileiras",
  description:
    "Atalaia responde seus clientes no WhatsApp e no site 24h. Atendimento automático para salão, clínica, restaurante, academia e prestador de serviço. Teste 7 dias grátis sem cartão.",
  openGraph: {
    title: "Atalaia — Atendente IA 24/7 para PMEs brasileiras",
    description:
      "Atalaia responde seus clientes no WhatsApp e no site 24h. Atendimento automático para salão, clínica, restaurante, academia e prestador de serviço. Teste 7 dias grátis sem cartão.",
    type: "website",
    url: "https://atalaia.verelus.com",
    siteName: "Atalaia",
    images: [
      {
        url: "https://atalaia.verelus.com/og-atalaia.png",
        width: 1200,
        height: 630,
        alt: "Atalaia — Atendente IA 24/7 no WhatsApp e no site",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atalaia — Atendente IA 24/7 para PMEs brasileiras",
    description: "Atalaia responde seus clientes no WhatsApp e no site 24h. Atendimento automático para salão, clínica, restaurante, academia e prestador de serviço. Teste 7 dias grátis sem cartão.",
    images: ["https://atalaia.verelus.com/og-atalaia.png"],
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=JetBrains+Mono:wght@400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-brand-bg text-brand-text">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
