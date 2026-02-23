-- Migration: 001_initial
-- Description: Create initial tables for GUESTALT AR
-- Date: 2026-02-23

-- ============================================
-- Table: videos
-- ============================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT DEFAULT 'video/mp4',
  size_bytes BIGINT,
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'ready', 'failed')),
  is_demo BOOLEAN DEFAULT FALSE
);

-- Indexes for videos table
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);

-- ============================================
-- Table: ar_sessions (analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS ar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  user_agent TEXT,
  device TEXT,
  events JSONB DEFAULT '{}'::jsonb
);

-- Indexes for ar_sessions table
CREATE INDEX IF NOT EXISTS idx_ar_sessions_video_id ON ar_sessions(video_id);
CREATE INDEX IF NOT EXISTS idx_ar_sessions_created_at ON ar_sessions(created_at DESC);

-- ============================================
-- Storage Bucket
-- ============================================
-- Create the videos bucket (run this in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', FALSE);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for videos table
CREATE POLICY "Anyone can insert videos" ON videos
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can read videos" ON videos
  FOR SELECT USING (TRUE);

CREATE POLICY "Anyone can update videos" ON videos
  FOR UPDATE USING (TRUE);

-- Policies for ar_sessions table
CREATE POLICY "Anyone can insert ar_sessions" ON ar_sessions
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can read ar_sessions" ON ar_sessions
  FOR SELECT USING (TRUE);

-- ============================================
-- Storage Policies (run in Supabase Dashboard)
-- ============================================
-- Policy: Allow anyone to upload videos
-- CREATE POLICY "Anyone can upload videos" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'videos');

-- Policy: No public download (only via signed URLs)
-- CREATE POLICY "No public download" ON storage.objects
--   FOR SELECT USING (FALSE);

-- ============================================
-- Demo Video Record (optional)
-- ============================================
-- Uncomment to create a demo video record
-- INSERT INTO videos (id, title, storage_path, mime_type, status, is_demo)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'Vídeo Demo',
--   'demo/demo-video.mp4',
--   'video/mp4',
--   'ready',
--   TRUE
-- );
