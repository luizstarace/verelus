import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verelus — Atendente IA 24/7 para PMEs brasileiras",
  description:
    "Attendly: atendente IA 24/7 para PMEs brasileiras. WhatsApp, chat no site, voz. Teste grátis por 7 dias.",
  openGraph: {
    title: "Verelus — Atendente IA 24/7 para PMEs brasileiras",
    description:
      "Attendly: atendente IA 24/7 para PMEs brasileiras. WhatsApp, chat no site, voz. Teste grátis por 7 dias.",
    type: "website",
    url: "https://verelus.com",
    siteName: "Verelus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verelus — Atendente IA 24/7 para PMEs brasileiras",
    description: "Attendly: atendente IA 24/7 para PMEs brasileiras. WhatsApp, chat no site, voz. Teste grátis por 7 dias.",
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
      <body className="font-sans antialiased bg-brand-bg text-brand-text">{children}</body>
    </html>
  );
}
