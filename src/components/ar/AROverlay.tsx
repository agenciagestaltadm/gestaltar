interface AROverlayProps {
  isTargetFound: boolean;
  isVideoPlaying: boolean;
  needsUserInteraction: boolean;
  onPlayVideo: () => void;
}

export default function AROverlay({
  isTargetFound,
  isVideoPlaying,
  needsUserInteraction,
  onPlayVideo,
}: AROverlayProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-10">
      {/* Instructions - when target not found */}
      {!isTargetFound && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full px-4">
          <div className="bg-black/70 px-4 py-3 sm:px-6 sm:py-4 rounded-lg backdrop-blur-sm inline-block max-w-xs sm:max-w-sm">
            <p className="text-white text-base sm:text-lg font-medium">
              Aponte a câmera para o quadro
            </p>
            <p className="text-guestalt-gray-light text-xs sm:text-sm mt-1 sm:mt-2">
              Aguarde a detecção...
            </p>
          </div>
        </div>
      )}

      {/* Target found indicator */}
      {isTargetFound && !isVideoPlaying && !needsUserInteraction && (
        <div className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 safe-area-top">
          <div className="bg-green-500/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm">
            <p className="text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Quadro detectado
            </p>
          </div>
        </div>
      )}

      {/* iOS - Tap to play button */}
      {isTargetFound && needsUserInteraction && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto px-4">
          <button
            onClick={onPlayVideo}
            className="bg-white text-black px-6 py-3 sm:px-8 sm:py-4 rounded-full text-base sm:text-lg font-semibold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2 sm:gap-3 active:scale-95"
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Toque para iniciar o vídeo
          </button>
        </div>
      )}

      {/* Video playing indicator */}
      {isTargetFound && isVideoPlaying && (
        <div className="absolute top-4 sm:top-8 left-1/2 transform -translate-x-1/2 safe-area-top">
          <div className="bg-green-500/80 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm">
            <p className="text-white text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
              Reproduzindo
            </p>
          </div>
        </div>
      )}

      {/* Close button */}
      <div className="absolute top-4 right-4 pointer-events-auto safe-area-top safe-area-right">
        <a
          href="/"
          className="bg-black/50 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors backdrop-blur-sm active:scale-95"
          aria-label="Fechar"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </a>
      </div>

      {/* Home link */}
      <div className="absolute top-4 left-4 pointer-events-auto safe-area-top safe-area-left">
        <a
          href="/"
          className="bg-black/50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full flex items-center gap-1.5 sm:gap-2 text-white hover:bg-black/70 transition-colors backdrop-blur-sm active:scale-95"
        >
          <span className="font-heading font-bold text-xs sm:text-sm">GUESTALT AR</span>
        </a>
      </div>

      {/* Scanning animation - when looking for target */}
      {!isTargetFound && (
        <div className="absolute bottom-8 sm:bottom-12 left-1/2 transform -translate-x-1/2 safe-area-bottom">
          <div className="flex flex-col items-center gap-2">
            {/* Scanning frame */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-t-2 border-white/50 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-t-2 border-white/50 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 sm:w-8 sm:h-8 border-l-2 border-b-2 border-white/50 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-8 sm:h-8 border-r-2 border-b-2 border-white/50 rounded-br-lg" />
              
              {/* Scanning line animation */}
              <div className="absolute inset-4 sm:inset-6 overflow-hidden">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-scan" />
              </div>
            </div>
            
            <p className="text-guestalt-gray-light text-xs sm:text-sm">
              Enquadre o quadro
            </p>
          </div>
        </div>
      )}

      {/* Inline styles for scanning animation */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(60px);
          }
          100% {
            transform: translateY(0);
          }
        }
        
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
