"use client";

import { useEffect, useState, useCallback } from "react";
import AROverlay from "./AROverlay";

interface ARSceneProps {
  videoUrl: string;
  targetUrl: string;
}

type CameraErrorType = "not_supported" | "not_allowed" | "not_found" | "not_readable" | "unknown";

interface CameraError {
  type: CameraErrorType;
  message: string;
}

// Detect device type
function detectDevice(): { isIOS: boolean; isAndroid: boolean; isMobile: boolean } {
  if (typeof navigator === "undefined") {
    return { isIOS: false, isAndroid: false, isMobile: false };
  }
  
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;
  
  return { isIOS, isAndroid, isMobile };
}

// Get error instructions based on device
function getErrorInstructions(errorType: CameraErrorType, isIOS: boolean, isAndroid: boolean): string {
  if (errorType === "not_allowed") {
    if (isIOS) {
      return "Ajustes > Safari > Câmera > Permitir";
    }
    if (isAndroid) {
      return "Configurações > Apps > [Navegador] > Permissões > Câmera";
    }
    return "Clique no ícone de câmera na barra de endereços e permita o acesso.";
  }
  
  if (errorType === "not_found") {
    return "Verifique se seu dispositivo possui uma câmera conectada.";
  }
  
  if (errorType === "not_readable") {
    return "Feche outros aplicativos que possam estar usando a câmera.";
  }
  
  return "Tente recarregar a página ou usar um navegador diferente.";
}

export default function ARScene({ videoUrl, targetUrl }: ARSceneProps) {
  const [isTargetFound, setIsTargetFound] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState<CameraError | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, isMobile: false });

  // Detect device on mount
  useEffect(() => {
    const device = detectDevice();
    setDeviceInfo(device);
    
    // iOS requires user interaction for autoplay
    if (device.isIOS) {
      setNeedsUserInteraction(true);
    }
  }, []);

  // Check camera permission before initializing AR
  const checkCameraPermission = useCallback(async (): Promise<boolean> => {
    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError({
        type: "not_supported",
        message: "Seu navegador não suporta acesso à câmera. Use um navegador moderno.",
      });
      return false;
    }

    try {
      // Request camera permission with preferred settings for AR
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      
      // Permission granted - stop the test stream
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      const error = err as DOMException;
      let errorType: CameraErrorType = "unknown";
      let message = "Erro desconhecido ao acessar a câmera.";
      
      switch (error.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          errorType = "not_allowed";
          message = "Permissão de câmera negada. Habilite o acesso nas configurações.";
          break;
        case "NotFoundError":
        case "DevicesNotFoundError":
          errorType = "not_found";
          message = "Nenhuma câmera encontrada no dispositivo.";
          break;
        case "NotReadableError":
        case "TrackStartError":
          errorType = "not_readable";
          message = "A câmera está sendo usada por outro aplicativo.";
          break;
        case "OverconstrainedError":
          // Try again without constraints
          try {
            const fallbackStream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
            fallbackStream.getTracks().forEach(track => track.stop());
            return true;
          } catch {
            errorType = "not_readable";
            message = "Não foi possível acessar a câmera com as configurações necessárias.";
          }
          break;
        default:
          message = `Erro ao acessar câmera: ${error.message || "Erro desconhecido"}`;
      }
      
      setCameraError({
        type: errorType,
        message,
      });
      return false;
    }
  }, []);

  // Initialize MindAR scene
  useEffect(() => {
    const initAR = async () => {
      try {
        setIsLoading(true);

        // First check camera permission
        const hasPermission = await checkCameraPermission();
        if (!hasPermission) {
          setIsLoading(false);
          return;
        }

        // Wait for A-Frame and MindAR to be ready
        await new Promise<void>((resolve, reject) => {
          if (typeof window === "undefined") {
            reject(new Error("Window not available"));
            return;
          }
          
          if ((window as any).AFRAME) {
            resolve();
            return;
          }
          
          let attempts = 0;
          const maxAttempts = 50; // 5 seconds max
          
          const checkAFrame = setInterval(() => {
            attempts++;
            if ((window as any).AFRAME) {
              clearInterval(checkAFrame);
              resolve();
            } else if (attempts >= maxAttempts) {
              clearInterval(checkAFrame);
              reject(new Error("A-Frame não carregou. Verifique sua conexão."));
            }
          }, 100);
        });

        // Get the scene element
        const scene = document.querySelector("a-scene");
        if (scene) {
          // Listen for target found/lost events
          scene.addEventListener("targetFound", () => {
            setIsTargetFound(true);
          });

          scene.addEventListener("targetLost", () => {
            setIsTargetFound(false);
            setIsVideoPlaying(false);
          });
          
          // Listen for camera errors from MindAR
          scene.addEventListener("camera-error", (event: any) => {
            console.error("MindAR camera error:", event);
            setCameraError({
              type: "unknown",
              message: "Erro ao inicializar a câmera do AR.",
            });
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error("AR initialization error:", error);
        setCameraError({
          type: "unknown",
          message: error instanceof Error ? error.message : "Falha ao inicializar a câmera.",
        });
        setIsLoading(false);
      }
    };

    initAR();
  }, [checkCameraPermission]);

  // Handle video play
  const handlePlayVideo = useCallback(() => {
    const video = document.getElementById("ar-video") as HTMLVideoElement;
    if (video) {
      video.play().then(() => {
        setIsVideoPlaying(true);
        setNeedsUserInteraction(false);
      }).catch((error) => {
        console.error("Video play error:", error);
        setNeedsUserInteraction(true);
      });
    }
  }, []);

  // Auto-play when target found (if no user interaction needed)
  useEffect(() => {
    if (isTargetFound && !needsUserInteraction && !isVideoPlaying) {
      handlePlayVideo();
    }
  }, [isTargetFound, needsUserInteraction, isVideoPlaying, handlePlayVideo]);

  // Pause video when target lost
  useEffect(() => {
    if (!isTargetFound) {
      const video = document.getElementById("ar-video") as HTMLVideoElement;
      if (video) {
        video.pause();
      }
    }
  }, [isTargetFound]);

  // Error state
  if (cameraError) {
    return (
      <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-white text-lg mb-2">{cameraError.message}</p>
          <p className="text-guestalt-gray-light text-sm mb-6">
            {getErrorInstructions(cameraError.type, deviceInfo.isIOS, deviceInfo.isAndroid)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Tentar novamente
            </button>
            <a
              href="/"
              className="px-6 py-3 bg-guestalt-gray-medium text-white rounded-lg font-semibold hover:bg-guestalt-gray-light/20 transition-colors"
            >
              Voltar ao início
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ar-container">
      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center z-50">
          <div className="text-center px-4">
            <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white">Iniciando câmera...</p>
            <p className="text-guestalt-gray-light text-sm mt-2">
              {deviceInfo.isIOS ? "Toque em 'Permitir' quando solicitado" : "Aguarde a inicialização"}
            </p>
          </div>
        </div>
      )}

      {/* MindAR Scene - rendered as HTML to avoid TypeScript issues */}
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <a-scene
              mindar-image="imageSrc: ${targetUrl}; autoStart: true; uiLoading: no; uiError: no; uiScanning: yes;"
              color-space="sRGB"
              embedded
              vr-mode-ui="enabled: false"
              device-orientation-permission-ui="enabled: false"
              renderer="logarithmicDepthBuffer: true; antialias: true; alpha: true"
            >
              <a-assets>
                <video
                  id="ar-video"
                  src="${videoUrl}"
                  preload="auto"
                  muted
                  playsinline
                  loop
                  crossorigin="anonymous"
                  webkit-playsinline
                />
              </a-assets>
              <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
              <a-entity mindar-image-target="targetIndex: 0">
                <a-video
                  src="#ar-video"
                  position="0 0 0"
                  rotation="0 0 0"
                  width="1"
                  height="0.5625"
                ></a-video>
              </a-entity>
            </a-scene>
          `,
        }}
      />

      {/* Overlay UI */}
      <AROverlay
        isTargetFound={isTargetFound}
        isVideoPlaying={isVideoPlaying}
        needsUserInteraction={needsUserInteraction}
        onPlayVideo={handlePlayVideo}
      />
    </div>
  );
}
