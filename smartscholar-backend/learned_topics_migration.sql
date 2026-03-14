-- ============================================================
-- SmartScholar AI — Learned Topics Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create the learned_topics table
CREATE TABLE IF NOT EXISTS learned_topics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  topic_label text NOT NULL,
  material_id uuid REFERENCES study_materials(id) ON DELETE SET NULL,
  learned_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, topic_label)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_learned_topics_user_id ON learned_topics(user_id);

-- Enable Row Level Security (optional but recommended)
ALTER TABLE learned_topics ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only see/modify their own rows
CREATE POLICY "Users can manage their own learned topics"
  ON learned_topics
  FOR ALL
  USING (true)       -- permissive for hackathon; tighten with auth.uid() = user_id in production
  WITH CHECK (true);
