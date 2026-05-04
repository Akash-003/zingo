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

CREATE POLICY "cards: user update own" ON public.cards
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "cards: user delete own" ON public.cards
  FOR DELETE USING (created_by = auth.uid());
