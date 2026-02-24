// MindAR Demo Targets
// These are pre-compiled targets from MindAR examples

/**
 * Demo target URL - Card example from MindAR
 * This is a pre-compiled .mind file that works with the demo image
 */
export const DEMO_TARGET_URL = "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/examples/image-tracking/assets/card-example/card.mind";

/**
 * Demo target image URL - The image to print/scan for AR
 * Users need to point their camera at this image for AR to work
 */
export const DEMO_TARGET_IMAGE_URL = "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/examples/image-tracking/assets/card-example/card.png";

/**
 * Demo video URL - Sample video from MindAR examples
 */
export const DEMO_VIDEO_URL = "https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.0/examples/image-tracking/assets/card-example/kanji.mp4";

/**
 * Local target file path (if using local targets.mind)
 */
export const LOCAL_TARGET_PATH = "/targets.mind";

/**
 * Get the appropriate target URL
 * Priority: custom target > local target > demo target
 */
export function getTargetUrl(customTargetUrl?: string | null): string {
  if (customTargetUrl) {
    return customTargetUrl;
  }
  
  // Try local target first, fallback to demo
  return DEMO_TARGET_URL;
}

/**
 * Check if a target URL is valid and accessible
 */
export async function checkTargetExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * AR Scene configuration
 */
export const AR_CONFIG = {
  // MindAR settings
  mindar: {
    autoStart: true,
    uiLoading: "no",
    uiError: "no",
    uiScanning: "yes",
    filterMinCF: 0.0001,
    filterBeta: 0.001,
    missTolerance: 5,
    warmupTolerance: 5,
  },
  // Video settings
  video: {
    width: 1,
    height: 0.5625, // 16:9 aspect ratio
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
  },
  // Camera settings
  camera: {
    position: { x: 0, y: 0, z: 0 },
  },
} as const;
