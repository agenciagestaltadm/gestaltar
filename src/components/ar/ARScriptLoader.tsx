"use client";

import { useEffect, useState, useCallback } from "react";

// Types for A-Frame and MindAR globals
declare global {
  interface Window {
    AFRAME: any;
    MindAR: any;
  }
}

interface ARScriptLoaderProps {
  children: React.ReactNode;
}

type LoadingState = "idle" | "loading-aframe" | "loading-mindar" | "ready" | "error";

interface LoadingInfo {
  state: LoadingState;
  message: string;
  error?: string;
}

// Script URLs
const AFRAME_URL = "https://cdn.jsdelivr.net/npm/aframe@1.4.0/dist/aframe-master.min.js";
const MINDAR_URL = "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/dist/mindar-image-aframe.prod.js";

// Load a script dynamically
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
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

    script.onload = () => {
      console.log(`[ARScriptLoader] Loaded: ${src}`);
      resolve();
    };

    script.onerror = (error) => {
      console.error(`[ARScriptLoader] Failed to load: ${src}`, error);
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.head.appendChild(script);
  });
}

// Check if A-Frame is ready
function waitForAFrame(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (typeof window !== "undefined" && window.AFRAME) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error("A-Frame initialization timeout"));
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
}

// Check if MindAR is ready
function waitForMindAR(timeout = 10000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (typeof window !== "undefined" && window.MindAR) {
        resolve();
        return;
      }

      // MindAR registers A-Frame components, so we also check for those
      if (typeof window !== "undefined" && window.AFRAME && window.AFRAME.components["mindar-image"]) {
        resolve();
        return;
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error("MindAR initialization timeout"));
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  });
}

export function ARScriptLoader({ children }: ARScriptLoaderProps) {
  const [loadingInfo, setLoadingInfo] = useState<LoadingInfo>({
    state: "idle",
    message: "Preparando ambiente AR...",
  });

  const loadScripts = useCallback(async () => {
    try {
      // Step 1: Load A-Frame
      setLoadingInfo({ state: "loading-aframe", message: "Carregando A-Frame..." });
      await loadScript(AFRAME_URL, "aframe-script");

      // Step 2: Wait for A-Frame to initialize
      setLoadingInfo({ state: "loading-aframe", message: "Inicializando A-Frame..." });
      await waitForAFrame();

      // Small delay to ensure A-Frame is fully ready
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Step 3: Load MindAR
      setLoadingInfo({ state: "loading-mindar", message: "Carregando MindAR..." });
      await loadScript(MINDAR_URL, "mindar-script");

      // Step 4: Wait for MindAR to initialize
      setLoadingInfo({ state: "loading-mindar", message: "Inicializando MindAR..." });
      await waitForMindAR();

      // Small delay to ensure MindAR is fully ready
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Ready!
      setLoadingInfo({ state: "ready", message: "Ambiente AR pronto!" });
      console.log("[ARScriptLoader] All scripts loaded and ready");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      setLoadingInfo({
        state: "error",
        message: "Erro ao carregar scripts AR",
        error: message,
      });
      console.error("[ARScriptLoader] Error:", error);
    }
  }, []);

  useEffect(() => {
    // Only load on client side
    if (typeof window === "undefined") return;

    // Check if already loaded
    if (window.AFRAME && window.AFRAME.components["mindar-image"]) {
      setLoadingInfo({ state: "ready", message: "Ambiente AR pronto!" });
      return;
    }

    loadScripts();
  }, [loadScripts]);

  // Loading state
  if (loadingInfo.state !== "ready") {
    return (
      <div className="fixed inset-0 bg-guestalt-black flex items-center justify-center z-50">
        <div className="text-center px-4">
          {loadingInfo.state === "error" ? (
            <>
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-white text-xl font-bold mb-2">Erro ao carregar AR</h2>
              <p className="text-guestalt-gray-light mb-4">{loadingInfo.error || loadingInfo.message}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Tentar novamente
              </button>
            </>
          ) : (
            <>
              <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white">{loadingInfo.message}</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default ARScriptLoader;
