"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import AROverlay from "./AROverlay";
import { DEMO_TARGET_URL, AR_CONFIG } from "@/lib/ar";

interface ARSceneProps {
  videoUrl: string;
  targetUrl?: string;
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

export default function ARScene({ videoUrl, targetUrl }: ARSceneProps) {
  const [arState, setArState] = useState<ARState>("loading");
  const [isTargetFound, setIsTargetFound] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [error, setError] = useState<ARError | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, isMobile: false, isSafari: false });
  const [loadingMessage, setLoadingMessage] = useState("Preparando experiência AR...");

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isInitializedRef = useRef(false);

  // Use demo target if no custom target provided
  const effectiveTargetUrl = targetUrl || DEMO_TARGET_URL;

  // Detect device on mount
  useEffect(() => {
    const device = detectDevice();
    setDeviceInfo(device);

    if (device.isIOS) {
      setNeedsUserInteraction(true);
    }
  }, []);

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
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

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

  // Initialize AR scene using A-Frame directly
  const initializeAR = useCallback(async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    setArState("initializing");
    setLoadingMessage("Inicializando realidade aumentada...");

    try {
      // Wait for A-Frame and MindAR to be ready
      await new Promise<void>((resolve, reject) => {
        const maxWait = 15000;
        const startTime = Date.now();

        const checkReady = setInterval(() => {
          if (typeof window !== "undefined" && window.AFRAME && window.AFRAME.components["mindar-image"]) {
            clearInterval(checkReady);
            resolve();
          } else if (Date.now() - startTime > maxWait) {
            clearInterval(checkReady);
            reject(new Error("A-Frame/MindAR não carregou. Verifique sua conexão e desative bloqueadores de anúncios."));
          }
        }, 100);
      });

      setLoadingMessage("Configurando cena AR...");

      if (!containerRef.current) {
        throw new Error("Container não encontrado");
      }

      // Create video element for A-Frame assets
      const videoId = `ar-video-${Date.now()}`;
      const video = document.createElement("video");
      video.id = videoId;
      video.src = videoUrl;
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("webkit-playsinline", "true");
      video.loop = true;
      video.crossOrigin = "anonymous";
      video.style.display = "none";
      document.body.appendChild(video);
      videoRef.current = video;

      // Create A-Frame scene
      const scene = document.createElement("a-scene");
      scene.setAttribute("embedded", "");
      scene.setAttribute("vr-mode-ui", "enabled: false");
      scene.setAttribute("device-orientation-permission-ui", "enabled: false");
      scene.setAttribute("renderer", "logarithmicDepthBuffer: true; antialias: true; alpha: true");
      scene.setAttribute("mindar-image", `imageSrc: ${effectiveTargetUrl}; autoStart: true; uiLoading: no; uiError: no; uiScanning: yes;`);
      scene.style.width = "100%";
      scene.style.height = "100%";
      scene.style.position = "fixed";
      scene.style.top = "0";
      scene.style.left = "0";

      // Create assets
      const assets = document.createElement("a-assets");
      assets.appendChild(video);
      scene.appendChild(assets);

      // Create camera
      const camera = document.createElement("a-camera");
      camera.setAttribute("position", "0 0 0");
      camera.setAttribute("look-controls", "enabled: false");
      scene.appendChild(camera);

      // Create target anchor
      const anchor = document.createElement("a-entity");
      anchor.setAttribute("mindar-image-target", "targetIndex: 0");

      // Create video plane
      const videoPlane = document.createElement("a-video");
      videoPlane.setAttribute("src", `#${videoId}`);
      videoPlane.setAttribute("position", "0 0 0");
      videoPlane.setAttribute("rotation", "0 0 0");
      videoPlane.setAttribute("width", "1");
      videoPlane.setAttribute("height", "0.5625");
      anchor.appendChild(videoPlane);

      scene.appendChild(anchor);
      containerRef.current.appendChild(scene);
      sceneRef.current = scene;

      // Wait for scene to initialize
      await new Promise<void>((resolve) => {
        scene.addEventListener("loaded", () => {
          console.log("[ARScene] Scene loaded");
          resolve();
        });

        // Fallback timeout
        setTimeout(() => {
          console.log("[ARScene] Scene loaded (timeout fallback)");
          resolve();
        }, 3000);
      });

      // Set up event listeners
      // A-Frame scene has systems property at runtime
      const aframeScene = scene as any;

      // Listen for target found
      scene.addEventListener("targetFound", () => {
        console.log("[ARScene] Target found");
        setIsTargetFound(true);
      });

      // Listen for target lost
      scene.addEventListener("targetLost", () => {
        console.log("[ARScene] Target lost");
        setIsTargetFound(false);
        setIsVideoPlaying(false);
      });

      // Listen for camera errors
      scene.addEventListener("camera-error", (event: any) => {
        console.error("[ARScene] Camera error:", event);
        setError({
          title: "Erro de câmera",
          message: "Não foi possível acessar a câmera.",
          instructions: "Verifique as permissões do navegador e tente novamente.",
        });
        setArState("error");
      });

      setArState("ready");
      setLoadingMessage("Pronto! Aponte para o alvo.");
    } catch (err) {
      console.error("[ARScene] Initialization error:", err);
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
    if (!effectiveTargetUrl || !videoUrl) return;

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
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = "";
        videoRef.current.remove();
      }
      if (sceneRef.current) {
        sceneRef.current.remove();
      }
    };
  }, [effectiveTargetUrl, videoUrl, requestCameraPermission, initializeAR]);

  // Handle video play
  const handlePlayVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsVideoPlaying(true);
          setNeedsUserInteraction(false);
        })
        .catch((err) => {
          console.error("[ARScene] Video play error:", err);
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
    if (!isTargetFound && videoRef.current) {
      videoRef.current.pause();
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
      <div ref={containerRef} className="fixed inset-0" />

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
