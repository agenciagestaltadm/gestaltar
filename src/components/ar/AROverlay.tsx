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
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="bg-black/70 px-6 py-4 rounded-lg backdrop-blur-sm">
            <p className="text-white text-lg font-medium">
              Aponte a câmera para o quadro
            </p>
            <p className="text-guestalt-gray-light text-sm mt-2">
              Aguarde a detecção...
            </p>
          </div>
        </div>
      )}

      {/* Target found indicator */}
      {isTargetFound && !isVideoPlaying && !needsUserInteraction && (
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-green-500/80 px-4 py-2 rounded-full backdrop-blur-sm">
            <p className="text-white text-sm font-medium flex items-center gap-2">
              <svg
                className="w-4 h-4"
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
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <button
            onClick={onPlayVideo}
            className="bg-white text-black px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-3"
          >
            <svg
              className="w-6 h-6"
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
        <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-green-500/80 px-4 py-2 rounded-full backdrop-blur-sm">
            <p className="text-white text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Reproduzindo
            </p>
          </div>
        </div>
      )}

      {/* Close button */}
      <div className="absolute top-4 right-4 pointer-events-auto">
        <a
          href="/"
          className="bg-black/50 w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
        >
          <svg
            className="w-5 h-5"
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
      <div className="absolute top-4 left-4 pointer-events-auto">
        <a
          href="/"
          className="bg-black/50 px-4 py-2 rounded-full flex items-center gap-2 text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
        >
          <span className="font-heading font-bold text-sm">GUESTALT AR</span>
        </a>
      </div>
    </div>
  );
}
