-- FIX FOREIGN KEY CONSTRAINTS TO ENABLE CASCADE DELETE

-- 1. Fix task_progress -> tasks
-- If a task is deleted, its progress records should be deleted automatically.
ALTER TABLE public.task_progress
DROP CONSTRAINT IF EXISTS task_progress_task_id_fkey;

ALTER TABLE public.task_progress
ADD CONSTRAINT task_progress_task_id_fkey
FOREIGN KEY (task_id)
REFERENCES public.tasks (id)
ON DELETE CASCADE;


-- 2. Fix tasks -> milestones
-- If a milestone is deleted, its tasks should be deleted automatically.
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_milestone_id_fkey;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_milestone_id_fkey
FOREIGN KEY (milestone_id)
REFERENCES public.milestones (id)
ON DELETE CASCADE;
