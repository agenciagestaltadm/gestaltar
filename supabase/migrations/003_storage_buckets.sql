-- Migration: 003_storage_buckets
-- Description: Create storage buckets for videos and targets
-- Date: 2026-02-24

-- ============================================
-- Storage Buckets
-- ============================================

-- Create videos bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  false,
  209715200, -- 200MB
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Create targets bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'targets',
  'targets',
  false,
  10485760, -- 10MB
  ARRAY['application/octet-stream', 'image/png', 'image/jpeg', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies
-- ============================================

-- Videos bucket policies

-- Allow anyone to upload videos (via signed URLs from API)
CREATE POLICY "Allow upload videos via signed URL" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'videos');

-- Allow anyone to read videos (via signed URLs from API)
CREATE POLICY "Allow read videos via signed URL" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'videos');

-- Allow anyone to update videos (for status updates)
CREATE POLICY "Allow update videos" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'videos');

-- Targets bucket policies

-- Allow anyone to upload targets (via signed URLs from API)
CREATE POLICY "Allow upload targets via signed URL" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'targets');

-- Allow anyone to read targets (via signed URLs from API)
CREATE POLICY "Allow read targets via signed URL" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'targets');

-- ============================================
-- Update videos table for target_path
-- ============================================

-- Add target_path column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'target_path'
  ) THEN
    ALTER TABLE videos ADD COLUMN target_path TEXT;
  END IF;
END $$;

-- Add target_image_path column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'target_image_path'
  ) THEN
    ALTER TABLE videos ADD COLUMN target_image_path TEXT;
  END IF;
END $$;
