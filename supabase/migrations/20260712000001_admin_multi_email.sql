-- Centralize the admin allowlist so adding/removing an admin is a one-line
-- change here instead of editing every admin_* function's guard clause.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'email') = ANY (ARRAY[
    'akash05singh97@gmail.com',
    'digitalftprint07@gmail.com'
  ]);
$$;

CREATE OR REPLACE FUNCTION admin_review_card(card_id uuid, has_name_area boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  IF has_name_area THEN
    UPDATE cards SET name_slot_reviewed = true WHERE id = card_id AND created_by IS NULL;
  ELSE
    UPDATE cards SET name_slot = null, name_slot_reviewed = true WHERE id = card_id AND created_by IS NULL;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_name_slot(card_id uuid, slot_value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE cards SET name_slot = slot_value WHERE id = card_id AND created_by IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION admin_update_photo_slot(card_id uuid, slot_value jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  UPDATE cards SET photo_slot = slot_value WHERE id = card_id AND created_by IS NULL;
END;
$$;
