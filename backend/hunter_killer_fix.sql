-- HUNTER KILLER SCRIPT
-- This script searches for ANY trigger in your database that references the non-existent 'progress' table
-- and deletes it.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Loop through all triggers that are attached to functions containing the bad code
    FOR r IN 
        SELECT 
            t.tgname as trigger_name, 
            c.relname as table_name,
            p.proname as function_name
        FROM pg_proc p
        JOIN pg_trigger t ON t.tgfoid = p.oid
        JOIN pg_class c ON c.oid = t.tgrelid
        WHERE 
            -- Look for the specific error cause: usage of "public.progress" or "INSERT INTO progress"
            p.prosrc ILIKE '%public.progress%' 
            OR p.prosrc ILIKE '%INSERT INTO progress%'
            OR p.prosrc ILIKE '%INSERT INTO "progress"%'
    LOOP
        RAISE NOTICE 'DELETING BAD TRIGGER: % on table % (calls function %)', r.trigger_name, r.table_name, r.function_name;
        
        -- Drop the trigger
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.' || quote_ident(r.table_name);
        
        -- Optional: Drop the function too if you want to be clean, but dropping trigger is enough to stop the error.
    END LOOP;
END $$;

-- NOW, let's make sure we have the CORRECT trigger installed.
-- This part is the same as before, ensuring the good logic is present.

CREATE OR REPLACE FUNCTION public.handle_task_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert a progress record for every existing graduate (User)
  -- Uses 'task_progress' (The Correct Table)
  -- Uses ON CONFLICT DO NOTHING to prevent duplicates
  INSERT INTO public.task_progress (graduate_id, task_id, completed)
  SELECT id, NEW.id, FALSE
  FROM public."User"
  ON CONFLICT (graduate_id, task_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create the good trigger on 'tasks'
DROP TRIGGER IF EXISTS on_task_created ON public.tasks;

CREATE TRIGGER on_task_created
AFTER INSERT ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_task_creation();
