"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { DEMO_TARGET_URL, DEMO_VIDEO_URL } from "@/lib/ar";

// Types for A-Frame and MindAR globals
declare global {
  interface Window {
    AFRAME: any;
    MindAR: any;
  }
}

interface ARSceneProps {
  videoUrl: string;
  targetUrl?: string;
}

type ARState = "idle" | "loading" | "requesting_permission" | "initializing" | "ready" | "error";

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

// Script URLs
const AFRAME_URL = "https://cdn.jsdelivr.net/npm/aframe@1.5.0/dist/aframe-master.min.js";
const MINDAR_URL = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.js";

// Load a script dynamically
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(id);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));

    document.head.appendChild(script);
  });
}

export default function ARScene({ videoUrl, targetUrl }: ARSceneProps) {
  const [arState, setArState] = useState<ARState>("idle");
  const [isTargetFound, setIsTargetFound] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [error, setError] = useState<ARError | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, isMobile: false, isSafari: false });
  const [loadingMessage, setLoadingMessage] = useState("");
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const isInitializedRef = useRef(false);

  // Use demo target if no custom target provided
  const effectiveTargetUrl = targetUrl || DEMO_TARGET_URL;
  const effectiveVideoUrl = videoUrl || DEMO_VIDEO_URL;

  // Detect device on mount
  useEffect(() => {
    const device = detectDevice();
    setDeviceInfo(device);
  }, []);

  // Load A-Frame and MindAR scripts
  const loadScripts = useCallback(async () => {
    setLoadingMessage("Carregando componentes AR...");
    
    try {
      await loadScript(AFRAME_URL, "aframe-script");
      setLoadingMessage("Inicializando A-Frame...");
      
      // Wait for A-Frame
      await new Promise<void>((resolve) => {
        const check = () => {
          if (window.AFRAME) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });

      await new Promise((resolve) => setTimeout(resolve, 200));

      await loadScript(MINDAR_URL, "mindar-script");
      setLoadingMessage("Inicializando MindAR...");

      // Wait for MindAR
      await new Promise<void>((resolve) => {
        const check = () => {
          if (window.AFRAME?.components?.["mindar-image"]) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      setScriptsLoaded(true);
    } catch (err) {
      setError({
        title: "Erro ao carregar",
        message: "Não foi possível carregar os componentes de AR.",
        instructions: "Verifique sua conexão e tente novamente.",
      });
      setArState("error");
    }
  }, []);

  // Request camera permission - MUST be called from user gesture
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

  // Initialize AR scene
  const initializeAR = useCallback(async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    setArState("initializing");
    setLoadingMessage("Inicializando realidade aumentada...");

    try {
      if (!containerRef.current) {
        throw new Error("Container não encontrado");
      }

      // Create video element for A-Frame assets
      const videoId = `ar-video-${Date.now()}`;
      const video = document.createElement("video");
      video.id = videoId;
      video.src = effectiveVideoUrl;
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.setAttribute("webkit-playsinline", "true");
      video.setAttribute("playsinline", "true");
      video.loop = true;
      video.crossOrigin = "anonymous";
      video.style.display = "none";
      document.body.appendChild(video);
      videoRef.current = video;

      setLoadingMessage("Configurando cena AR...");

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
        scene.addEventListener("loaded", () => resolve());
        setTimeout(() => resolve(), 3000);
      });

      // Set up event listeners
      scene.addEventListener("targetFound", () => {
        console.log("[ARScene] Target found");
        setIsTargetFound(true);
      });

      scene.addEventListener("targetLost", () => {
        console.log("[ARScene] Target lost");
        setIsTargetFound(false);
        setIsVideoPlaying(false);
      });

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
  }, [effectiveTargetUrl, effectiveVideoUrl]);

  // Handle "ABRIR CÂMERA" button click - MUST be from user gesture
  const handleOpenCamera = useCallback(async () => {
    setArState("loading");
    
    // Load scripts first
    if (!scriptsLoaded) {
      await loadScripts();
    }

    // Request camera permission (must be from user gesture)
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    // Initialize AR
    await initializeAR();
  }, [scriptsLoaded, loadScripts, requestCameraPermission, initializeAR]);

  // Handle video play
  const handlePlayVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsVideoPlaying(true);
        })
        .catch((err) => {
          console.error("[ARScene] Video play error:", err);
        });
    }
  }, []);

  // Auto-play when target found
  useEffect(() => {
    if (isTargetFound && !isVideoPlaying) {
      handlePlayVideo();
    }
  }, [isTargetFound, isVideoPlaying, handlePlayVideo]);

  // Pause video when target lost
  useEffect(() => {
    if (!isTargetFound && videoRef.current) {
      videoRef.current.pause();
    }
  }, [isTargetFound]);

  // Retry function
  const handleRetry = useCallback(() => {
    setError(null);
    setArState("idle");
    isInitializedRef.current = false;
    
    // Clean up
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.remove();
    }
    if (sceneRef.current) {
      sceneRef.current.remove();
    }
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

  // Idle state - Show "ABRIR CÂMERA" button (essential for iOS)
  if (arState === "idle") {
    return (
      <div className="fixed inset-0 bg-guestalt-black flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-md">
          {/* AR Icon */}
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>

          <h1 className="text-white text-2xl font-bold mb-2">Realidade Aumentada</h1>
          <p className="text-guestalt-gray-light mb-6">
            Aponte a câmera para o quadro impresso para ver o vídeo em AR
          </p>

          {/* Main CTA Button */}
          <button
            onClick={handleOpenCamera}
            className="w-full px-8 py-4 bg-white text-black rounded-full text-xl font-bold hover:bg-gray-100 transition-all active:scale-95 mb-4"
          >
            ABRIR CÂMERA
          </button>

          {/* iOS specific hint */}
          {deviceInfo.isIOS && (
            <p className="text-guestalt-gray-light text-xs mb-4">
              Toque em "Permitir" quando solicitado
            </p>
          )}

          {/* Instructions */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg text-left">
            <h3 className="text-white font-medium mb-2">📋 Instruções:</h3>
            <ol className="text-guestalt-gray-light text-sm space-y-1 list-decimal list-inside">
              <li>Toque em "ABRIR CÂMERA"</li>
              <li>Permita o acesso à câmera</li>
              <li>Aponte para o quadro impresso</li>
              <li>O vídeo aparecerá sobre o quadro!</li>
            </ol>
          </div>

          {/* Back link */}
          <a href="/" className="inline-block mt-6 text-guestalt-gray-light text-sm underline hover:text-white">
            Voltar ao início
          </a>
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

      {/* Scanning overlay */}
      {arState === "ready" && !isTargetFound && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="text-center">
            <div className="w-48 h-48 border-2 border-white/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-white text-lg font-medium">Aponte para o quadro</p>
            <p className="text-white/70 text-sm">O vídeo aparecerá automaticamente</p>
          </div>
        </div>
      )}

      {/* Target found indicator */}
      {isTargetFound && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-green-500/80 text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Quadro detectado
          </div>
        </div>
      )}

      {/* Back button */}
      <a
        href="/"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-colors"
      >
        Voltar
      </a>
    </div>
  );
}
