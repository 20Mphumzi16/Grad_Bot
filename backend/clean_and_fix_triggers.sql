-- NUCLEAR FIX: Remove ALL triggers on 'tasks' and recreate the correct one.

-- 1. Dynamic block to DROP ALL triggers on the 'tasks' table
DO $$ 
DECLARE 
    r RECORD;
BEGIN 
    FOR r IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'tasks'
    LOOP 
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.tasks'; 
    END LOOP; 
END $$;

-- 2. Define the CORRECT function (using task_progress)
CREATE OR REPLACE FUNCTION public.handle_task_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a progress record for every existing graduate (User)
  -- Uses 'task_progress' (Correct Table)
  -- Uses ON CONFLICT DO NOTHING to prevent duplicates
  INSERT INTO public.task_progress (graduate_id, task_id, completed)
  SELECT id, NEW.id, FALSE
  FROM public."User"
  ON CONFLICT (graduate_id, task_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Create the SINGLE correct trigger
CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_task_creation();
