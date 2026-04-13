import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verelus — Music Intelligence Platform",
  description:
    "Plataforma de inteligencia musical com IA para musicos independentes. Pitching de playlists, gestao de carreira e ferramentas profissionais.",
  openGraph: {
    title: "Verelus — Music Intelligence Platform",
    description:
      "Plataforma de inteligencia musical com IA. Pitching de playlists, press releases, contratos, turnes e muito mais.",
    type: "website",
    url: "https://verelus.com",
    siteName: "Verelus",
  },
  twitter: {
    card: "summary_large_image",
    title: "Verelus — Music Intelligence Platform",
    description: "Inteligencia musical com IA para musicos independentes.",
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
