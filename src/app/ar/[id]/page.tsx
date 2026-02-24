"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { DEMO_VIDEO_URL, DEMO_TARGET_URL } from "@/lib/ar";

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
  const params = useParams();
  const videoId = params.id as string;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setIsLoading(true);

        if (videoId) {
          // Fetch signed URL for the video
          const response = await fetch(`/api/videos/${videoId}`);

          if (!response.ok) {
            // If video not found, use demo video
            console.log("Video not found, using demo");
            setVideoUrl(DEMO_VIDEO_URL);
            setTargetUrl(DEMO_TARGET_URL);
          } else {
            const data = await response.json();
            setVideoUrl(data.signedUrl);
            // Use custom target if available, otherwise demo
            setTargetUrl(data.targetUrl || DEMO_TARGET_URL);
          }
        } else {
          // No video ID, use demo video
          console.log("No video ID, using demo");
          setVideoUrl(DEMO_VIDEO_URL);
          setTargetUrl(DEMO_TARGET_URL);
        }
      } catch (err) {
        console.error("Error loading video:", err);
        setError("Falha ao carregar o vídeo. Usando vídeo de demonstração.");
        setVideoUrl(DEMO_VIDEO_URL);
        setTargetUrl(DEMO_TARGET_URL);
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

  return videoUrl ? (
    <ARScene videoUrl={videoUrl} targetUrl={targetUrl || undefined} />
  ) : null;
}

export default function ARIdPage() {
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
