-- Create renewal_requests table
CREATE TABLE IF NOT EXISTS public.renewal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.subscription_plans(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.renewal_requests ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own renewal requests" 
ON public.renewal_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own renewal requests" 
ON public.renewal_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all renewal requests" 
ON public.renewal_requests FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update renewal requests" 
ON public.renewal_requests FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Trigger for updated_at
CREATE TRIGGER set_renewal_updated_at
BEFORE UPDATE ON public.renewal_requests
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
