-- NUKE OPTION: Remove ALL triggers from the 'tasks' table
-- This ensures that ANY bad trigger (regardless of its name or content) is removed.

DO $$ 
DECLARE 
    _trigger_name text;
BEGIN 
    FOR _trigger_name IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'tasks'
        AND trigger_schema = 'public'
    LOOP 
        RAISE NOTICE 'Dropping trigger: %', _trigger_name;
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(_trigger_name) || ' ON public.tasks CASCADE'; 
    END LOOP; 
END $$;

-- NOW RE-ADD THE CORRECT TRIGGER
-- We redefine the function to be absolutely sure it points to 'task_progress'
CREATE OR REPLACE FUNCTION public.handle_task_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a progress record for every existing graduate (User)
  -- pointing to the correct 'task_progress' table
  INSERT INTO public.task_progress (graduate_id, task_id, completed)
  SELECT id, NEW.id, FALSE
  FROM public."User"
  ON CONFLICT (graduate_id, task_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create the single correct trigger
CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_task_creation();
