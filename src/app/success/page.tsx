"use client";

import { useSearchParams } from "next/navigation";
import { Header, Footer, Button } from "@/components/ui";
import { useCallback, useState, Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("vid");
  const [copied, setCopied] = useState(false);

  const arUrl = videoId
    ? `${window.location.origin}/ar?vid=${videoId}`
    : `${window.location.origin}/ar`;

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(arUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Falha ao copiar:", err);
    }
  }, [arUrl]);

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
        <Button href={`/ar${videoId ? `?vid=${videoId}` : ""}`} size="lg">
          LER O QUADRO EM AR
        </Button>
      </div>

      {/* Divider */}
      <div className="border-t border-guestalt-gray-medium my-8" />

      {/* Share Link */}
      <div className="mb-6">
        <p className="text-guestalt-gray-light text-sm mb-3">
          Compartilhe o link:
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-guestalt-surface border border-guestalt-gray-medium rounded-lg px-4 py-3 overflow-hidden">
            <p className="text-white text-sm truncate">{arUrl}</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-4 py-3 bg-guestalt-surface border border-guestalt-gray-medium rounded-lg hover:bg-guestalt-gray-medium transition-colors"
            title="Copiar link"
          >
            {copied ? (
              <svg
                className="w-5 h-5 text-green-500"
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
            ) : (
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
        </div>
        {copied && (
          <p className="text-green-500 text-sm mt-2">Link copiado!</p>
        )}
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
