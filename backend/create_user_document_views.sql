-- Table to track unique documents viewed by each user
CREATE TABLE IF NOT EXISTS public.user_document_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public."User"(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, document_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_document_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own views
CREATE POLICY "Users can insert their own views" ON public.user_document_views
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own view history
CREATE POLICY "Users can view their own views" ON public.user_document_views
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service role (backend) has full access (implicit)
