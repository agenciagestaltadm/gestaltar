"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import VideoUploader from "./VideoUploader";
import { Button } from "@/components/ui";
import { compileTarget, validateImageForTracking, loadImageData } from "@/lib/mindar";
import { compressVideo, getVideoInfo, isCompressionSupported } from "@/lib/video";
import { trackEvent } from "@/lib/analytics";
import { DEMO_TARGET_URL, DEMO_TARGET_IMAGE_URL } from "@/lib/ar";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_TARGET_SIZE = 10 * 1024 * 1024; // 10MB

export default function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTargetImage, setSelectedTargetImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [useCustomTarget, setUseCustomTarget] = useState(false);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [targetValidation, setTargetValidation] = useState<{ valid: boolean; message: string } | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("O arquivo de vídeo excede o tamanho máximo de 200MB.");
      setSelectedFile(null);
    }
  }, []);

  const handleTargetImageSelect = useCallback(async (file: File) => {
    setSelectedTargetImage(file);
    setError(null);
    setTargetValidation(null);

    if (file.size > MAX_TARGET_SIZE) {
      setError("A imagem-alvo excede o tamanho máximo de 10MB.");
      setSelectedTargetImage(null);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setTargetPreview(previewUrl);

    // Validate image for tracking
    try {
      const imageData = await loadImageData(file);
      const validation = validateImageForTracking(imageData);
      setTargetValidation(validation);

      if (!validation.valid) {
        setError(validation.message);
      }
    } catch (err) {
      setError("Falha ao processar imagem. Tente outra imagem.");
      setSelectedTargetImage(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Por favor, selecione um arquivo de vídeo.");
      return;
    }

    if (useCustomTarget && !selectedTargetImage) {
      setError("Por favor, selecione uma imagem-alvo ou desative o target personalizado.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    trackEvent("upload_start", { customTarget: useCustomTarget });

    try {
      let targetBlob: Blob | null = null;
      let targetUrl = DEMO_TARGET_URL;

      // Step 1: Generate custom target if needed
      if (useCustomTarget && selectedTargetImage) {
        setStatusMessage("Gerando target personalizado...");
        setUploadProgress(5);

        const targetBuffer = await compileTarget(selectedTargetImage, (progress) => {
          setUploadProgress(5 + progress * 0.15); // 5-20%
        });
        targetBlob = new Blob([targetBuffer], { type: "application/octet-stream" });

        setStatusMessage("Target gerado com sucesso!");
        trackEvent("target_generated", { imageSize: selectedTargetImage.size });
      }

      // Step 2: Compress video if needed and supported
      let videoToUpload = selectedFile;
      const videoInfo = await getVideoInfo(selectedFile);

      if (isCompressionSupported() && videoInfo.size > 50 * 1024 * 1024) {
        setStatusMessage("Comprimindo vídeo...");
        setUploadProgress(20);

        try {
          const result = await compressVideo(
            selectedFile,
            { maxSizeMB: 50, quality: "medium" },
            (progress, stage) => {
              setStatusMessage(stage);
              setUploadProgress(20 + progress * 0.3); // 20-50%
            }
          );

          videoToUpload = new File([result.blob], selectedFile.name, {
            type: result.format === "mp4" ? "video/mp4" : "video/webm",
          });

          setStatusMessage(`Vídeo comprimido: ${Math.round(result.compressionRatio * 100)}% do tamanho original`);
          trackEvent("video_compressed", {
            originalSize: result.originalSize,
            compressedSize: result.compressedSize,
            ratio: result.compressionRatio,
          });
        } catch (compressError) {
          console.warn("Video compression failed, using original:", compressError);
          setStatusMessage("Usando vídeo original (compressão não disponível)");
        }
      }

      // Step 3: Create video record
      setStatusMessage("Criando registro do vídeo...");
      setUploadProgress(50);

      const createResponse = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: videoToUpload.name,
          mimeType: videoToUpload.type,
          sizeBytes: videoToUpload.size,
          title: title || null,
          hasTargetImage: useCustomTarget && !!targetBlob,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Falha ao criar registro do vídeo");
      }

      const { videoId, uploadUrl, targetUploadUrl } = await createResponse.json();

      // Step 4: Upload target file if custom
      if (useCustomTarget && targetBlob && targetUploadUrl) {
        setStatusMessage("Enviando target personalizado...");
        setUploadProgress(55);

        const targetUploadResponse = await fetch(targetUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: targetBlob,
        });

        if (!targetUploadResponse.ok) {
          console.warn("Target upload failed, using demo target");
        } else {
          targetUrl = `${window.location.origin}/api/targets/${videoId}`;
        }
      }

      // Step 5: Upload video with progress
      setStatusMessage("Enviando vídeo...");
      setUploadProgress(60);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = 60 + (event.loaded / event.total) * 35; // 60-95%
            setUploadProgress(Math.round(progress));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Falha no upload do vídeo"));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Erro de rede durante o upload"));
        });

        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", videoToUpload.type);
        xhr.send(videoToUpload);
      });

      // Step 6: Update video status
      setStatusMessage("Finalizando...");
      setUploadProgress(95);

      await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ready" }),
      });

      setUploadProgress(100);
      trackEvent("upload_complete", { videoId, customTarget: useCustomTarget });

      // Redirect to success page
      router.push(`/success?vid=${videoId}${useCustomTarget ? "&custom=1" : ""}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ocorreu um erro durante o upload"
      );
      trackEvent("upload_error", { error: err instanceof Error ? err.message : "unknown" });
      setIsUploading(false);
      setUploadProgress(0);
      setStatusMessage("");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Title Input */}
      <div className="mb-6">
        <label
          htmlFor="title"
          className="block text-sm font-medium text-guestalt-gray-light mb-2"
        >
          Título do vídeo (opcional)
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Minha campanha"
          disabled={isUploading}
          className="w-full px-4 py-3 bg-guestalt-surface border border-guestalt-gray-medium rounded-lg text-white placeholder-guestalt-gray-light/50 focus:outline-none focus:border-white transition-colors disabled:opacity-50"
        />
      </div>

      {/* Custom Target Toggle */}
      <div className="mb-6 p-4 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useCustomTarget}
            onChange={(e) => setUseCustomTarget(e.target.checked)}
            disabled={isUploading}
            className="w-5 h-5 rounded border-guestalt-gray-medium bg-guestalt-surface text-white focus:ring-white"
          />
          <div>
            <span className="text-white font-medium">Usar imagem personalizada como target</span>
            <p className="text-guestalt-gray-light text-xs mt-1">
              Se não selecionado, será usado o target padrão do sistema
            </p>
          </div>
        </label>
      </div>

      {/* Target Image Upload (if custom) */}
      {useCustomTarget && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-guestalt-gray-light mb-2">
            Imagem-alvo (quadro) *
          </label>
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-all duration-200 min-h-[120px] flex flex-col items-center justify-center
              ${isUploading ? "pointer-events-none opacity-70" : "hover:border-guestalt-gray-light"}
              ${selectedTargetImage ? "border-green-500/50" : "border-guestalt-gray-medium"}
            `}
            onClick={() => {
              if (!isUploading) {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/png,image/jpeg,image/webp";
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files && files[0]) {
                    handleTargetImageSelect(files[0]);
                  }
                };
                input.click();
              }
            }}
          >
            {targetPreview ? (
              <div className="text-center">
                <img
                  src={targetPreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                />
                <p className="text-white text-sm">{selectedTargetImage?.name}</p>
                {targetValidation && (
                  <p className={`text-xs mt-1 ${targetValidation.valid ? "text-green-500" : "text-red-500"}`}>
                    {targetValidation.message}
                  </p>
                )}
              </div>
            ) : (
              <>
                <svg
                  className="w-8 h-8 text-guestalt-gray-light mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-white text-sm font-medium">
                  Clique para selecionar a imagem
                </p>
                <p className="text-guestalt-gray-light text-xs mt-1">
                  PNG, JPG ou WebP (máx. 10MB)
                </p>
              </>
            )}
          </div>
          <p className="text-guestalt-gray-light text-xs mt-2">
            Esta imagem será usada como referência para o AR. O vídeo aparecerá sobre ela.
            Use imagens com bom contraste e detalhes para melhor tracking.
          </p>
        </div>
      )}

      {/* Video Uploader */}
      <VideoUploader
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        error={error}
      />

      {/* Status Message */}
      {statusMessage && (
        <div className="mt-4 p-3 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium">
          <p className="text-guestalt-gray-light text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            {statusMessage}
          </p>
        </div>
      )}

      {/* Target Info (if not custom) */}
      {!useCustomTarget && (
        <div className="mt-6 p-4 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium">
          <h3 className="text-white font-medium mb-2">📋 Sobre o target AR</h3>
          <p className="text-guestalt-gray-light text-sm mb-3">
            Seu vídeo será exibido sobre uma imagem de referência padrão.
            Após o upload, você receberá instruções de como visualizar em AR.
          </p>
          <a
            href={DEMO_TARGET_IMAGE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-white underline hover:no-underline"
          >
            Ver imagem de referência (target)
          </a>
        </div>
      )}

      {/* Warning */}
      <div className="mt-6 p-4 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium">
        <p className="text-guestalt-gray-light text-xs text-center">
          ⚠️ Não envie conteúdo sensível ou ilegal. Ao fazer upload, você
          concorda com nossos termos de uso.
        </p>
      </div>

      {/* Submit Button */}
      <div className="mt-6">
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || (useCustomTarget && !selectedTargetImage) || isUploading}
          isLoading={isUploading}
          fullWidth
          size="lg"
        >
          {isUploading ? "PROCESSANDO..." : "ENVIAR VÍDEO"}
        </Button>
      </div>
    </div>
  );
}
