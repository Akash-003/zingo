-- Give each card a distinct circle position so the feed looks varied.
-- Positions are chosen to complement each image's composition.
-- All values at 400px base width; QuoteCard scales them at render time.

-- ===================== GOOD MORNING =====================
-- Coffee: large circle, upper-center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":145,"width":110,"height":110,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1493770348161%';

-- Daisies: standard center (bright bg — dark text)
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#5a3e2b"}'::jsonb
WHERE image_url LIKE '%1497321697169%';

-- Cherry blossoms: upper-left
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":30,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":17,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1712905734464%';

-- ===================== MOTIVATIONAL =====================
-- Mountain lake: center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1561327127%';

-- Man on mountain: upper-right
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":270,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1746950862738%';

-- Silhouette mountain: lower-left
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":90,"left":30,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1483444308400%';

-- ===================== LOVE =====================
-- Pink roses: large circle, upper-center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":140,"width":120,"height":120,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#9d3d2c"}'::jsonb
WHERE image_url LIKE '%1518199266791%';

-- Red rose: center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":17,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1487035242901%';

-- Pink rose bokeh: upper-right, small
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":278,"width":90,"height":90,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1541785891419%';

-- ===================== BIRTHDAY =====================
-- Flower bouquet: center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1599577011266%';

-- Birthday cake: upper-left
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":30,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":17,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1650923780562%';

-- Balloons: right side
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":55,"left":278,"width":90,"height":90,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1707794549722%';

-- ===================== GOOD NIGHT =====================
-- Starry night: upper-center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#c8d8f0"}'::jsonb
WHERE image_url LIKE '%1531366936337%';

-- Full moon: center, large
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":50,"left":140,"width":120,"height":120,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#c8d8f0"}'::jsonb
WHERE image_url LIKE '%1490814525860%';

-- Crescent moon mountain: left side
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":30,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1514897575457%';

-- ===================== FESTIVALS =====================
-- Diya lamp: lower-center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":80,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#f5c842"}'::jsonb
WHERE image_url LIKE '%1761328119419%';

-- Lotus holder: center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":56,"left":148,"width":104,"height":104,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":17,"color":"#f5c842"}'::jsonb
WHERE image_url LIKE '%1761328119547%';

-- Candle table: upper-right
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":278,"width":90,"height":90,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#f5c842"}'::jsonb
WHERE image_url LIKE '%1636201702967%';

-- ===================== SHAYARI =====================
-- Sunlit forest: left side
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":30,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1448375240586%';

-- Foggy forest: center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1486707471592%';

-- Pine silhouettes: right side
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":65,"left":278,"width":90,"height":90,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1476362555312%';

-- ===================== DEVOTIONAL =====================
-- Candles dark: large upper-center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":140,"width":120,"height":120,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#f5e6c5"}'::jsonb
WHERE image_url LIKE '%1718976001444%';

-- White feather: center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":56,"left":148,"width":104,"height":104,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":17,"color":"#f5e6c5"}'::jsonb
WHERE image_url LIKE '%1527380992061%';

-- Buddha statue: lower-center (premium)
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":80,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#f5e6c5"}'::jsonb
WHERE image_url LIKE '%1758466872593%';

-- ===================== FRIENDSHIP =====================
-- Friends laughing: left side
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":30,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1529156069898%';

-- Women bubbles: center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1758613171760%';

-- Group mountains: right side
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":55,"left":278,"width":90,"height":90,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1776562340826%';

-- ===================== LIFE =====================
-- Motorcycle sunset: right side
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":65,"left":278,"width":90,"height":90,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1764747902814%';

-- Figures on road: upper-center
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":40,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":16,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1763257434725%';

-- Road through vineyards: left side
UPDATE public.cards SET
  photo_slot = '{"style":"circle","top":60,"left":30,"width":100,"height":100,"borderRadius":9999}'::jsonb,
  name_slot  = '{"bottom":44,"left":0,"right":0,"fontSize":18,"color":"#ffffff"}'::jsonb
WHERE image_url LIKE '%1768059976288%';
