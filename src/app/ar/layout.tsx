import { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "AR | GUESTALT AR",
  description: "Experiência de Realidade Aumentada - Aponte para o quadro e veja a imagem ganhar vida.",
};

export default function ARLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* MindAR + A-Frame Scripts - loaded in order with next/script */}
      <Script
        src="https://cdn.jsdelivr.net/npm/aframe@1.4.0/dist/aframe-master.min.js"
        strategy="beforeInteractive"
      />
      <Script
        src="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/dist/mindar-image-aframe.prod.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
