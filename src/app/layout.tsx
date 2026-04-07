import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verelus — Music Intelligence Platform",
  description:
    "AI-powered playlist pitching and professional career management for independent musicians. Built by music industry experts.",
  openGraph: {
    title: "Verelus — Music Intelligence Platform",
    description:
      "Connect your music, pitch to the right playlists, and manage your entire career in one place. Built by music industry experts with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
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
