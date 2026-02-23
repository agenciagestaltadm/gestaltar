"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import for ARScene (client-side only)
const ARScene = dynamic(() => import("@/components/ar/ARScene"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white">Carregando AR...</p>
      </div>
    </div>
  ),
});

function ARPageContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("vid");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true);

        if (videoId) {
          // Fetch signed URL for the video and target
          const response = await fetch(`/api/videos/${videoId}`);

          if (!response.ok) {
            // If video not found, use demo video and default target
            setVideoUrl("/demo-video.mp4");
            setTargetUrl("/targets.mind");
          } else {
            const data = await response.json();
            setVideoUrl(data.signedUrl);
            // Use custom target if available, otherwise use default
            setTargetUrl(data.targetUrl || "/targets.mind");
          }
        } else {
          // No video ID, use demo video and default target
          setVideoUrl("/demo-video.mp4");
          setTargetUrl("/targets.mind");
        }
      } catch (err) {
        console.error("Error loading video:", err);
        setError("Falha ao carregar o vídeo. Usando vídeo de demonstração.");
        setVideoUrl("/demo-video.mp4");
        setTargetUrl("/targets.mind");
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [videoId]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Carregando vídeo...</p>
        </div>
      </div>
    );
  }

  if (error && !videoUrl) {
    return (
      <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-white text-lg mb-4">{error}</p>
          <a
            href="/"
            className="px-6 py-3 bg-white text-black rounded-lg font-semibold"
          >
            Voltar para o início
          </a>
        </div>
      </div>
    );
  }

  return videoUrl && targetUrl ? (
    <ARScene videoUrl={videoUrl} targetUrl={targetUrl} />
  ) : null;
}

export default function ARPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ARPageContent />
    </Suspense>
  );
}
