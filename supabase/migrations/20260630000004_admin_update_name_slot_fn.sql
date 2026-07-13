CREATE OR REPLACE FUNCTION admin_update_name_slot(card_id uuid, slot_value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF (auth.jwt() ->> 'email') != 'akash05singh97@gmail.com' THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE cards SET name_slot = slot_value WHERE id = card_id AND created_by IS NULL;
END;
$$;
