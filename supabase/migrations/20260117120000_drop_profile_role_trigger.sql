-- Brute force fix to find and drop triggers causing the "Database error"
DO $$
DECLARE
    trig_record RECORD;
BEGIN
    -- 1. Find and drop ALL triggers on 'profiles' and 'auth.users' that might be calling our functions
    FOR trig_record IN 
        SELECT tgname, relname
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE (c.relname = 'profiles' AND n.nspname = 'public')
           OR (c.relname = 'users' AND n.nspname = 'auth')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trig_record.tgname || ' ON ' || 
                CASE WHEN trig_record.relname = 'users' THEN 'auth.users' ELSE 'public.' || trig_record.relname END;
    END LOOP;
END $$;

-- 2. Drop the problematic functions completely
DROP FUNCTION IF EXISTS public.create_business_if_owner() CASCADE;
DROP FUNCTION IF EXISTS public.sync_profile_role_to_jwt() CASCADE;

-- 3. Re-install a clean handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, is_active)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    new.email, 
    COALESCE(new.raw_app_meta_data->>'role', 'user'), 
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Re-attach only the base trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
