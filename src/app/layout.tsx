import type { Metadata, Viewport } from "next";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "GUESTALT AR | Realidade Aumentada",
  description:
    "Aponte para o quadro. Veja a imagem ganhar vida. Experiência de realidade aumentada com vídeos interativos.",
  keywords: [
    "AR",
    "realidade aumentada",
    "WebAR",
    "vídeo interativo",
    "GUESTALT",
  ],
  authors: [{ name: "Gestalt Comunicação" }],
  openGraph: {
    title: "GUESTALT AR | Realidade Aumentada",
    description: "Aponte para o quadro. Veja a imagem ganhar vida.",
    type: "website",
    locale: "pt_BR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${montserrat.variable} ${inter.variable}`}>
      <body className="bg-guestalt-black text-guestalt-white antialiased">
        {children}
      </body>
    </html>
  );
}
