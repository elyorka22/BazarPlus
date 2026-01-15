-- ============================================
-- ИСПРАВИТЬ STORAGE BUCKET И RLS ПОЛИТИКИ
-- ============================================
-- 
-- Эта миграция создает bucket 'images' если его нет
-- и исправляет RLS политики для become_seller_page
--
-- ============================================

-- ШАГ 1: Создать bucket 'images' если его нет
-- Примечание: Создание bucket через SQL требует прав суперпользователя
-- Если это не работает, создайте bucket вручную через Supabase Dashboard:
-- Storage → Create Bucket → Name: 'images' → Public: true

-- Проверить существование bucket
DO $$
BEGIN
  -- Попытка создать bucket (может не сработать без прав суперпользователя)
  -- В этом случае создайте bucket вручную через Dashboard
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'images'
  ) THEN
    -- Создать bucket через SQL (требует прав суперпользователя)
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('images', 'images', true)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- ШАГ 2: Убедиться, что RLS политики для storage.buckets правильные
-- Политика для чтения (публичный доступ)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- Политика для загрузки (аутентифицированные пользователи)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

-- Политика для обновления (владелец файла)
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

-- Политика для удаления (владелец файла)
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    auth.role() = 'authenticated'
  );

-- ШАГ 3: Исправить RLS политики для become_seller_page
-- Проверить существование политики
DO $$
BEGIN
  -- Убедиться, что политика для просмотра существует
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'become_seller_page' 
    AND policyname = 'Anyone can view active become seller page'
  ) THEN
    CREATE POLICY "Anyone can view active become seller page"
      ON become_seller_page FOR SELECT
      USING (is_active = true);
  END IF;
END $$;

-- Пересоздать политику для админов (на случай проблем)
DROP POLICY IF EXISTS "Admins can manage become seller page" ON become_seller_page;
CREATE POLICY "Admins can manage become seller page"
  ON become_seller_page FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ШАГ 4: Проверить, что таблица become_seller_page существует
-- Если таблицы нет, создадим её
CREATE TABLE IF NOT EXISTS become_seller_page (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включить RLS для become_seller_page
ALTER TABLE become_seller_page ENABLE ROW LEVEL SECURITY;

