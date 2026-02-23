-- Migration: 002_add_target
-- Description: Add target image support for automatic targets.mind generation
-- Date: 2026-02-23

-- Add target_path column to videos table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS target_path TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS target_image_path TEXT;

-- Create targets storage bucket (run in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('targets', 'targets', FALSE);

-- Storage policies for targets bucket (run in Supabase Dashboard)
-- CREATE POLICY "Anyone can upload targets" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'targets');

-- CREATE POLICY "Anyone can read targets" ON storage.objects
--   FOR SELECT USING (bucket_id = 'targets');
