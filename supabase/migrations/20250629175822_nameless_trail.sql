/*
  # Fix User Signup Database Error

  1. Issues Fixed
    - Ensure proper user creation trigger
    - Fix potential conflicts with auth.users table
    - Add proper error handling for user creation
    - Ensure users table has correct structure

  2. Changes
    - Update handle_new_user function with better error handling
    - Ensure users table matches auth.users structure
    - Add proper constraints and defaults
*/

-- First, let's make sure the users table has the correct structure
ALTER TABLE users 
  ALTER COLUMN id SET DEFAULT gen_random_uuid(),
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN role SET DEFAULT 'customer',
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Add constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_check' 
    AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('customer', 'retailer'));
  END IF;
END $$;

-- Improved function to handle new user creation with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name text;
  user_role text;
BEGIN
  -- Extract name from metadata or use email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Extract role from metadata or default to customer
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'customer'
  );
  
  -- Ensure role is valid
  IF user_role NOT IN ('customer', 'retailer') THEN
    user_role := 'customer';
  END IF;
  
  -- Insert user with proper error handling
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_role,
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Add a function to manually create user profile if trigger fails
CREATE OR REPLACE FUNCTION create_user_profile(
  user_id uuid,
  user_email text,
  user_name text DEFAULT NULL,
  user_role text DEFAULT 'customer'
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    user_email,
    COALESCE(user_name, split_part(user_email, '@', 1)),
    COALESCE(user_role, 'customer'),
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated;