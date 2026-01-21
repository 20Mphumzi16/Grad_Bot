-- Add last_viewed timestamps to graduates table for persistent notifications
ALTER TABLE public.graduates
ADD COLUMN IF NOT EXISTS last_viewed_timeline_at TIMESTAMPTZ DEFAULT '2000-01-01 00:00:00+00',
ADD COLUMN IF NOT EXISTS last_viewed_documents_at TIMESTAMPTZ DEFAULT '2000-01-01 00:00:00+00',
ADD COLUMN IF NOT EXISTS last_viewed_resources_at TIMESTAMPTZ DEFAULT '2000-01-01 00:00:00+00';
