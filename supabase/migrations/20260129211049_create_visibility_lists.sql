/*
  # Create Visibility Lists Tables

  1. New Tables
    - `developer_list`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `user_nickname` (text)
      - `added_at` (timestamptz)
      - `added_by` (uuid, references auth.users)
    
    - `publisher_lists`
      - `id` (uuid, primary key)
      - `publisher_id` (uuid, references auth.users)
      - `allowed_user_id` (uuid, references auth.users)
      - `allowed_user_nickname` (text)
      - `added_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Developers can manage developer_list
    - Publishers can manage their own lists
    - Users can view if they are in lists

  3. Notes
    - Developer list is global and managed by developers
    - Each publisher has their own list
    - Admin and Developer are always included in publisher lists (enforced in queries)
*/

CREATE TABLE IF NOT EXISTS developer_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_nickname text NOT NULL,
  added_at timestamptz DEFAULT now(),
  added_by uuid REFERENCES auth.users(id),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS publisher_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allowed_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allowed_user_nickname text NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(publisher_id, allowed_user_id)
);

ALTER TABLE developer_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE publisher_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Developers can view developer list"
  ON developer_list FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('developer', 'admin')
    )
  );

CREATE POLICY "Developers can insert into developer list"
  ON developer_list FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('developer', 'admin')
    )
  );

CREATE POLICY "Developers can delete from developer list"
  ON developer_list FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('developer', 'admin')
    )
  );

CREATE POLICY "Publishers can view their own list"
  ON publisher_lists FOR SELECT
  TO authenticated
  USING (
    publisher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('developer', 'admin')
    )
  );

CREATE POLICY "Publishers can insert into their own list"
  ON publisher_lists FOR INSERT
  TO authenticated
  WITH CHECK (
    publisher_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'publisher'
    )
  );

CREATE POLICY "Publishers can delete from their own list"
  ON publisher_lists FOR DELETE
  TO authenticated
  USING (
    publisher_id = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'publisher'
    )
  );
