"use client";

import { useCallback, useState, useRef } from "react";
import { ProgressBar } from "@/components/ui";

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  onTargetImageSelect?: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  selectedTargetImage?: File | null;
}

export default function VideoUploader({
  onFileSelect,
  onTargetImageSelect,
  isUploading,
  uploadProgress,
  error,
  selectedTargetImage,
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingTarget, setIsDraggingTarget] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("video/")) {
          setSelectedFile(file);
          onFileSelect(file);
        } else {
          alert("Por favor, selecione um arquivo de vídeo válido.");
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleTargetDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingTarget(true);
  }, []);

  const handleTargetDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingTarget(false);
  }, []);

  const handleTargetDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingTarget(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/")) {
          onTargetImageSelect?.(file);
        } else {
          alert("Por favor, selecione um arquivo de imagem válido.");
        }
      }
    },
    [onTargetImageSelect]
  );

  const handleTargetInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        onTargetImageSelect?.(file);
      }
    },
    [onTargetImageSelect]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleTargetClick = useCallback(() => {
    targetInputRef.current?.click();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full space-y-6">
      {/* Target Image Upload */}
      <div>
        <label className="block text-sm font-medium text-guestalt-gray-light mb-2">
          Imagem-alvo (quadro) *
        </label>
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
            transition-all duration-200 min-h-[120px] flex flex-col items-center justify-center
            ${
              isDraggingTarget
                ? "border-white bg-white/5"
                : "border-guestalt-gray-medium hover:border-guestalt-gray-light"
            }
            ${isUploading ? "pointer-events-none opacity-70" : ""}
          `}
          onDragOver={handleTargetDragOver}
          onDragLeave={handleTargetDragLeave}
          onDrop={handleTargetDrop}
          onClick={handleTargetClick}
        >
          <input
            ref={targetInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleTargetInput}
            className="hidden"
            disabled={isUploading}
          />

          {!selectedTargetImage ? (
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
                Arraste a imagem ou clique para selecionar
              </p>
              <p className="text-guestalt-gray-light text-xs mt-1">
                PNG, JPG ou WebP
              </p>
            </>
          ) : (
            <div className="text-center">
              <p className="text-white font-medium text-sm">{selectedTargetImage.name}</p>
              <p className="text-guestalt-gray-light text-xs">
                {formatFileSize(selectedTargetImage.size)}
              </p>
            </div>
          )}
        </div>
        <p className="text-guestalt-gray-light text-xs mt-2">
          Esta imagem será usada como referência para o AR. O vídeo aparecerá sobre ela.
        </p>
      </div>

      {/* Video Upload */}
      <div>
        <label className="block text-sm font-medium text-guestalt-gray-light mb-2">
          Vídeo *
        </label>
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200 min-h-[160px] flex flex-col items-center justify-center
            ${
              isDragging
                ? "border-white bg-white/5"
                : "border-guestalt-gray-medium hover:border-guestalt-gray-light"
            }
            ${isUploading ? "pointer-events-none opacity-70" : ""}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            onChange={handleFileInput}
            className="hidden"
            disabled={isUploading}
          />

          {!selectedFile ? (
            <>
              <div className="mb-3 text-guestalt-gray-light">
                <svg
                  className="w-10 h-10 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>

              <p className="text-white font-medium mb-1">
                Arraste o vídeo aqui
              </p>
              <p className="text-guestalt-gray-light text-sm mb-3">ou</p>
              <span className="text-white underline underline-offset-4 text-sm">
                CLIQUE PARA SELECIONAR
              </span>
            </>
          ) : (
            <div className="text-center">
              <p className="text-white font-medium mb-1">{selectedFile.name}</p>
              <p className="text-guestalt-gray-light text-sm">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-4">
          <ProgressBar
            progress={uploadProgress}
            label="Enviando..."
            showPercentage={true}
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Format Info */}
      <div className="text-center space-y-1">
        <p className="text-guestalt-gray-light text-xs">
          Vídeo: <span className="text-white">MP4</span> (recomendado),{" "}
          <span className="text-white">WebM</span> • Máx: <span className="text-white">200MB</span>
        </p>
      </div>
    </div>
  );
}
