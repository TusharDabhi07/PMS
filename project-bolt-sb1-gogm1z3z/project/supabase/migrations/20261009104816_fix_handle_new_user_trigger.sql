/*
# Fix handle_new_user trigger function

1. Changes
- Recreate handle_new_user() with an explicit search_path for security and reliability
- The function was missing search_path, which can cause "Database error saving new user" 
  during sign-up because the function can't resolve the `profiles` table reliably
- Re-attach the trigger to auth.users
2. Security
- SECURITY DEFINER with search_path = public, auth
- No RLS changes
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$function$;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
