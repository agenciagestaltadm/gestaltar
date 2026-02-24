"use client";

import { useCallback, useState, useRef } from "react";
import { ProgressBar } from "@/components/ui";

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
}

export default function VideoUploader({
  onFileSelect,
  isUploading,
  uploadProgress,
  error,
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
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
            accept="video/mp4,video/webm,video/quicktime"
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
          <span className="text-white">WebM</span>, <span className="text-white">MOV</span> • Máx: <span className="text-white">200MB</span>
        </p>
      </div>
    </div>
  );
}
