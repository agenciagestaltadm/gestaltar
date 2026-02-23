// Type declarations for A-Frame and MindAR
// This file extends JSX.IntrinsicElements to include A-Frame elements

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // A-Frame elements
      "a-scene": {
        embedded?: boolean;
        "vr-mode-ui"?: string;
        "device-orientation-permission-ui"?: string;
        "mindar-image"?: string;
        "color-space"?: string;
        renderer?: string;
        children?: React.ReactNode;
        suppressHydrationWarning?: boolean;
      };
      "a-assets": {
        children?: React.ReactNode;
        suppressHydrationWarning?: boolean;
      };
      "a-camera": {
        position?: string;
        "look-controls"?: string;
        children?: React.ReactNode;
        suppressHydrationWarning?: boolean;
      };
      "a-entity": {
        "mindar-image-target"?: string;
        position?: string;
        rotation?: string;
        children?: React.ReactNode;
        suppressHydrationWarning?: boolean;
      };
      "a-video": {
        src?: string;
        position?: string;
        rotation?: string;
        width?: string;
        height?: string;
        visible?: string;
        suppressHydrationWarning?: boolean;
      };
      "a-image": {
        src?: string;
        position?: string;
        rotation?: string;
        width?: string;
        height?: string;
        visible?: string;
        suppressHydrationWarning?: boolean;
      };
    }
  }
}

export {};
