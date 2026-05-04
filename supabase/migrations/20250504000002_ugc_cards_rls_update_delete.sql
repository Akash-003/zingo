CREATE POLICY "cards: user update own" ON public.cards
  FOR UPDATE USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "cards: user delete own" ON public.cards
  FOR DELETE USING (created_by = auth.uid());
