CREATE TABLE public.document_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled scan',
  snippet TEXT,
  sentences JSONB NOT NULL,
  total_sentences INTEGER NOT NULL DEFAULT 0,
  bias_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.document_scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scans" ON public.document_scans
FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own scans" ON public.document_scans
FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own scans" ON public.document_scans
FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own scans" ON public.document_scans
FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_document_scans_updated_at
BEFORE UPDATE ON public.document_scans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_document_scans_user ON public.document_scans(user_id, created_at DESC);