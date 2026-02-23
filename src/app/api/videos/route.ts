import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { CreateVideoInput, CreateVideoOutput } from "@/lib/supabase/types";

export async function POST(request: NextRequest) {
  try {
    const body: CreateVideoInput = await request.json();
    const { filename, mimeType, sizeBytes, title, hasTargetImage } = body;

    // Validate input
    if (!filename || !mimeType || !sizeBytes) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!mimeType.startsWith("video/")) {
      return NextResponse.json(
        { error: "Invalid file type. Only video files are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (200MB max)
    const maxSize = 200 * 1024 * 1024;
    if (sizeBytes > maxSize) {
      return NextResponse.json(
        { error: "File size exceeds 200MB limit." },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Generate video ID and storage paths
    const videoId = crypto.randomUUID();
    const extension = filename.split(".").pop() || "mp4";
    const storagePath = `videos/${videoId}.${extension}`;
    const targetPath = hasTargetImage ? `targets/${videoId}.mind` : null;
    const targetImagePath = hasTargetImage ? `targets/${videoId}_image.jpg` : null;

    // Create video record
    const { error: dbError } = await supabase.from("videos").insert({
      id: videoId,
      title: title || null,
      storage_path: storagePath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
      status: "uploading",
      is_demo: false,
      target_path: targetPath,
      target_image_path: targetImagePath,
    });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to create video record" },
        { status: 500 }
      );
    }

    // Generate signed upload URL for video
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("videos")
      .createSignedUploadUrl(storagePath);

    if (uploadError || !uploadData) {
      console.error("Storage error:", uploadError);
      return NextResponse.json(
        { error: "Failed to generate upload URL" },
        { status: 500 }
      );
    }

    // Generate signed upload URL for target if needed
    let targetUploadUrl: string | undefined;
    if (hasTargetImage && targetPath) {
      const { data: targetData, error: targetError } = await supabase.storage
        .from("targets")
        .createSignedUploadUrl(targetPath);

      if (targetError || !targetData) {
        console.error("Target storage error:", targetError);
        // Continue without target - it's optional
      } else {
        targetUploadUrl = targetData.signedUrl;
      }
    }

    const response: CreateVideoOutput = {
      videoId,
      storagePath,
      uploadUrl: uploadData.signedUrl,
      targetImagePath: targetImagePath || undefined,
      targetUploadUrl,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
