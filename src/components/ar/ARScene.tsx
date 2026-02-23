"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AROverlay from "./AROverlay";

interface ARSceneProps {
  videoUrl: string;
  targetUrl: string;
}

type ARState = "loading" | "requesting_permission" | "initializing" | "ready" | "error";

interface ARError {
  title: string;
  message: string;
  instructions?: string;
}

// Detect device type
function detectDevice(): { isIOS: boolean; isAndroid: boolean; isMobile: boolean; isSafari: boolean } {
  if (typeof navigator === "undefined") {
    return { isIOS: false, isAndroid: false, isMobile: false, isSafari: false };
  }
  
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;
  const isSafari = /Safari/.test(ua) && /AppleWebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  
  return { isIOS, isAndroid, isMobile, isSafari };
}

// Check if target URL is valid
async function checkTargetExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

export default function ARScene({ videoUrl, targetUrl }: ARSceneProps) {
  const [arState, setArState] = useState<ARState>("loading");
  const [isTargetFound, setIsTargetFound] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [error, setError] = useState<ARError | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, isMobile: false, isSafari: false });
  const [loadingMessage, setLoadingMessage] = useState("Preparando experiência AR...");
  const [effectiveTargetUrl, setEffectiveTargetUrl] = useState<string>(targetUrl);
  
  const sceneRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isInitializedRef = useRef(false);

  // Detect device on mount
  useEffect(() => {
    const device = detectDevice();
    setDeviceInfo(device);
    
    if (device.isIOS) {
      setNeedsUserInteraction(true);
    }
  }, []);

  // Check and set target URL
  useEffect(() => {
    const checkTarget = async () => {
      // Check if the provided target URL exists
      const exists = await checkTargetExists(targetUrl);
      
      if (!exists) {
        console.warn("Target URL not found, using demo target from CDN");
        // Use MindAR demo target from CDN
        setEffectiveTargetUrl("https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/examples/image-tracking/assets/card-example/card.mind");
      } else {
        setEffectiveTargetUrl(targetUrl);
      }
    };
    
    checkTarget();
  }, [targetUrl]);

  // Request camera permission
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    setArState("requesting_permission");
    setLoadingMessage("Solicitando permissão de câmera...");
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError({
        title: "Navegador não suportado",
        message: "Seu navegador não suporta acesso à câmera.",
        instructions: "Use Chrome, Safari, Firefox ou Edge em suas versões mais recentes.",
      });
      setArState("error");
      return false;
    }

    try {
      // Request camera with ideal settings for AR
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      // Stop the test stream - MindAR will create its own
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      const domError = err as DOMException;
      
      switch (domError.name) {
        case "NotAllowedError":
        case "PermissionDeniedError":
          setError({
            title: "Permissão negada",
            message: "Você precisa permitir o acesso à câmera para usar a realidade aumentada.",
            instructions: deviceInfo.isIOS 
              ? "Ajustes > Safari > Câmera > Permitir" 
              : deviceInfo.isAndroid 
                ? "Configurações > Apps > Navegador > Permissões > Câmera"
                : "Clique no ícone de câmera na barra de endereços e permita o acesso.",
          });
          break;
        case "NotFoundError":
          setError({
            title: "Câmera não encontrada",
            message: "Nenhuma câmera foi detectada no seu dispositivo.",
            instructions: "Verifique se seu dispositivo possui uma câmera e se ela está funcionando corretamente.",
          });
          break;
        case "NotReadableError":
          setError({
            title: "Câmera em uso",
            message: "A câmera está sendo usada por outro aplicativo.",
            instructions: "Feche outros aplicativos que possam estar usando a câmera e tente novamente.",
          });
          break;
        default:
          setError({
            title: "Erro de câmera",
            message: `Não foi possível acessar a câmera: ${domError.message || "Erro desconhecido"}`,
            instructions: "Tente recarregar a página ou usar um navegador diferente.",
          });
      }
      
      setArState("error");
      return false;
    }
  }, [deviceInfo]);

  // Initialize AR scene
  const initializeAR = useCallback(async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    setArState("initializing");
    setLoadingMessage("Inicializando realidade aumentada...");

    try {
      // Wait for A-Frame to be ready
      await new Promise<void>((resolve, reject) => {
        const maxWait = 15000; // 15 seconds max
        const startTime = Date.now();
        
        const checkAFrame = setInterval(() => {
          if (typeof window !== "undefined" && (window as any).AFRAME) {
            clearInterval(checkAFrame);
            resolve();
          } else if (Date.now() - startTime > maxWait) {
            clearInterval(checkAFrame);
            reject(new Error("A-Frame não carregou. Verifique sua conexão e desative bloqueadores de anúncios."));
          }
        }, 100);
      });

      setLoadingMessage("Carregando componentes AR...");

      // Small delay to ensure A-Frame is fully initialized
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create the AR scene
      if (sceneRef.current) {
        const sceneHTML = `
          <a-scene
            mindar-image="imageSrc: ${effectiveTargetUrl}; autoStart: true; uiLoading: no; uiError: no; uiScanning: yes;"
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
                webkit-playsinline
                loop
                crossorigin="anonymous"
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
        `;
        
        sceneRef.current.innerHTML = sceneHTML;
        
        // Wait for scene to initialize
        setTimeout(() => {
          const scene = sceneRef.current?.querySelector("a-scene");
          if (scene) {
            // Listen for scene loaded
            scene.addEventListener("loaded", () => {
              console.log("AR Scene loaded");
              setArState("ready");
            });
            
            // Listen for target events
            scene.addEventListener("targetFound", () => {
              console.log("Target found");
              setIsTargetFound(true);
            });
            
            scene.addEventListener("targetLost", () => {
              console.log("Target lost");
              setIsTargetFound(false);
              setIsVideoPlaying(false);
            });
            
            // Listen for camera errors
            scene.addEventListener("camera-error", (event: any) => {
              console.error("Camera error:", event);
              setError({
                title: "Erro de câmera",
                message: "Não foi possível acessar a câmera.",
                instructions: "Verifique as permissões do navegador e tente novamente.",
              });
              setArState("error");
            });
            
            // Set ready after a timeout
            setTimeout(() => {
              setArState("ready");
            }, 2000);
          }
        }, 1000);
      }
    } catch (err) {
      console.error("AR initialization error:", err);
      setError({
        title: "Erro de inicialização",
        message: err instanceof Error ? err.message : "Falha ao inicializar o AR.",
        instructions: "Tente recarregar a página ou usar um navegador diferente.",
      });
      setArState("error");
    }
  }, [effectiveTargetUrl, videoUrl]);

  // Main initialization flow
  useEffect(() => {
    if (!effectiveTargetUrl || effectiveTargetUrl === targetUrl && !videoUrl) return;
    
    const init = async () => {
      setArState("loading");
      
      // Request camera permission first
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;
      
      // Initialize AR
      await initializeAR();
    };
    
    init();
    
    // Cleanup
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [effectiveTargetUrl, requestCameraPermission, initializeAR, targetUrl, videoUrl]);

  // Handle video play
  const handlePlayVideo = useCallback(() => {
    const video = document.getElementById("ar-video") as HTMLVideoElement;
    if (video) {
      video.play().then(() => {
        setIsVideoPlaying(true);
        setNeedsUserInteraction(false);
      }).catch((err) => {
        console.error("Video play error:", err);
        setNeedsUserInteraction(true);
      });
    }
  }, []);

  // Auto-play when target found
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

  // Retry function
  const handleRetry = useCallback(() => {
    setError(null);
    setArState("loading");
    isInitializedRef.current = false;
    window.location.reload();
  }, []);

  // Error state
  if (arState === "error" && error) {
    return (
      <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">{error.title}</h2>
          <p className="text-guestalt-gray-light mb-2">{error.message}</p>
          {error.instructions && (
            <p className="text-guestalt-gray-light text-sm mb-6 p-3 bg-white/5 rounded-lg">{error.instructions}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleRetry} className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Tentar novamente
            </button>
            <a href="/" className="px-6 py-3 bg-guestalt-gray-medium text-white rounded-lg font-semibold hover:bg-guestalt-gray-light/20 transition-colors">
              Voltar ao início
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (arState === "loading" || arState === "requesting_permission" || arState === "initializing") {
    return (
      <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center z-50">
        <div className="text-center px-4">
          <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">{loadingMessage}</p>
          {deviceInfo.isIOS && arState === "requesting_permission" && (
            <p className="text-guestalt-gray-light text-sm mt-2">Toque em "Permitir" quando solicitado</p>
          )}
        </div>
      </div>
    );
  }

  // Ready state - render AR scene
  return (
    <div className="ar-container">
      {/* Scene container */}
      <div ref={sceneRef} />
      
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
