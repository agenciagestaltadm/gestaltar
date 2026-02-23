import { Metadata } from "next";

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
      {/* MindAR + A-Frame Scripts */}
      <script
        src="https://cdn.jsdelivr.net/npm/aframe@1.4.0/dist/aframe-master.min.js"
        async
      />
      <script
        src="https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/dist/mindar-image-aframe.prod.js"
        async
      />
      {children}
    </>
  );
}
