"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { CameraPermissionDialog } from "@/components/ui";
import useCameraPermission from "@/hooks/useCameraPermission";

export default function Hero() {
  const router = useRouter();
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const {
    isSupported,
    permissionState,
    error,
    isRequesting,
    requestPermission,
    clearError,
    deviceType,
    browserType,
  } = useCameraPermission();

  const handleARClick = useCallback(async () => {
    // Check if camera is supported
    if (!isSupported) {
      setShowPermissionDialog(true);
      return;
    }

    // If permission already granted, go directly to AR page
    if (permissionState === "granted") {
      router.push("/ar");
      return;
    }

    // Request permission
    const granted = await requestPermission();
    
    if (granted) {
      router.push("/ar");
    } else {
      setShowPermissionDialog(true);
    }
  }, [isSupported, permissionState, requestPermission, router]);

  const handleRetry = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPermissionDialog(false);
      router.push("/ar");
    }
  }, [requestPermission, router]);

  const handleCloseDialog = useCallback(() => {
    setShowPermissionDialog(false);
    clearError();
  }, [clearError]);

  return (
    <>
      <section className="min-h-screen flex items-center justify-center pt-16 pb-8 px-4">
        <div className="text-center max-w-3xl mx-auto animate-fade-in">
          {/* Logo / Title */}
          <h1 className="font-heading font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tight mb-6">
            GUESTALT AR
          </h1>

          {/* Subtitle */}
          <p className="text-guestalt-gray-light text-lg sm:text-xl md:text-2xl mb-12 max-w-xl mx-auto leading-relaxed">
            Aponte para o quadro.
            <br />
            <span className="text-white">Veja a imagem ganhar vida.</span>
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Button href="/upload" variant="primary" size="lg">
              ENVIAR O VÍDEO
            </Button>

            <Button
              onClick={handleARClick}
              variant="secondary"
              size="lg"
              className="text-center"
            >
              LER O QUADRO EM AR
              <br />
              <span className="text-xs opacity-80">(REALIDADE AUMENTADA)</span>
            </Button>
          </div>

          {/* Decorative element */}
          <div className="mt-16 flex justify-center">
            <div className="w-px h-20 bg-gradient-to-b from-transparent via-guestalt-gray-medium to-transparent" />
          </div>
        </div>
      </section>

      {/* Camera Permission Dialog */}
      <CameraPermissionDialog
        isOpen={showPermissionDialog}
        error={error}
        deviceType={deviceType}
        browserType={browserType}
        isRequesting={isRequesting}
        onRetry={handleRetry}
        onClose={handleCloseDialog}
      />
    </>
  );
}
