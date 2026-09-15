ALTER TYPE public.doc_kind ADD VALUE IF NOT EXISTS 'cours';
ALTER TYPE public.doc_kind ADD VALUE IF NOT EXISTS 'td';
ALTER TYPE public.doc_kind ADD VALUE IF NOT EXISTS 'resume';

ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS td_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resume_id uuid REFERENCES public.documents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS documents_td_id_idx ON public.documents(td_id);
CREATE INDEX IF NOT EXISTS documents_resume_id_idx ON public.documents(resume_id);