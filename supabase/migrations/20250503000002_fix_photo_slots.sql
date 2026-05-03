-- Fix portrait-style photo slots: replace full-width banner overlay
-- with a contained circle overlay centered on the upper card area.

UPDATE public.cards
SET photo_slot = '{"style":"circle","top":60,"left":150,"width":100,"height":100,"borderRadius":9999}'::jsonb
WHERE photo_slot->>'style' = 'portrait';
