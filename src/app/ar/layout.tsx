import { Metadata } from "next";
import ARScriptLoader from "@/components/ar/ARScriptLoader";

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
    <ARScriptLoader>
      {children}
    </ARScriptLoader>
  );
}
