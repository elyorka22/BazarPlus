-- Create admin user
-- This script creates an admin user in Supabase
-- 
-- Usage:
-- 1. Replace 'admin@example.com' with your admin email
-- 2. Replace 'Admin User' with your admin name
-- 3. Replace 'your-secure-password' with a secure password
-- 4. Run this script in Supabase SQL Editor
--
-- Note: You can also create the user through Supabase Auth UI first,
-- then run only the INSERT INTO user_profiles part with the user's UUID

-- Option 1: Create admin user if using Supabase Auth (requires auth.users to exist first)
-- First, create the user through Supabase Dashboard > Authentication > Add User
-- Then run the INSERT statement below with the user's UUID

-- Option 2: If user already exists, just update/create their profile
-- Replace 'USER_UUID_HERE' with the actual UUID from auth.users

-- Insert or update admin profile
-- This will work if the user already exists in auth.users
INSERT INTO public.user_profiles (id, email, name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1),
  'admin@example.com',
  'Admin User',
  'admin'
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Alternative: If you know the user UUID, use this:
-- INSERT INTO public.user_profiles (id, email, name, role)
-- VALUES (
--   'USER_UUID_HERE'::uuid,
--   'admin@example.com',
--   'Admin User',
--   'admin'
-- )
-- ON CONFLICT (id) 
-- DO UPDATE SET 
--   role = 'admin',
--   email = EXCLUDED.email,
--   name = EXCLUDED.name,
--   updated_at = NOW();

-- Verify admin was created
SELECT id, email, name, role, created_at 
FROM public.user_profiles 
WHERE role = 'admin';

