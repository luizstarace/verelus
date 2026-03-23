import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TuneSignal — AI-Powered Music Intelligence",
  description:
    "Weekly newsletter with trends, sync opportunities, and market analysis for independent musicians. Curated by AI.",
  openGraph: {
    title: "TuneSignal — AI-Powered Music Intelligence",
    description:
      "Weekly newsletter with trends, sync opportunities, and market analysis for independent musicians.",
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
