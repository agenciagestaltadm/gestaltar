/**
 * AR Analytics System
 * 
 * Rastreia eventos de uso do AR para análise
 */

// Event types
export type AREventType =
  | "session_start"
  | "session_end"
  | "target_found"
  | "target_lost"
  | "video_play"
  | "video_pause"
  | "video_end"
  | "camera_permission_granted"
  | "camera_permission_denied"
  | "error"
  | "upload_start"
  | "upload_complete"
  | "upload_error"
  | "target_generated"
  | "video_compressed";

export interface AREvent {
  type: AREventType;
  videoId?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ARSession {
  id: string;
  videoId?: string;
  startTime: number;
  endTime?: number;
  events: AREvent[];
  deviceInfo: DeviceInfo;
  userAgent: string;
}

export interface DeviceInfo {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
}

// Generate unique session ID
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Detect device info
function detectDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid;

  let browser = "unknown";
  if (/CriOS/.test(ua)) browser = "chrome-ios";
  else if (/FxiOS/.test(ua)) browser = "firefox-ios";
  else if (/EdgiOS/.test(ua)) browser = "edge-ios";
  else if (/Safari/.test(ua) && /AppleWebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)) browser = "safari";
  else if (/Chrome/.test(ua) && !/Edg/.test(ua)) browser = "chrome";
  else if (/Firefox/.test(ua)) browser = "firefox";
  else if (/Edg/.test(ua)) browser = "edge";

  let os = "unknown";
  if (isIOS) os = "ios";
  else if (isAndroid) os = "android";
  else if (/Windows/.test(ua)) os = "windows";
  else if (/Mac/.test(ua)) os = "macos";
  else if (/Linux/.test(ua)) os = "linux";

  return {
    isMobile,
    isIOS,
    isAndroid,
    browser,
    os,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    pixelRatio: window.devicePixelRatio,
  };
}

// Analytics class
class ARAnalytics {
  private session: ARSession | null = null;
  private events: AREvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private readonly MAX_EVENTS = 100;

  constructor() {
    if (typeof window !== "undefined") {
      this.initSession();
      this.setupFlushInterval();
      this.setupUnloadHandler();
    }
  }

  private initSession(): void {
    this.session = {
      id: generateSessionId(),
      startTime: Date.now(),
      events: [],
      deviceInfo: detectDeviceInfo(),
      userAgent: navigator.userAgent,
    };
  }

  private setupFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.FLUSH_INTERVAL);
  }

  private setupUnloadHandler(): void {
    window.addEventListener("beforeunload", () => {
      this.trackEvent("session_end");
      this.flush();
    });
  }

  /**
   * Track an AR event
   */
  trackEvent(type: AREventType, metadata?: Record<string, unknown>): void {
    const event: AREvent = {
      type,
      timestamp: Date.now(),
      videoId: this.session?.videoId,
      metadata,
    };

    this.events.push(event);
    if (this.session) {
      this.session.events.push(event);
    }

    // Flush if we have too many events
    if (this.events.length >= this.MAX_EVENTS) {
      this.flush();
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[AR Analytics]", type, metadata || "");
    }
  }

  /**
   * Set the video ID for the current session
   */
  setVideoId(videoId: string): void {
    if (this.session) {
      this.session.videoId = videoId;
    }
  }

  /**
   * Start a new AR session
   */
  startSession(videoId?: string): void {
    this.initSession();
    if (videoId) {
      this.setVideoId(videoId);
    }
    this.trackEvent("session_start");
  }

  /**
   * End the current session
   */
  endSession(): void {
    if (this.session) {
      this.session.endTime = Date.now();
    }
    this.trackEvent("session_end");
    this.flush();
  }

  /**
   * Get session duration in seconds
   */
  getSessionDuration(): number {
    if (!this.session) return 0;
    const endTime = this.session.endTime || Date.now();
    return Math.round((endTime - this.session.startTime) / 1000);
  }

  /**
   * Get session statistics
   */
  getSessionStats(): {
    duration: number;
    targetFoundCount: number;
    videoPlayCount: number;
    errorCount: number;
  } {
    if (!this.session) {
      return { duration: 0, targetFoundCount: 0, videoPlayCount: 0, errorCount: 0 };
    }

    const events = this.session.events;
    return {
      duration: this.getSessionDuration(),
      targetFoundCount: events.filter(e => e.type === "target_found").length,
      videoPlayCount: events.filter(e => e.type === "video_play").length,
      errorCount: events.filter(e => e.type === "error").length,
    };
  }

  /**
   * Flush events to server
   */
  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      // Send to API endpoint
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: this.session?.id,
          events: eventsToSend,
          deviceInfo: this.session?.deviceInfo,
          userAgent: this.session?.userAgent,
        }),
      });
    } catch (error) {
      // Store events locally if send fails
      console.error("[AR Analytics] Failed to flush events:", error);
      this.storeLocally(eventsToSend);
    }
  }

  /**
   * Store events locally as fallback
   */
  private storeLocally(events: AREvent[]): void {
    try {
      const stored = JSON.parse(localStorage.getItem("ar_analytics_pending") || "[]");
      stored.push(...events);
      // Keep only last 1000 events
      if (stored.length > 1000) {
        stored.splice(0, stored.length - 1000);
      }
      localStorage.setItem("ar_analytics_pending", JSON.stringify(stored));
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Get pending events from local storage
   */
  getPendingEvents(): AREvent[] {
    try {
      return JSON.parse(localStorage.getItem("ar_analytics_pending") || "[]");
    } catch {
      return [];
    }
  }

  /**
   * Clear pending events
   */
  clearPendingEvents(): void {
    try {
      localStorage.removeItem("ar_analytics_pending");
    } catch {
      // Ignore
    }
  }
}

// Singleton instance
let analyticsInstance: ARAnalytics | null = null;

/**
 * Get the analytics instance
 */
export function getAnalytics(): ARAnalytics {
  if (!analyticsInstance) {
    analyticsInstance = new ARAnalytics();
  }
  return analyticsInstance;
}

/**
 * Track an AR event (convenience function)
 */
export function trackEvent(type: AREventType, metadata?: Record<string, unknown>): void {
  getAnalytics().trackEvent(type, metadata);
}

export default {
  getAnalytics,
  trackEvent,
};
