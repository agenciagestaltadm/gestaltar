"use client";

import { useSearchParams } from "next/navigation";
import { Header, Footer, Button } from "@/components/ui";
import { useCallback, useState, Suspense, useEffect } from "react";
import { DEMO_TARGET_IMAGE_URL } from "@/lib/ar";

// QR Code component using canvas
function QRCode({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useState<HTMLCanvasElement | null>(null)[0];
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasEl) return;
    
    // Simple QR code generation using a library-free approach
    // We'll use an iframe with a QR code service for simplicity
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    // Draw a placeholder with the URL
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    
    // Use QR code API
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  }, [canvasEl, value, size]);

  return (
    <canvas
      ref={setCanvasEl}
      width={size}
      height={size}
      className="rounded-lg"
    />
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("vid");
  const hasCustomTarget = searchParams.get("custom") === "1";
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Use dynamic route /ar/[id] for cleaner URLs
  const arUrl = videoId
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/ar/${videoId}`
    : `${typeof window !== "undefined" ? window.location.origin : ""}/ar`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(arUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  }, [arUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "GestalT AR - Veja em Realidade Aumentada",
          text: "Aponte a câmera para o quadro e veja o vídeo em AR!",
          url: arUrl,
        });
      } catch (err) {
        console.error("Falha ao compartilhar:", err);
      }
    } else {
      handleCopyLink();
    }
  }, [arUrl, handleCopyLink]);

  return (
    <div className="max-w-lg mx-auto text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-10 h-10 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="font-heading font-bold text-3xl sm:text-4xl mb-4">
        Upload concluído!
      </h1>

      <p className="text-guestalt-gray-light text-lg mb-8">
        Seu vídeo está pronto para ser visualizado em Realidade Aumentada.
      </p>

      {/* Primary CTA */}
      <div className="mb-8">
        <Button href={`/ar${videoId ? `/${videoId}` : ""}`} size="lg">
          LER O QUADRO EM AR
        </Button>
      </div>

      {/* QR Code Section */}
      <div className="mb-8 p-6 bg-guestalt-surface rounded-xl border border-guestalt-gray-medium">
        <h3 className="text-white font-medium mb-4">📱 QR Code</h3>
        
        <div className="flex justify-center mb-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(arUrl)}`}
            alt="QR Code"
            className="rounded-lg bg-white p-2"
            width={200}
            height={200}
          />
        </div>

        <p className="text-guestalt-gray-light text-sm mb-4">
          Escaneie o QR Code com seu celular para abrir a experiência AR
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleShare}
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Compartilhar
          </button>
          <button
            onClick={handleCopyLink}
            className="px-6 py-3 bg-guestalt-gray-medium text-white rounded-lg font-semibold hover:bg-guestalt-gray-light/20 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copiar link
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-guestalt-gray-medium my-8" />

      {/* Target Image Info */}
      <div className="mb-6 p-4 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium text-left">
        <h3 className="text-white font-medium mb-2">📋 Como usar o AR</h3>
        <ol className="text-guestalt-gray-light text-sm space-y-2 list-decimal list-inside">
          <li>Abra o link no celular ou escaneie o QR Code</li>
          <li>Toque em "ABRIR CÂMERA"</li>
          <li>Permita o acesso à câmera quando solicitado</li>
          <li>Aponte a câmera para a imagem de referência</li>
          <li>O vídeo aparecerá sobre a imagem!</li>
        </ol>
        <div className="mt-4 pt-4 border-t border-guestalt-gray-medium">
          <p className="text-guestalt-gray-light text-xs mb-2">
            Imagem de referência (target):
          </p>
          <a
            href={DEMO_TARGET_IMAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-white text-sm underline hover:no-underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Baixar/ver imagem de referência
          </a>
        </div>
      </div>

      {/* Link direto */}
      <div className="mb-6 p-4 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium">
        <p className="text-guestalt-gray-light text-sm mb-2">Link direto:</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-guestalt-black border border-guestalt-gray-medium rounded-lg px-4 py-3 overflow-hidden">
            <p className="text-white text-sm truncate">{arUrl}</p>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-guestalt-gray-medium my-8" />

      {/* Secondary CTA */}
      <div>
        <Button href="/upload" variant="secondary">
          Enviar outro vídeo
        </Button>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-guestalt-black">
      <Header />

      <section className="pt-24 pb-16 px-4">
        <Suspense
          fallback={
            <div className="max-w-lg mx-auto text-center">
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">Carregando...</p>
            </div>
          }
        >
          <SuccessContent />
        </Suspense>
      </section>

      <Footer />
    </main>
  );
}
