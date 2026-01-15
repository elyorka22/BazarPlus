-- ============================================
-- ПРОСТОЙ SQL КОД ДЛЯ СОЗДАНИЯ АДМИНА
-- ============================================
-- 
-- ИНСТРУКЦИЯ:
-- 1. Сначала создайте пользователя в Supabase Dashboard:
--    - Откройте Authentication → Users → Add User
--    - Email: admin@example.com (замените на свой email)
--    - Password: ваш_пароль
--    - Нажмите "Create User"
--    - Скопируйте User UUID (он будет показан после создания)
--
-- 2. Затем выполните этот SQL код в Supabase SQL Editor:
--    - Замените 'admin@example.com' на email, который вы использовали
--    - Замените 'Admin User' на имя админа
--
-- ============================================

-- ШАГ 1: Найти пользователя по email и создать/обновить профиль админа
INSERT INTO public.user_profiles (id, email, name, role)
SELECT 
  id,                    -- UUID пользователя из auth.users
  email,                 -- Email пользователя
  'Admin User' as name,  -- Имя админа (замените на свое)
  'admin' as role        -- Роль: admin
FROM auth.users
WHERE email = 'admin@example.com'  -- ЗАМЕНИТЕ НА ВАШ EMAIL
LIMIT 1
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',        -- Обновить роль на admin
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- ШАГ 2: Подтвердить email админа (чтобы можно было войти)
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'admin@example.com'  -- ЗАМЕНИТЕ НА ВАШ EMAIL
  AND email_confirmed_at IS NULL;

-- ШАГ 3: Проверить, что админ создан успешно
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

-- ============================================
-- АЛЬТЕРНАТИВНЫЙ ВАРИАНТ (если знаете UUID пользователя)
-- ============================================
-- Раскомментируйте и используйте, если знаете UUID:
/*
INSERT INTO public.user_profiles (id, email, name, role)
VALUES (
  'ВАШ_UUID_ЗДЕСЬ'::uuid,  -- Вставьте UUID пользователя
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

UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE id = 'ВАШ_UUID_ЗДЕСЬ'::uuid;
*/

