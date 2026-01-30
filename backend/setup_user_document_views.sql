-- Create a table to track user document views
CREATE TABLE IF NOT EXISTS public.user_document_views (
    user_id UUID NOT NULL REFERENCES public."User"(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, document_id)
);

-- Index for faster counting
CREATE INDEX IF NOT EXISTS idx_user_document_views_user_id ON public.user_document_views(user_id);
