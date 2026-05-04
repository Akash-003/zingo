ALTER TABLE public.cards
  ADD COLUMN created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN is_public  boolean NOT NULL DEFAULT true;

DROP POLICY "cards: public read" ON public.cards;

CREATE POLICY "cards: public read" ON public.cards
  FOR SELECT USING (
    created_by IS NULL
    OR is_public = true
    OR created_by = auth.uid()
  );

CREATE POLICY "cards: user insert" ON public.cards
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );
