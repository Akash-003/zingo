-- ============================================================
-- QuoteFlow — Card personalization flag
-- Some card designs have no room for a user photo/name. Mark
-- those so the app renders them as plain cards (no overlay,
-- no Photo/Name buttons). Watermark/paywall still applies.
-- ============================================================

-- Flag: does this card support compositing the user's photo & name?
ALTER TABLE public.cards
  ADD COLUMN supports_personalization boolean NOT NULL DEFAULT true;

-- Non-personalizable cards don't need slots, so allow them to be NULL.
ALTER TABLE public.cards
  ALTER COLUMN photo_slot DROP NOT NULL,
  ALTER COLUMN name_slot  DROP NOT NULL;

-- ── How to flag existing cards as non-personalizable ─────────
-- Replace the id list with the cards that shouldn't show a photo/name:
--
-- UPDATE public.cards
--   SET supports_personalization = false,
--       photo_slot = NULL,
--       name_slot  = NULL
--   WHERE id IN (
--     '00000000-0000-0000-0000-000000000000'
--   );
