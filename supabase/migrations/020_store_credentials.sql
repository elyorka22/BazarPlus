-- Create table to store store credentials (passwords) for admin access
-- Note: This is for admin convenience only. Passwords are stored in plain text.
-- In production, consider using a more secure approach.
CREATE TABLE IF NOT EXISTS store_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id),
  UNIQUE(owner_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_store_credentials_store_id ON store_credentials(store_id);
CREATE INDEX IF NOT EXISTS idx_store_credentials_owner_id ON store_credentials(owner_id);

-- RLS policies - only admins can view and manage credentials
CREATE POLICY "Admins can view store credentials"
  ON store_credentials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert store credentials"
  ON store_credentials FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update store credentials"
  ON store_credentials FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete store credentials"
  ON store_credentials FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

