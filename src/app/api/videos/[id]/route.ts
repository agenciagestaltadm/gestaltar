import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !["uploading", "ready", "failed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { error } = await supabase
      .from("videos")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to update video status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();

    // Get video record
    const { data: video, error: dbError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .single();

    if (dbError || !video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Generate signed URL for video
    const { data: urlData, error: urlError } = await supabase.storage
      .from("videos")
      .createSignedUrl(video.storage_path, 3600); // 1 hour expiry

    if (urlError || !urlData) {
      console.error("Storage error:", urlError);
      return NextResponse.json(
        { error: "Failed to generate video URL" },
        { status: 500 }
      );
    }

    // Generate signed URL for target if exists
    let targetUrl: string | null = null;
    if (video.target_path) {
      const { data: targetData, error: targetError } = await supabase.storage
        .from("targets")
        .createSignedUrl(video.target_path, 3600); // 1 hour expiry

      if (!targetError && targetData) {
        targetUrl = targetData.signedUrl;
      }
    }

    return NextResponse.json({
      video: {
        id: video.id,
        title: video.title,
        status: video.status,
        mimeType: video.mime_type,
        targetPath: video.target_path,
      },
      signedUrl: urlData.signedUrl,
      targetUrl,
      expiresIn: 3600,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
