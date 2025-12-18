-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text,
  phone text,
  email text,
  sex text,
  first_seen_at timestamp with time zone DEFAULT now(),
  last_seen_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_phone_key UNIQUE (phone)
);

-- OPTIONAL: Trigger to auto-save from feedback (if you prefer database-side logic)
-- This is a fallback if the application code fails to insert
CREATE OR REPLACE FUNCTION public.handle_new_feedback_client()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN
    INSERT INTO public.clients (full_name, phone, email, sex, last_seen_at)
    VALUES (NEW.full_name, NEW.phone, NEW.email, NEW.sex, NOW())
    ON CONFLICT (phone) 
    DO UPDATE SET
      full_name = EXCLUDED.full_name,
      email = COALESCE(EXCLUDED.email, clients.email),
      sex = COALESCE(EXCLUDED.sex, clients.sex),
      last_seen_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists before creating to avoid errors in repeated runs
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_feedback_created') THEN
        CREATE TRIGGER on_feedback_created
        AFTER INSERT ON public.feedback
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_feedback_client();
    END IF;
END
$$;
