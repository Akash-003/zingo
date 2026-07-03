CREATE OR REPLACE FUNCTION admin_review_card(card_id uuid, has_name_area boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF has_name_area THEN
    UPDATE cards SET name_slot_reviewed = true WHERE id = card_id AND created_by IS NULL;
  ELSE
    UPDATE cards SET name_slot = null, name_slot_reviewed = true WHERE id = card_id AND created_by IS NULL;
  END IF;
END;
$$;
