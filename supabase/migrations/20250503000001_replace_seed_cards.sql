-- ============================================================
-- QuoteFlow — Replace placeholder seed cards with real images
-- Uses verified Unsplash CDN URLs (free, no auth required)
-- 30 cards — 3 per category × 10 categories
-- All photo_slot / name_slot coords authored at 400px width
-- ============================================================

DELETE FROM public.cards;

INSERT INTO public.cards (image_url, category, is_premium, photo_slot, name_slot)
VALUES

  -- ===================== GOOD MORNING =====================

  -- Morning coffee warm tones — circle
  (
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?auto=format&fit=crop&w=400&h=600&q=80',
    'good-morning', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'
  ),
  -- White daisies bright — circle with darker text
  (
    'https://images.unsplash.com/photo-1497321697169-1ca9f1c8a253?auto=format&fit=crop&w=400&h=600&q=80',
    'good-morning', false,
    '{"style":"circle","top":55,"left":148,"width":104,"height":104,"borderRadius":9999}',
    '{"bottom":40,"left":0,"right":0,"fontSize":18,"color":"#5a3e2b"}'
  ),
  -- Pink cherry blossoms — portrait top
  (
    'https://images.unsplash.com/photo-1712905734464-72add17af439?auto=format&fit=crop&w=400&h=600&q=80',
    'good-morning', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":17,"color":"#ffffff"}'
  ),

  -- ===================== MOTIVATIONAL =====================

  -- Mountain lake daytime — portrait top
  (
    'https://images.unsplash.com/photo-1561327127-3cd091e6258e?auto=format&fit=crop&w=400&h=600&q=80',
    'motivational', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),
  -- Man triumphant on mountain at sunset — portrait top
  (
    'https://images.unsplash.com/photo-1746950862738-399b20e6f0eb?auto=format&fit=crop&w=400&h=600&q=80',
    'motivational', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),
  -- Silhouette on mountain peak — circle
  (
    'https://images.unsplash.com/photo-1483444308400-fb9510501d23?auto=format&fit=crop&w=400&h=600&q=80',
    'motivational', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'
  ),

  -- ===================== LOVE =====================

  -- Pink roses garden — circle
  (
    'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&w=400&h=600&q=80',
    'love', false,
    '{"style":"circle","top":56,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#9d3d2c"}'
  ),
  -- Red rose close-up — circle
  (
    'https://images.unsplash.com/photo-1487035242901-d419a42d17af?auto=format&fit=crop&w=400&h=600&q=80',
    'love', false,
    '{"style":"circle","top":60,"left":148,"width":104,"height":104,"borderRadius":9999}',
    '{"bottom":40,"left":0,"right":0,"fontSize":17,"color":"#ffffff"}'
  ),
  -- Pink rose bokeh — circle
  (
    'https://images.unsplash.com/photo-1541785891419-d06983b463c5?auto=format&fit=crop&w=400&h=600&q=80',
    'love', false,
    '{"style":"circle","top":52,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'
  ),

  -- ===================== BIRTHDAY =====================

  -- Colorful flower bouquet — circle
  (
    'https://images.unsplash.com/photo-1599577011266-9c006a93c294?auto=format&fit=crop&w=400&h=600&q=80',
    'birthday', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'
  ),
  -- Birthday cake with candles — circle
  (
    'https://images.unsplash.com/photo-1650923780562-07c034e3b0d5?auto=format&fit=crop&w=400&h=600&q=80',
    'birthday', false,
    '{"style":"circle","top":55,"left":148,"width":104,"height":104,"borderRadius":9999}',
    '{"bottom":40,"left":0,"right":0,"fontSize":17,"color":"#ffffff"}'
  ),
  -- Balloons in room — portrait top
  (
    'https://images.unsplash.com/photo-1707794549722-3aff19c3964e?auto=format&fit=crop&w=400&h=600&q=80',
    'birthday', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),

  -- ===================== GOOD NIGHT =====================

  -- Starry night sky — portrait top, cool text
  (
    'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=400&h=600&q=80',
    'good-night', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#c8d8f0"}'
  ),
  -- Full moon against dark sky — circle, cool text
  (
    'https://images.unsplash.com/photo-1490814525860-594e82bfd34a?auto=format&fit=crop&w=400&h=600&q=80',
    'good-night', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#c8d8f0"}'
  ),
  -- Crescent moon above mountain — portrait top
  (
    'https://images.unsplash.com/photo-1514897575457-c4db467cf78e?auto=format&fit=crop&w=400&h=600&q=80',
    'good-night', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),

  -- ===================== FESTIVALS =====================

  -- Diya lamp with flowers (Diwali) — circle, golden
  (
    'https://images.unsplash.com/photo-1761328119419-154a21dcd64d?auto=format&fit=crop&w=400&h=600&q=80',
    'festivals', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#f5c842"}'
  ),
  -- Lotus candle holder glowing — circle, golden
  (
    'https://images.unsplash.com/photo-1761328119547-97d8bb4050bd?auto=format&fit=crop&w=400&h=600&q=80',
    'festivals', false,
    '{"style":"circle","top":56,"left":148,"width":104,"height":104,"borderRadius":9999}',
    '{"bottom":40,"left":0,"right":0,"fontSize":17,"color":"#f5c842"}'
  ),
  -- Lit candle on wooden table — portrait top, golden
  (
    'https://images.unsplash.com/photo-1636201702967-763d01c93c7c?auto=format&fit=crop&w=400&h=600&q=80',
    'festivals', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#f5c842"}'
  ),

  -- ===================== SHAYARI =====================

  -- Sunlit forest path — portrait top
  (
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&h=600&q=80',
    'shayari', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),
  -- Foggy forest walk — portrait top
  (
    'https://images.unsplash.com/photo-1486707471592-8e7eb7e36f78?auto=format&fit=crop&w=400&h=600&q=80',
    'shayari', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),
  -- Pine tree silhouettes — circle
  (
    'https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?auto=format&fit=crop&w=400&h=600&q=80',
    'shayari', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'
  ),

  -- ===================== DEVOTIONAL =====================

  -- Candles in dark room — circle, warm gold
  (
    'https://images.unsplash.com/photo-1718976001444-38ffc80cf381?auto=format&fit=crop&w=400&h=600&q=80',
    'devotional', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#f5e6c5"}'
  ),
  -- White feather in hand — circle, warm gold
  (
    'https://images.unsplash.com/photo-1527380992061-b126c88cbb41?auto=format&fit=crop&w=400&h=600&q=80',
    'devotional', false,
    '{"style":"circle","top":56,"left":148,"width":104,"height":104,"borderRadius":9999}',
    '{"bottom":40,"left":0,"right":0,"fontSize":17,"color":"#f5e6c5"}'
  ),
  -- Buddha statue outdoors — portrait top (premium)
  (
    'https://images.unsplash.com/photo-1758466872593-048fa542b478?auto=format&fit=crop&w=400&h=600&q=80',
    'devotional', true,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#f5e6c5"}'
  ),

  -- ===================== FRIENDSHIP =====================

  -- Friends laughing together — portrait top
  (
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=400&h=600&q=80',
    'friendship', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),
  -- Women blowing bubbles in park — circle
  (
    'https://images.unsplash.com/photo-1758613171760-f0844a4bc1d5?auto=format&fit=crop&w=400&h=600&q=80',
    'friendship', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'
  ),
  -- Group at Twin Lakes Colorado — portrait top
  (
    'https://images.unsplash.com/photo-1776562340826-9b7716dc1fe7?auto=format&fit=crop&w=400&h=600&q=80',
    'friendship', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),

  -- ===================== LIFE =====================

  -- Motorcycle at sunset — portrait top
  (
    'https://images.unsplash.com/photo-1764747902814-7f0e1049da5a?auto=format&fit=crop&w=400&h=600&q=80',
    'life', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),
  -- Two figures walking on dirt road — portrait top
  (
    'https://images.unsplash.com/photo-1763257434725-1cd1327f2185?auto=format&fit=crop&w=400&h=600&q=80',
    'life', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'
  ),
  -- Road through vineyards at sunset — circle
  (
    'https://images.unsplash.com/photo-1768059976288-ec8819d810ca?auto=format&fit=crop&w=400&h=600&q=80',
    'life', false,
    '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}',
    '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'
  );
