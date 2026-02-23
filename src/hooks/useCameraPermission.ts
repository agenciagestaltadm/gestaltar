"use client";

import { useState, useCallback, useEffect } from "react";

export type PermissionState = "unknown" | "granted" | "denied" | "prompt";

export type DeviceType = "ios" | "android" | "desktop";

export type BrowserType = "safari" | "chrome" | "firefox" | "edge" | "other";

export interface CameraError {
  type: "not_supported" | "not_allowed" | "not_found" | "not_readable" | "overconstrained" | "unknown";
  message: string;
  instructions?: string;
}

export interface UseCameraPermissionReturn {
  permissionState: PermissionState;
  isSupported: boolean;
  deviceType: DeviceType;
  browserType: BrowserType;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  error: CameraError | null;
  isRequesting: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<void>;
  clearError: () => void;
}

// Detect device type
function detectDeviceType(): DeviceType {
  if (typeof navigator === "undefined") return "desktop";
  
  const ua = navigator.userAgent;
  
  // iOS detection (including iPad on iOS 13+)
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  
  if (isIOS) return "ios";
  
  // Android detection
  if (/Android/.test(ua)) return "android";
  
  return "desktop";
}

// Detect browser type
function detectBrowserType(): BrowserType {
  if (typeof navigator === "undefined") return "other";
  
  const ua = navigator.userAgent;
  
  // Chrome must be checked before Safari because Chrome on iOS includes Safari
  if (/CriOS/.test(ua)) return "chrome";
  if (/FxiOS/.test(ua)) return "firefox";
  if (/EdgiOS/.test(ua)) return "edge";
  
  // Safari on iOS
  if (/Safari/.test(ua) && /AppleWebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) {
    return "safari";
  }
  
  // Desktop browsers
  if (/Chrome/.test(ua) && !/Edg/.test(ua)) return "chrome";
  if (/Firefox/.test(ua)) return "firefox";
  if (/Edg/.test(ua)) return "edge";
  
  return "other";
}

// Get permission instructions based on device and browser
function getPermissionInstructions(deviceType: DeviceType, browserType: BrowserType): string {
  if (deviceType === "ios") {
    if (browserType === "safari") {
      return "Ajustes > Safari > Câmera > Permitir";
    }
    if (browserType === "chrome") {
      return "Ajustes > Chrome > Câmera > Permitir";
    }
    return "Ajustes > [Navegador] > Câmera > Permitir";
  }
  
  if (deviceType === "android") {
    if (browserType === "chrome") {
      return "Configurações > Apps > Chrome > Permissões > Câmera > Permitir";
    }
    return "Configurações > Apps > [Navegador] > Permissões > Câmera > Permitir";
  }
  
  // Desktop
  if (browserType === "chrome") {
    return "Clique no ícone de câmera na barra de endereços > Permitir";
  }
  if (browserType === "firefox") {
    return "Clique no ícone de câmera na barra de endereços > Permitir";
  }
  if (browserType === "safari") {
    return "Safari > Preferências > Sites > Câmera > Permitir";
  }
  if (browserType === "edge") {
    return "Clique no ícone de câmera na barra de endereços > Permitir";
  }
  
  return "Verifique as configurações de permissão do seu navegador";
}

// Map error to user-friendly message
function mapErrorToMessage(error: DOMException, deviceType: DeviceType, browserType: BrowserType): CameraError {
  const instructions = getPermissionInstructions(deviceType, browserType);
  
  switch (error.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return {
        type: "not_allowed",
        message: "Permissão de câmera negada. Por favor, habilite o acesso à câmera nas configurações.",
        instructions,
      };
    
    case "NotFoundError":
    case "DevicesNotFoundError":
      return {
        type: "not_found",
        message: "Nenhuma câmera encontrada no dispositivo.",
        instructions: "Verifique se seu dispositivo possui uma câmera conectada.",
      };
    
    case "NotReadableError":
    case "TrackStartError":
      return {
        type: "not_readable",
        message: "A câmera está sendo usada por outro aplicativo.",
        instructions: "Feche outros aplicativos que possam estar usando a câmera e tente novamente.",
      };
    
    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return {
        type: "overconstrained",
        message: "A câmera não atende aos requisitos necessários.",
        instructions: "Tente usar uma câmera diferente se disponível.",
      };
    
    default:
      return {
        type: "unknown",
        message: `Erro ao acessar a câmera: ${error.message || "Erro desconhecido"}`,
        instructions: "Tente recarregar a página ou usar um navegador diferente.",
      };
  }
}

export function useCameraPermission(): UseCameraPermissionReturn {
  const [permissionState, setPermissionState] = useState<PermissionState>("unknown");
  const [error, setError] = useState<CameraError | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  
  const deviceType = detectDeviceType();
  const browserType = detectBrowserType();
  const isIOS = deviceType === "ios";
  const isAndroid = deviceType === "android";
  const isMobile = isIOS || isAndroid;
  
  // Check if getUserMedia is supported
  const isSupported = typeof navigator !== "undefined" && 
    typeof navigator.mediaDevices !== "undefined" && 
    typeof navigator.mediaDevices.getUserMedia === "function";
  
  // Check current permission status
  const checkPermission = useCallback(async () => {
    if (!isSupported) {
      setError({
        type: "not_supported",
        message: "Seu navegador não suporta acesso à câmera.",
        instructions: "Use um navegador moderno como Chrome, Safari, Firefox ou Edge.",
      });
      return;
    }
    
    try {
      // Try to use Permissions API (not supported in all browsers)
      if ("permissions" in navigator && "query" in navigator.permissions) {
        const result = await navigator.permissions.query({ name: "camera" as PermissionName });
        setPermissionState(result.state as PermissionState);
        
        // Listen for permission changes
        result.addEventListener("change", () => {
          setPermissionState(result.state as PermissionState);
        });
      }
    } catch {
      // Permissions API not supported, will check on request
      setPermissionState("unknown");
    }
  }, [isSupported]);
  
  // Request camera permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError({
        type: "not_supported",
        message: "Seu navegador não suporta acesso à câmera.",
        instructions: "Use um navegador moderno como Chrome, Safari, Firefox ou Edge.",
      });
      return false;
    }
    
    setIsRequesting(true);
    setError(null);
    
    try {
      // Request camera access with constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "environment", // Prefer back camera for AR
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Permission granted - stop the stream immediately (we just wanted permission)
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      setIsRequesting(false);
      return true;
    } catch (err) {
      const domError = err as DOMException;
      const cameraError = mapErrorToMessage(domError, deviceType, browserType);
      
      setError(cameraError);
      
      if (domError.name === "NotAllowedError" || domError.name === "PermissionDeniedError") {
        setPermissionState("denied");
      }
      
      setIsRequesting(false);
      return false;
    }
  }, [isSupported, deviceType, browserType]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);
  
  return {
    permissionState,
    isSupported,
    deviceType,
    browserType,
    isIOS,
    isAndroid,
    isMobile,
    error,
    isRequesting,
    requestPermission,
    checkPermission,
    clearError,
  };
}

export default useCameraPermission;
