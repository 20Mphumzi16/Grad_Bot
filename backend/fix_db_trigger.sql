-- FIX FOR: duplicate key value violates unique constraint
-- We add 'ON CONFLICT DO NOTHING' to handle cases where the record might already exist
-- or if there are any duplicate user entries trying to be processed.

CREATE OR REPLACE FUNCTION public.handle_task_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a progress record for every existing graduate (User)
  -- using ON CONFLICT DO NOTHING to safely ignore duplicates
  INSERT INTO public.task_progress (graduate_id, task_id, completed)
  SELECT id, NEW.id, FALSE
  FROM public."User"
  ON CONFLICT (graduate_id, task_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Ensure the trigger is set up correctly
DROP TRIGGER IF EXISTS on_task_created ON public.tasks;

CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_task_creation();
