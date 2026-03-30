import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verelus — Music Intelligence Platform",
  description:
    "Music intelligence platform with TuneSignal (weekly newsletter) and BandBrain (AI band manager). Curated by AI for independent musicians.",
  openGraph: {
    title: "Verelus — Music Intelligence Platform",
    description:
      "Music intelligence platform with TuneSignal (weekly newsletter) and BandBrain (AI band manager). Curated by AI for independent musicians.",
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
      <body className="font-sans antialiased noise-bg">{children}</body>
    </html>
  );
}
