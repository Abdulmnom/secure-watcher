CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_username text;
  candidate text;
  suffix int;
BEGIN
  -- Derive a base username (prefer provided username, fallback to email local-part, final fallback 'user')
  base_username := NULLIF(trim(NEW.raw_user_meta_data ->> 'username'), '');
  IF base_username IS NULL THEN
    base_username := split_part(COALESCE(NEW.email, ''), '@', 1);
  END IF;
  IF base_username IS NULL OR base_username = '' THEN
    base_username := 'user';
  END IF;

  -- Ensure uniqueness: try base, then base + 4-digit suffix
  candidate := base_username;
  suffix := 0;
  LOOP
    BEGIN
      INSERT INTO public.profiles (user_id, email, username)
      VALUES (NEW.id, NEW.email, candidate);
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      suffix := suffix + 1;
      candidate := base_username || '-' || lpad((floor(random() * 10000))::int::text, 4, '0');
      IF suffix > 10 THEN
        -- If too many collisions, fall back to user id prefix
        candidate := base_username || '-' || left(NEW.id::text, 8);
      END IF;
    END;
  END LOOP;

  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;