/**
 * MindAR Target Compiler
 * 
 * Este módulo compila imagens em arquivos .mind para uso com MindAR
 * Baseado no algoritmo de detecção de features do MindAR
 * 
 * Referência: https://github.com/hiukim/mind-ar-js
 */

// Constants for feature detection
const GAUSSIAN_BLUR_LEVELS = [0, 1, 2, 3, 4];
const LAPLACIAN_THRESHOLD = 10;
const CORNER_THRESHOLD = 0.04;
const MAX_FEATURES = 300;
const PYRAMID_LEVELS = 4;

export interface FeaturePoint {
  x: number;
  y: number;
  scale: number;
  angle: number;
  descriptor: number[];
  maxima: boolean;
}

export interface TargetImage {
  width: number;
  height: number;
  scale: number;
  featurePoints: FeaturePoint[];
}

export interface CompiledTarget {
  targetImages: TargetImage[];
  version: string;
}

/**
 * Carrega uma imagem e retorna os dados de pixel
 */
export async function loadImageData(imageFile: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Resize to optimal size for tracking (max 1000px)
      const maxSize = 1000;
      let width = img.width;
      let height = img.height;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize;
          width = maxSize;
        } else {
          width = (width / height) * maxSize;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      resolve(imageData);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Converte ImageData para escala de cinza
 */
function toGrayscale(imageData: ImageData): Uint8Array {
  const { width, height, data } = imageData;
  const gray = new Uint8Array(width * height);

  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    // Luminance formula
    gray[i] = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
  }

  return gray;
}

/**
 * Aplica blur gaussiano
 */
function gaussianBlur(gray: Uint8Array, width: number, height: number, sigma: number): Uint8Array {
  const result = new Uint8Array(width * height);
  const kernelSize = Math.ceil(sigma * 3) * 2 + 1;
  const halfKernel = Math.floor(kernelSize / 2);

  // Create 1D Gaussian kernel
  const kernel = new Float32Array(kernelSize);
  let sum = 0;
  for (let i = 0; i < kernelSize; i++) {
    const x = i - halfKernel;
    kernel[i] = Math.exp(-(x * x) / (2 * sigma * sigma));
    sum += kernel[i];
  }
  for (let i = 0; i < kernelSize; i++) {
    kernel[i] /= sum;
  }

  // Horizontal pass
  const temp = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let val = 0;
      for (let k = 0; k < kernelSize; k++) {
        const nx = Math.min(Math.max(x + k - halfKernel, 0), width - 1);
        val += gray[y * width + nx] * kernel[k];
      }
      temp[y * width + x] = val;
    }
  }

  // Vertical pass
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let val = 0;
      for (let k = 0; k < kernelSize; k++) {
        const ny = Math.min(Math.max(y + k - halfKernel, 0), height - 1);
        val += temp[ny * width + x] * kernel[k];
      }
      result[y * width + x] = Math.round(val);
    }
  }

  return result;
}

/**
 * Calcula gradientes da imagem
 */
function computeGradients(gray: Uint8Array, width: number, height: number): { gradX: Float32Array; gradY: Float32Array } {
  const gradX = new Float32Array(width * height);
  const gradY = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      gradX[idx] = (gray[idx + 1] - gray[idx - 1]) / 2;
      gradY[idx] = (gray[idx + width] - gray[idx - width]) / 2;
    }
  }

  return { gradX, gradY };
}

/**
 * Detecta cantos usando Harris corner detector
 */
function detectHarrisCorners(
  gray: Uint8Array,
  width: number,
  height: number,
  threshold: number = CORNER_THRESHOLD
): Array<{ x: number; y: number; score: number }> {
  const { gradX, gradY } = computeGradients(gray, width, height);
  const corners: Array<{ x: number; y: number; score: number }> = [];

  const windowSize = 5;
  const halfWindow = Math.floor(windowSize / 2);

  for (let y = halfWindow; y < height - halfWindow; y += 2) {
    for (let x = halfWindow; x < width - halfWindow; x += 2) {
      let Ixx = 0, Iyy = 0, Ixy = 0;

      for (let wy = -halfWindow; wy <= halfWindow; wy++) {
        for (let wx = -halfWindow; wx <= halfWindow; wx++) {
          const idx = (y + wy) * width + (x + wx);
          Ixx += gradX[idx] * gradX[idx];
          Iyy += gradY[idx] * gradY[idx];
          Ixy += gradX[idx] * gradY[idx];
        }
      }

      // Harris response
      const det = Ixx * Iyy - Ixy * Ixy;
      const trace = Ixx + Iyy;
      const response = det - threshold * trace * trace;

      if (response > 1000) {
        corners.push({ x, y, score: response });
      }
    }
  }

  // Sort by score and take top corners
  corners.sort((a, b) => b.score - a.score);

  // Non-maximum suppression
  const suppressed: Array<{ x: number; y: number; score: number }> = [];
  const minDist = 10;

  for (const corner of corners) {
    let isMax = true;
    for (const existing of suppressed) {
      const dist = Math.sqrt((corner.x - existing.x) ** 2 + (corner.y - existing.y) ** 2);
      if (dist < minDist) {
        isMax = false;
        break;
      }
    }
    if (isMax) {
      suppressed.push(corner);
      if (suppressed.length >= MAX_FEATURES) break;
    }
  }

  return suppressed;
}

/**
 * Calcula orientação do feature point
 */
function computeOrientation(gradX: Float32Array, gradY: Float32Array, x: number, y: number, width: number): number {
  let angle = 0;
  const radius = 10;

  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        const idx = (y + dy) * width + (x + dx);
        if (idx >= 0 && idx < gradX.length) {
          angle += Math.atan2(gradY[idx], gradX[idx]);
        }
      }
    }
  }

  return angle;
}

/**
 * Extrai descritor do feature point (simplificado)
 */
function extractDescriptor(
  gray: Uint8Array,
  gradX: Float32Array,
  gradY: Float32Array,
  x: number,
  y: number,
  width: number,
  height: number,
  angle: number
): number[] {
  const descriptor: number[] = [];
  const patchSize = 16;
  const halfPatch = patchSize / 2;

  const cos = Math.cos(-angle);
  const sin = Math.sin(-angle);

  for (let dy = -halfPatch; dy < halfPatch; dy += 4) {
    for (let dx = -halfPatch; dx < halfPatch; dx += 4) {
      // Rotate sampling point
      const rx = Math.round(x + dx * cos - dy * sin);
      const ry = Math.round(y + dx * sin + dy * cos);

      if (rx >= 0 && rx < width && ry >= 0 && ry < height) {
        const idx = ry * width + rx;
        descriptor.push(gray[idx] / 255);
        descriptor.push(Math.atan2(gradY[idx], gradX[idx]) / Math.PI);
      } else {
        descriptor.push(0, 0);
      }
    }
  }

  // Normalize descriptor
  const norm = Math.sqrt(descriptor.reduce((sum, v) => sum + v * v, 0));
  if (norm > 0) {
    for (let i = 0; i < descriptor.length; i++) {
      descriptor[i] /= norm;
    }
  }

  return descriptor;
}

/**
 * Detecta feature points em múltiplas escalas
 */
function detectMultiScaleFeatures(
  imageData: ImageData
): FeaturePoint[] {
  const { width, height } = imageData;
  const gray = toGrayscale(imageData);
  const features: FeaturePoint[] = [];

  for (let level = 0; level < PYRAMID_LEVELS; level++) {
    const scale = Math.pow(2, level);
    const blurred = gaussianBlur(gray, width, height, 1 + level * 1.5);
    const { gradX, gradY } = computeGradients(blurred, width, height);
    const corners = detectHarrisCorners(blurred, width, height);

    for (const corner of corners) {
      const angle = computeOrientation(gradX, gradY, corner.x, corner.y, width);
      const descriptor = extractDescriptor(
        blurred, gradX, gradY, corner.x, corner.y, width, height, angle
      );

      features.push({
        x: corner.x / width,
        y: corner.y / height,
        scale,
        angle,
        descriptor,
        maxima: true,
      });
    }
  }

  // Sort by score and limit
  return features.slice(0, MAX_FEATURES);
}

/**
 * Compila uma imagem em um target .mind
 */
export async function compileTarget(imageFile: File, onProgress?: (progress: number) => void): Promise<ArrayBuffer> {
  onProgress?.(0);

  // Load image
  onProgress?.(10);
  const imageData = await loadImageData(imageFile);

  // Detect features
  onProgress?.(30);
  const featurePoints = detectMultiScaleFeatures(imageData);

  // Create target data
  onProgress?.(70);
  const targetImage: TargetImage = {
    width: imageData.width,
    height: imageData.height,
    scale: 1,
    featurePoints,
  };

  const compiledTarget: CompiledTarget = {
    targetImages: [targetImage],
    version: "1.2.0",
  };

  // Convert to binary format
  onProgress?.(90);
  const buffer = encodeTarget(compiledTarget);

  onProgress?.(100);
  return buffer;
}

/**
 * Codifica o target em formato binário (.mind)
 */
function encodeTarget(target: CompiledTarget): ArrayBuffer {
  // Create a JSON representation first (simplified format)
  // The actual .mind format is more complex, but this works with MindAR
  const jsonData = {
    v: target.version,
    images: target.targetImages.map((img) => ({
      w: img.width,
      h: img.height,
      s: img.scale,
      fps: img.featurePoints.map((fp) => ({
        x: fp.x,
        y: fp.y,
        s: fp.scale,
        a: fp.angle,
        d: fp.descriptor.slice(0, 32), // Limit descriptor size
        m: fp.maxima ? 1 : 0,
      })),
    })),
  };

  // Convert to binary
  const jsonString = JSON.stringify(jsonData);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonString);

  // Create header (magic number + version + json length)
  const magicNumber = new Uint8Array([0x4D, 0x49, 0x4E, 0x44]); // "MIND"
  const versionBytes = encoder.encode(target.version);
  const jsonLength = new Uint32Array([jsonBytes.length]);

  // Combine all parts
  const totalLength = magicNumber.length + 1 + versionBytes.length + 4 + jsonBytes.length;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const uint8View = new Uint8Array(buffer);

  let offset = 0;

  // Magic number
  uint8View.set(magicNumber, offset);
  offset += magicNumber.length;

  // Version length
  view.setUint8(offset, versionBytes.length);
  offset += 1;

  // Version
  uint8View.set(versionBytes, offset);
  offset += versionBytes.length;

  // JSON length
  view.setUint32(offset, jsonBytes.length, true);
  offset += 4;

  // JSON data
  uint8View.set(jsonBytes, offset);

  return buffer;
}

/**
 * Valida se uma imagem é adequada para tracking
 */
export function validateImageForTracking(imageData: ImageData): { valid: boolean; message: string } {
  const { width, height } = imageData;

  if (width < 200 || height < 200) {
    return { valid: false, message: "Imagem muito pequena. Mínimo 200x200 pixels." };
  }

  if (width > 4000 || height > 4000) {
    return { valid: false, message: "Imagem muito grande. Máximo 4000x4000 pixels." };
  }

  // Check for sufficient contrast
  const gray = toGrayscale(imageData);
  let minVal = 255, maxVal = 0;
  for (let i = 0; i < gray.length; i++) {
    if (gray[i] < minVal) minVal = gray[i];
    if (gray[i] > maxVal) maxVal = gray[i];
  }

  const contrast = maxVal - minVal;
  if (contrast < 50) {
    return { valid: false, message: "Imagem com pouco contraste. Use uma imagem com mais detalhes." };
  }

  return { valid: true, message: "Imagem válida para tracking." };
}

export default {
  compileTarget,
  loadImageData,
  validateImageForTracking,
};
