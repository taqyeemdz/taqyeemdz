-- Enable RLS on feedback if not already enabled
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Owners can view their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Owners can delete their own feedback" ON public.feedback;
DROP POLICY IF EXISTS "Owners and Admins can view feedback" ON public.feedback;
DROP POLICY IF EXISTS "Owners and Admins can delete feedback" ON public.feedback;
DROP POLICY IF EXISTS "Public can insert feedback" ON public.feedback;

-- 1. Owners and Admins can view feedback
CREATE POLICY "Owners and Admins can view feedback" ON public.feedback
    FOR SELECT USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'superadmin')) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        ) OR
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = feedback.business_id
            AND (
                businesses.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_business
                    WHERE user_business.business_id = businesses.id
                    AND user_business.user_id = auth.uid()
                )
            )
        )
    );

-- 2. Owners and Admins can delete feedback
CREATE POLICY "Owners and Admins can delete feedback" ON public.feedback
    FOR DELETE USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'superadmin')) OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('admin', 'superadmin')
        ) OR
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = feedback.business_id
            AND (
                businesses.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM public.user_business
                    WHERE user_business.business_id = businesses.id
                    AND user_business.user_id = auth.uid()
                )
            )
        )
    );

-- 3. Public can insert feedback (anyone with the link can leave a review)
CREATE POLICY "Public can insert feedback" ON public.feedback
    FOR INSERT WITH CHECK (true);
