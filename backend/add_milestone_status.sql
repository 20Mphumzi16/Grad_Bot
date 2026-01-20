-- Add status column to milestones table
-- This column will track whether a milestone is 'active' or 'completed'

ALTER TABLE public.milestones
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Optional: Update existing records to 'active' if they are null (though default handles new ones)
UPDATE public.milestones SET status = 'active' WHERE status IS NULL;
