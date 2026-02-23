export interface Video {
  id: string;
  created_at: string;
  title: string | null;
  storage_path: string;
  mime_type: string;
  size_bytes: number | null;
  status: "uploading" | "ready" | "failed";
  is_demo: boolean;
  target_path: string | null;
  target_image_path: string | null;
}

export interface CreateVideoInput {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  title?: string | null;
  hasTargetImage?: boolean;
}

export interface CreateVideoOutput {
  videoId: string;
  storagePath: string;
  uploadUrl: string;
  targetImagePath?: string;
  targetUploadUrl?: string;
}

export interface SignedUrlOutput {
  signedUrl: string;
  expiresIn: number;
}

export interface ARSession {
  id: string;
  created_at: string;
  video_id: string | null;
  user_agent: string | null;
  device: string | null;
  events: Record<string, unknown>;
}

export interface TargetInfo {
  targetPath: string;
  targetUrl: string;
}
