"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import VideoUploader from "./VideoUploader";
import { Button } from "@/components/ui";
import { trackEvent } from "@/lib/analytics";
import { DEMO_TARGET_URL, DEMO_TARGET_IMAGE_URL } from "@/lib/ar";

const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const MAX_TARGET_SIZE = 10 * 1024 * 1024; // 10MB

// MindAR Compiler URL
const MINDAR_COMPILER_URL = "https://hiukim.github.io/mind-ar-js-doc/tools/compile";

export default function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTargetImage, setSelectedTargetImage] = useState<File | null>(null);
  const [mindFile, setMindFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [useCustomTarget, setUseCustomTarget] = useState(false);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [step, setStep] = useState<"upload" | "compile" | "final">("upload");

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

    if (file.size > MAX_TARGET_SIZE) {
      setError("A imagem-alvo excede o tamanho máximo de 10MB.");
      setSelectedTargetImage(null);
      return;
    }

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setTargetPreview(previewUrl);
    
    // Reset mind file when target image changes
    setMindFile(null);
  }, []);

  const handleMindFileSelect = useCallback((file: File) => {
    if (!file.name.endsWith('.mind')) {
      setError("Por favor, selecione um arquivo .mind válido.");
      return;
    }
    setMindFile(file);
    setError(null);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Por favor, selecione um arquivo de vídeo.");
      return;
    }

    if (useCustomTarget && !mindFile) {
      setError("Por favor, faça o upload do arquivo .mind compilado.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    trackEvent("upload_start", { customTarget: useCustomTarget });

    try {
      // Step 1: Create video record
      setStatusMessage("Criando registro do vídeo...");
      setUploadProgress(10);

      const createResponse = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filename: selectedFile.name,
          mimeType: selectedFile.type,
          sizeBytes: selectedFile.size,
          title: title || null,
          hasTargetImage: useCustomTarget && !!mindFile,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Falha ao criar registro do vídeo");
      }

      const { videoId, uploadUrl, targetUploadUrl } = await createResponse.json();

      // Step 2: Upload target file if custom
      if (useCustomTarget && mindFile && targetUploadUrl) {
        setStatusMessage("Enviando target personalizado...");
        setUploadProgress(20);

        const targetUploadResponse = await fetch(targetUploadUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/octet-stream",
          },
          body: mindFile,
        });

        if (!targetUploadResponse.ok) {
          console.warn("Target upload failed, using demo target");
        }
      }

      // Step 3: Upload video with progress
      setStatusMessage("Enviando vídeo...");
      setUploadProgress(30);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = 30 + (event.loaded / event.total) * 60; // 30-90%
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
        xhr.setRequestHeader("Content-Type", selectedFile.type);
        xhr.send(selectedFile);
      });

      // Step 4: Update video status
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

  // Open MindAR compiler in new tab
  const openCompiler = useCallback(() => {
    window.open(MINDAR_COMPILER_URL, '_blank', 'noopener,noreferrer');
    setStep("compile");
  }, []);

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
            onChange={(e) => {
              setUseCustomTarget(e.target.checked);
              if (!e.target.checked) {
                setSelectedTargetImage(null);
                setMindFile(null);
                setTargetPreview(null);
                setStep("upload");
              }
            }}
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
        <div className="mb-6 space-y-4">
          {/* Step 1: Upload target image */}
          <div className="p-4 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">1</span>
              <span className="text-white font-medium">Selecione a imagem do quadro</span>
            </div>
            
            <div
              className={`
                relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer
                transition-all duration-200 min-h-[100px] flex flex-col items-center justify-center
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
                    className="w-24 h-24 object-cover rounded-lg mx-auto mb-2"
                  />
                  <p className="text-white text-sm">{selectedTargetImage?.name}</p>
                </div>
              ) : (
                <>
                  <svg className="w-8 h-8 text-guestalt-gray-light mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-white text-sm">Clique para selecionar</p>
                </>
              )}
            </div>
          </div>

          {/* Step 2: Compile button */}
          {selectedTargetImage && (
            <div className="p-4 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">2</span>
                <span className="text-white font-medium">Compile o target</span>
              </div>
              
              <p className="text-guestalt-gray-light text-sm mb-3">
                Clique no botão abaixo para abrir o compilador do MindAR. Faça upload da imagem e baixe o arquivo <strong>.mind</strong> gerado.
              </p>
              
              <button
                onClick={openCompiler}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                ABRIR COMPILADOR MINDAR
              </button>
            </div>
          )}

          {/* Step 3: Upload .mind file */}
          {selectedTargetImage && (
            <div className="p-4 bg-guestalt-surface rounded-lg border border-guestalt-gray-medium">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">3</span>
                <span className="text-white font-medium">Faça upload do arquivo .mind</span>
              </div>
              
              <div
                className={`
                  relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer
                  transition-all duration-200 min-h-[80px] flex flex-col items-center justify-center
                  ${isUploading ? "pointer-events-none opacity-70" : "hover:border-guestalt-gray-light"}
                  ${mindFile ? "border-green-500/50" : "border-guestalt-gray-medium"}
                `}
                onClick={() => {
                  if (!isUploading) {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = ".mind,application/octet-stream";
                    input.onchange = (e) => {
                      const files = (e.target as HTMLInputElement).files;
                      if (files && files[0]) {
                        handleMindFileSelect(files[0]);
                      }
                    };
                    input.click();
                  }
                }}
              >
                {mindFile ? (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-white text-sm">{mindFile.name}</p>
                    <p className="text-green-500 text-xs mt-1">Arquivo válido!</p>
                  </div>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-guestalt-gray-light mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-white text-sm">Clique para enviar o .mind</p>
                    <p className="text-guestalt-gray-light text-xs mt-1">Baixado do compilador</p>
                  </>
                )}
              </div>
            </div>
          )}
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
          disabled={!selectedFile || (useCustomTarget && !mindFile) || isUploading}
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
