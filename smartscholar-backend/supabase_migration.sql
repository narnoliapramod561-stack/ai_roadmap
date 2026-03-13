-- ============================================================
-- SmartScholar AI — SAFE Idempotent Migration  (CODE-A-HAUNT 3.0)
-- Run in Supabase SQL Editor → Primary Database → postgres role
-- This script is 100% safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT UNIQUE NOT NULL,
  full_name  TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- 2. study_materials — patch missing columns first, then index
-- ============================================================
CREATE TABLE IF NOT EXISTS study_materials (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Safely add every column that might be missing
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS user_id         UUID;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS file_name       TEXT;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS subject         TEXT;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS file_url        TEXT;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS raw_text        TEXT;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS ai_roadmap      JSONB;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS knowledge_graph JSONB;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS exam_date       DATE;
ALTER TABLE study_materials ADD COLUMN IF NOT EXISTS uploaded_at     TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_materials_user ON study_materials(user_id);

-- ============================================================
-- 3. quizzes
-- ============================================================
CREATE TABLE IF NOT EXISTS quizzes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS user_id        UUID;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS material_id    UUID;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS topic_name     TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS difficulty     TEXT;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS questions      JSONB DEFAULT '[]';
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attempt_result JSONB;
ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS attempted_at   TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_quizzes_user  ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_topic ON quizzes(topic_name);

-- ============================================================
-- 4. study_schedules
-- ============================================================
CREATE TABLE IF NOT EXISTS study_schedules (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE study_schedules ADD COLUMN IF NOT EXISTS user_id      UUID;
ALTER TABLE study_schedules ADD COLUMN IF NOT EXISTS material_id  UUID;
ALTER TABLE study_schedules ADD COLUMN IF NOT EXISTS exam_date    DATE;
ALTER TABLE study_schedules ADD COLUMN IF NOT EXISTS daily_hours  SMALLINT DEFAULT 2;
ALTER TABLE study_schedules ADD COLUMN IF NOT EXISTS schedule     JSONB DEFAULT '{}';
ALTER TABLE study_schedules ADD COLUMN IF NOT EXISTS timetable    JSONB;
ALTER TABLE study_schedules ADD COLUMN IF NOT EXISTS active       BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_schedules_user      ON study_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_schedules_exam_date ON study_schedules(exam_date);

-- ============================================================
-- 5. spaced_repetition_queue  (SM-2 algorithm state)
-- ============================================================
CREATE TABLE IF NOT EXISTS spaced_repetition_queue (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE spaced_repetition_queue ADD COLUMN IF NOT EXISTS user_id       UUID;
ALTER TABLE spaced_repetition_queue ADD COLUMN IF NOT EXISTS topic_name    TEXT;
ALTER TABLE spaced_repetition_queue ADD COLUMN IF NOT EXISTS easiness      FLOAT   DEFAULT 2.5;
ALTER TABLE spaced_repetition_queue ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 1;
ALTER TABLE spaced_repetition_queue ADD COLUMN IF NOT EXISTS repetitions   INTEGER DEFAULT 0;
ALTER TABLE spaced_repetition_queue ADD COLUMN IF NOT EXISTS next_review   DATE    DEFAULT CURRENT_DATE;
ALTER TABLE spaced_repetition_queue ADD COLUMN IF NOT EXISTS last_score    FLOAT;

-- Unique constraint: one row per user+topic
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idx_sr_user_topic'
  ) THEN
    ALTER TABLE spaced_repetition_queue
      ADD CONSTRAINT idx_sr_user_topic UNIQUE (user_id, topic_name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sr_next_review ON spaced_repetition_queue(next_review);

-- ============================================================
-- 6. topics  (extracted from study_materials)
-- ============================================================
CREATE TABLE IF NOT EXISTS topics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE topics ADD COLUMN IF NOT EXISTS material_id UUID;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS label       TEXT;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS difficulty  TEXT DEFAULT 'medium';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS mastery     FLOAT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_topics_material ON topics(material_id);

-- ============================================================
-- 7. topic_progress  (per-user mastery tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS topic_progress (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE topic_progress ADD COLUMN IF NOT EXISTS user_id          UUID;
ALTER TABLE topic_progress ADD COLUMN IF NOT EXISTS topic_id         UUID;
ALTER TABLE topic_progress ADD COLUMN IF NOT EXISTS mastery_level    FLOAT   DEFAULT 0;
ALTER TABLE topic_progress ADD COLUMN IF NOT EXISTS interval         INTEGER DEFAULT 1;
ALTER TABLE topic_progress ADD COLUMN IF NOT EXISTS repetitions      INTEGER DEFAULT 0;
ALTER TABLE topic_progress ADD COLUMN IF NOT EXISTS easiness_factor  FLOAT   DEFAULT 2.5;
ALTER TABLE topic_progress ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idx_progress_user_topic'
  ) THEN
    ALTER TABLE topic_progress
      ADD CONSTRAINT idx_progress_user_topic UNIQUE (user_id, topic_id);
  END IF;
END $$;

-- ============================================================
-- 8. Enable Row Level Security
-- ============================================================
ALTER TABLE users                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_schedules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaced_repetition_queue  ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_progress           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. Policies  (DROP first — IF NOT EXISTS not supported)
-- ============================================================
DROP POLICY IF EXISTS "Open access users"       ON users;
DROP POLICY IF EXISTS "Open access materials"   ON study_materials;
DROP POLICY IF EXISTS "Open access quizzes"     ON quizzes;
DROP POLICY IF EXISTS "Open access schedules"   ON study_schedules;
DROP POLICY IF EXISTS "Open access sr_queue"    ON spaced_repetition_queue;
DROP POLICY IF EXISTS "Open access topics"      ON topics;
DROP POLICY IF EXISTS "Open access progress"    ON topic_progress;

CREATE POLICY "Open access users"       ON users                   USING (true) WITH CHECK (true);
CREATE POLICY "Open access materials"   ON study_materials         USING (true) WITH CHECK (true);
CREATE POLICY "Open access quizzes"     ON quizzes                 USING (true) WITH CHECK (true);
CREATE POLICY "Open access schedules"   ON study_schedules         USING (true) WITH CHECK (true);
CREATE POLICY "Open access sr_queue"    ON spaced_repetition_queue USING (true) WITH CHECK (true);
CREATE POLICY "Open access topics"      ON topics                  USING (true) WITH CHECK (true);
CREATE POLICY "Open access progress"    ON topic_progress          USING (true) WITH CHECK (true);

-- ============================================================
-- Done!
-- ============================================================
SELECT 'SmartScholar AI migration complete ✅' AS status;
