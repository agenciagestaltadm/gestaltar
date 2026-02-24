/**
 * Video Compressor using FFmpeg.wasm
 * 
 * Comprime vídeos no browser antes do upload
 * Usa WebAssembly para processamento eficiente
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeMB?: number;
  quality?: "low" | "medium" | "high";
  format?: "mp4" | "webm";
}

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
}

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoaded = false;

/**
 * Inicializa o FFmpeg
 */
async function initFFmpeg(onProgress?: (progress: number) => void): Promise<FFmpeg> {
  if (ffmpegInstance && ffmpegLoaded) {
    return ffmpegInstance;
  }

  ffmpegInstance = new FFmpeg();

  ffmpegInstance.on("progress", ({ progress }) => {
    onProgress?.(Math.round(progress * 100));
  });

  ffmpegInstance.on("log", ({ message }) => {
    console.log("[FFmpeg]", message);
  });

  // Load FFmpeg with correct CORS headers
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegLoaded = true;
  return ffmpegInstance;
}

/**
 * Comprime um vídeo
 */
export async function compressVideo(
  videoFile: File,
  options: CompressionOptions = {},
  onProgress?: (progress: number, stage: string) => void
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maxSizeMB = 50,
    quality = "medium",
    format = "mp4",
  } = options;

  onProgress?.(0, "Inicializando compressor...");

  // Check if compression is needed
  const originalSize = videoFile.size;
  const originalSizeMB = originalSize / (1024 * 1024);

  // If video is already small enough, return as-is
  if (originalSizeMB <= maxSizeMB / 2) {
    onProgress?.(100, "Vídeo já está otimizado!");
    return {
      blob: videoFile,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      format: videoFile.type.split("/")[1] || format,
    };
  }

  try {
    // Initialize FFmpeg
    const ffmpeg = await initFFmpeg((p) => {
      onProgress?.(p * 0.8, "Comprimindo vídeo...");
    });

    onProgress?.(10, "Carregando vídeo...");

    // Write input file
    const inputName = "input" + getExtension(videoFile.name);
    await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

    onProgress?.(20, "Analisando vídeo...");

    // Build FFmpeg command based on quality
    const qualitySettings = getQualitySettings(quality);
    const outputName = `output.${format}`;

    const args = [
      "-i", inputName,
      "-vf", `scale='min(${maxWidth},iw)':'min(${maxHeight},ih)':force_original_aspect_ratio=decrease`,
      "-c:v", "libx264",
      "-preset", qualitySettings.preset,
      "-crf", qualitySettings.crf.toString(),
      "-c:a", "aac",
      "-b:a", qualitySettings.audioBitrate,
      "-movflags", "+faststart",
      "-y",
      outputName,
    ];

    onProgress?.(30, "Comprimindo vídeo...");

    await ffmpeg.exec(args);

    onProgress?.(90, "Finalizando...");

    // Read output file
    const data = await ffmpeg.readFile(outputName);
    // Handle the FileData type from FFmpeg
    let blob: Blob;
    if (typeof data === "string") {
      // If it's a string, convert to blob
      blob = new Blob([data], { type: `video/${format}` });
    } else {
      // If it's Uint8Array, convert to blob
      const buffer = (data as Uint8Array).buffer as ArrayBuffer;
      blob = new Blob([buffer], { type: `video/${format}` });
    }

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    const compressedSize = blob.size;
    const compressionRatio = originalSize / compressedSize;

    onProgress?.(100, "Concluído!");

    return {
      blob,
      originalSize,
      compressedSize,
      compressionRatio,
      format,
    };
  } catch (error) {
    console.error("Video compression error:", error);
    throw new Error("Falha ao comprimir vídeo. O vídeo original será usado.");
  }
}

/**
 * Retorna configurações de qualidade para FFmpeg
 */
function getQualitySettings(quality: "low" | "medium" | "high"): {
  preset: string;
  crf: number;
  audioBitrate: string;
} {
  switch (quality) {
    case "low":
      return { preset: "faster", crf: 28, audioBitrate: "96k" };
    case "high":
      return { preset: "slow", crf: 18, audioBitrate: "192k" };
    case "medium":
    default:
      return { preset: "medium", crf: 23, audioBitrate: "128k" };
  }
}

/**
 * Retorna extensão do arquivo
 */
function getExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext && ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
    return `.${ext}`;
  }
  return ".mp4";
}

/**
 * Obtém informações do vídeo
 */
export async function getVideoInfo(videoFile: File): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
  type: string;
}> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        size: videoFile.size,
        type: videoFile.type,
      });
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Falha ao carregar vídeo"));
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Gera thumbnail do vídeo
 */
export async function generateThumbnail(
  videoFile: File,
  timeSeconds: number = 0
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;

    video.onloadeddata = () => {
      video.currentTime = timeSeconds;
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Falha ao criar canvas"));
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Falha ao gerar thumbnail"));
        }
      }, "image/jpeg", 0.8);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Falha ao carregar vídeo"));
    };

    video.src = URL.createObjectURL(videoFile);
  });
}

/**
 * Verifica se o navegador suporta compressão
 */
export function isCompressionSupported(): boolean {
  return typeof WebAssembly !== "undefined" && typeof SharedArrayBuffer !== "undefined";
}

export default {
  compressVideo,
  getVideoInfo,
  generateThumbnail,
  isCompressionSupported,
};
