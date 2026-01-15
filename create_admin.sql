-- ============================================
-- SQL Script to Create Admin User
-- ============================================
-- 
-- INSTRUCTIONS:
-- 1. First, create a user in Supabase Dashboard:
--    - Go to Authentication > Users > Add User
--    - Enter email: admin@example.com (or your email)
--    - Enter password: your-secure-password
--    - Click "Create User"
--    - Copy the User UUID
--
-- 2. Then run this script in Supabase SQL Editor:
--    - Replace 'admin@example.com' with your admin email
--    - Replace 'Admin User' with your admin name
--    - Replace 'USER_UUID_HERE' with the UUID from step 1
--
-- ============================================

-- Method 1: Using email to find user (recommended)
-- This will find the user by email and create/update their profile
INSERT INTO public.user_profiles (id, email, name, role)
SELECT 
  id,
  email,
  'Admin User' as name,
  'admin' as role
FROM auth.users
WHERE email = 'admin@example.com'
LIMIT 1
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Method 2: Using known UUID (alternative)
-- Uncomment and use this if you know the user UUID
/*
INSERT INTO public.user_profiles (id, email, name, role)
VALUES (
  'USER_UUID_HERE'::uuid,  -- Replace with actual UUID
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
*/

-- Verify admin was created successfully
SELECT 
  id,
  email,
  name,
  role,
  created_at,
  updated_at
FROM public.user_profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

