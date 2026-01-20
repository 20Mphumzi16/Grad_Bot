-- Add graduate_id column to milestones table to support assigning milestones to specific graduates
ALTER TABLE milestones ADD COLUMN IF NOT EXISTS graduate_id UUID REFERENCES "User"(id) ON DELETE CASCADE;
