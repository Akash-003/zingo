-- ============================================================
-- QuoteFlow — Seed Cards (dev/test data)
-- Replace image_url values with real CDN URLs before production.
-- ============================================================

insert into public.cards (image_url, category, is_premium, photo_slot, name_slot)
values
  -- Good Morning — circle style
  (
    'https://placehold.co/400x600/f6f3ee/9d3d2c?text=Good+Morning',
    'good-morning',
    false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":40,"left":0,"right":0,"fontSize":18,"color":"#9d3d2c"}'
  ),
  -- Motivational — portrait style
  (
    'https://placehold.co/400x600/1c1c19/fcf9f4?text=Motivational',
    'motivational',
    false,
    '{"style":"portrait","top":0,"left":0,"width":400,"height":220,"borderRadius":0}',
    '{"bottom":32,"left":16,"right":16,"fontSize":16,"color":"#ffffff"}'
  ),
  -- Love
  (
    'https://placehold.co/400x600/ffdad3/9d3d2c?text=Love',
    'love',
    false,
    '{"style":"circle","top":48,"left":148,"width":104,"height":104,"borderRadius":9999}',
    '{"bottom":36,"left":0,"right":0,"fontSize":17,"color":"#9d3d2c"}'
  ),
  -- Birthday
  (
    'https://placehold.co/400x600/dbe3c5/5a614a?text=Birthday',
    'birthday',
    false,
    '{"style":"circle","top":56,"left":152,"width":96,"height":96,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#5a614a"}'
  ),
  -- Devotional — premium
  (
    'https://placehold.co/400x600/eae2d0/615c4e?text=Devotional',
    'devotional',
    true,
    '{"style":"portrait","top":0,"left":0,"width":400,"height":200,"borderRadius":0}',
    '{"bottom":28,"left":16,"right":16,"fontSize":16,"color":"#615c4e"}'
  );
