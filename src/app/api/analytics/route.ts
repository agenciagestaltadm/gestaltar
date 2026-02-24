import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

interface AnalyticsEvent {
  type: string;
  timestamp: number;
  videoId?: string;
  metadata?: Record<string, unknown>;
}

interface AnalyticsPayload {
  sessionId: string;
  events: AnalyticsEvent[];
  deviceInfo?: {
    isMobile: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    browser: string;
    os: string;
    screenWidth: number;
    screenHeight: number;
    pixelRatio: number;
  };
  userAgent?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload: AnalyticsPayload = await request.json();
    const { sessionId, events, deviceInfo, userAgent } = payload;

    if (!sessionId || !events || events.length === 0) {
      return NextResponse.json({ success: true, message: "No events to process" });
    }

    const supabase = createServerClient();

    // Process each event
    for (const event of events) {
      // Insert into ar_sessions table
      const { error } = await supabase.from("ar_sessions").insert({
        id: `${sessionId}-${event.timestamp}`,
        video_id: event.videoId || null,
        user_agent: userAgent || null,
        device: deviceInfo ? JSON.stringify(deviceInfo) : null,
        events: {
          type: event.type,
          timestamp: event.timestamp,
          metadata: event.metadata || {},
        },
      });

      if (error) {
        console.error("Analytics insert error:", error);
      }
    }

    return NextResponse.json({ success: true, eventsProcessed: events.length });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");
    const period = searchParams.get("period") || "7d"; // 7d, 30d, all

    const supabase = createServerClient();

    // Calculate date range
    let startDate: Date;
    switch (period) {
      case "30d":
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "all":
        startDate = new Date(0);
        break;
      case "7d":
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build query
    let query = supabase
      .from("ar_sessions")
      .select("*")
      .gte("created_at", startDate.toISOString());

    if (videoId) {
      query = query.eq("video_id", videoId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Aggregate statistics
    const stats = {
      totalSessions: new Set(data?.map((d) => d.id.split("-").slice(0, 2).join("-"))).size || 0,
      totalEvents: data?.length || 0,
      eventsByType: {} as Record<string, number>,
      deviceBreakdown: {
        mobile: 0,
        desktop: 0,
        ios: 0,
        android: 0,
      },
      browserBreakdown: {} as Record<string, number>,
    };

    for (const row of data || []) {
      // Count events by type
      const eventType = row.events?.type;
      if (eventType) {
        stats.eventsByType[eventType] = (stats.eventsByType[eventType] || 0) + 1;
      }

      // Device breakdown
      if (row.device) {
        try {
          const device = JSON.parse(row.device);
          if (device.isMobile) stats.deviceBreakdown.mobile++;
          else stats.deviceBreakdown.desktop++;
          if (device.isIOS) stats.deviceBreakdown.ios++;
          if (device.isAndroid) stats.deviceBreakdown.android++;

          // Browser breakdown
          const browser = device.browser || "unknown";
          stats.browserBreakdown[browser] = (stats.browserBreakdown[browser] || 0) + 1;
        } catch {
          // Ignore parse errors
        }
      }
    }

    return NextResponse.json({ stats, data });
  } catch (error) {
    console.error("Analytics GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
