"use client";

import { useEffect, useState } from "react";
import { CameraError, DeviceType, BrowserType } from "@/hooks/useCameraPermission";

interface CameraPermissionDialogProps {
  isOpen: boolean;
  error: CameraError | null;
  deviceType: DeviceType;
  browserType: BrowserType;
  isRequesting: boolean;
  onRetry: () => void;
  onClose: () => void;
}

export default function CameraPermissionDialog({
  isOpen,
  error,
  deviceType,
  browserType,
  isRequesting,
  onRetry,
  onClose,
}: CameraPermissionDialogProps) {
  const [showInstructions, setShowInstructions] = useState(false);

  // Reset instructions when dialog opens
  useEffect(() => {
    if (isOpen) {
      setShowInstructions(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Get device-specific icon
  const getDeviceIcon = () => {
    if (deviceType === "ios") {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    if (deviceType === "android") {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  };

  // Get error icon based on error type
  const getErrorIcon = () => {
    if (!error) {
      return (
        <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      );
    }

    switch (error.type) {
      case "not_supported":
        return (
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        );
      case "not_allowed":
        return (
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      case "not_found":
        return (
          <div className="w-16 h-16 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  // Get browser name for instructions
  const getBrowserName = () => {
    switch (browserType) {
      case "safari": return "Safari";
      case "chrome": return "Chrome";
      case "firefox": return "Firefox";
      case "edge": return "Edge";
      default: return "navegador";
    }
  };

  // Get device name for instructions
  const getDeviceName = () => {
    switch (deviceType) {
      case "ios": return "iPhone/iPad";
      case "android": return "Android";
      default: return "computador";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-guestalt-surface border border-guestalt-gray-medium rounded-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="p-6 text-center">
          {getErrorIcon()}
          
          <h2 className="text-xl font-bold text-white mb-2">
            {error ? "Acesso à Câmera" : "Permitir Câmera"}
          </h2>
          
          <p className="text-guestalt-gray-light text-sm leading-relaxed">
            {error ? error.message : "Para usar a realidade aumentada, precisamos de acesso à câmera do seu dispositivo."}
          </p>
        </div>

        {/* Instructions (collapsible) */}
        {error?.instructions && (
          <div className="px-6 pb-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between p-3 bg-guestalt-black/50 rounded-lg text-left"
            >
              <span className="text-sm text-guestalt-gray-light">
                Como habilitar a câmera
              </span>
              <svg
                className={`w-5 h-5 text-guestalt-gray-light transition-transform ${showInstructions ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showInstructions && (
              <div className="mt-3 p-4 bg-guestalt-black/30 rounded-lg">
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-guestalt-gray-light mt-0.5">
                    {getDeviceIcon()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {getDeviceName()} - {getBrowserName()}
                    </p>
                    <p className="text-guestalt-gray-light text-xs mt-1">
                      {error.instructions}
                    </p>
                  </div>
                </div>
                
                {/* Visual steps for iOS */}
                {deviceType === "ios" && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-guestalt-gray-light mb-2">
                      Passos para {browserType === "safari" ? "Safari iOS" : "iOS"}:
                    </p>
                    <ol className="text-xs text-white space-y-1 list-decimal list-inside">
                      <li>Abra os Ajustes do iPhone/iPad</li>
                      <li>Role para baixo e toque em {getBrowserName()}</li>
                      <li>Toque em "Câmera"</li>
                      <li>Selecione "Permitir"</li>
                      <li>Volte ao navegador e recarregue a página</li>
                    </ol>
                  </div>
                )}
                
                {/* Visual steps for Android */}
                {deviceType === "android" && (
                  <div className="mt-4 p-3 bg-white/5 rounded-lg">
                    <p className="text-xs text-guestalt-gray-light mb-2">
                      Passos para Android:
                    </p>
                    <ol className="text-xs text-white space-y-1 list-decimal list-inside">
                      <li>Abra as Configurações do Android</li>
                      <li>Toque em "Apps" ou "Aplicativos"</li>
                      <li>Encontre e toque em {getBrowserName()}</li>
                      <li>Toque em "Permissões"</li>
                      <li>Toque em "Câmera" e selecione "Permitir"</li>
                      <li>Volte ao navegador e recarregue a página</li>
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {isRequesting && (
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-3 p-4 bg-blue-500/10 rounded-lg">
              <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-400 text-sm">Solicitando permissão...</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-guestalt-gray-medium text-white rounded-lg font-medium hover:bg-guestalt-gray-medium/80 transition-colors"
          >
            Cancelar
          </button>
          
          {!error?.type || error.type === "not_allowed" || error.type === "not_readable" ? (
            <button
              onClick={onRetry}
              disabled={isRequesting}
              className="flex-1 px-4 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isRequesting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Aguarde...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Tentar Novamente
                </>
              )}
            </button>
          ) : null}
        </div>

        {/* Footer info */}
        <div className="px-6 pb-6">
          <p className="text-xs text-guestalt-gray-light text-center">
            Sua câmera é usada apenas para exibir a experiência de realidade aumentada.
            Nenhuma imagem é gravada ou enviada para servidores.
          </p>
        </div>
      </div>
    </div>
  );
}
