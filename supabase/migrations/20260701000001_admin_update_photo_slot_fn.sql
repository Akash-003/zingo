CREATE OR REPLACE FUNCTION admin_update_photo_slot(card_id uuid, slot_value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE cards SET photo_slot = slot_value WHERE id = card_id AND created_by IS NULL;
END;
$$;
