-- 1. Create Branches Table
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    manager TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create QR Codes Table
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    scans_count INTEGER DEFAULT 0,
    description TEXT,
    form_type TEXT DEFAULT 'feedback',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON public.branches(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_business_id ON public.qr_codes(business_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_branch_id ON public.qr_codes(branch_id);

-- 4. Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- 5. Basic RLS Policies (Owner can manage their own data)
-- Note: This assumes businesses are owned by the current user via owner_id
-- If using user_business table, policies would be more complex joins.

-- Branches Policies
CREATE POLICY "Owners can view their own branches" ON public.branches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = branches.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can insert their own branches" ON public.branches
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = branches.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their own branches" ON public.branches
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = branches.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete their own branches" ON public.branches
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = branches.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

-- QR Codes Policies
CREATE POLICY "Owners can view their own qr_codes" ON public.qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = qr_codes.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can insert their own qr_codes" ON public.qr_codes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = qr_codes.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can update their own qr_codes" ON public.qr_codes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = qr_codes.business_id
            AND businesses.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can delete their own qr_codes" ON public.qr_codes
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.businesses
            WHERE businesses.id = qr_codes.business_id
            AND businesses.owner_id = auth.uid()
        )
    );
