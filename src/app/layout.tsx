import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verelus — 11 ferramentas para musicos independentes",
  description:
    "Bio, rider, contrato, cache, pitch kit, growth tracker e mais. Ferramentas profissionais por R$29/mes, feitas pro musico independente brasileiro.",
  openGraph: {
    title: "Verelus — 11 ferramentas para musicos independentes",
    description:
      "Bio adaptativa, rider tecnico, contrato de show, calculadora de cache, pitch kit, growth tracker. R$29/mes.",
    type: "website",
    url: "https://verelus.com",
    siteName: "Verelus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verelus — 11 ferramentas para musicos independentes",
    description: "Ferramentas profissionais por R$29/mes. Feito pro mercado BR.",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased noise-bg bg-brand-dark text-brand-text">{children}</body>
    </html>
  );
}
