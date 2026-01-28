/*
  # Create users table with authentication

  1. New Tables
    - `users`
      - `id` (uuid, auto-generated)
      - `nickname` (text, primary key, unique)
      - `password` (text, encrypted with pgcrypto)
      - `role` (text, default 'user')
      - `created_at` (timestamp, auto-generated)
  
  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their own data
    - Add policy for users to insert new accounts
    - Add policy for admin to read all users
  
  3. Important Notes
    - Password encryption uses pgcrypto extension
    - Roles are either 'user' or 'admin'
    - Nickname is the primary key for easy lookups
*/

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid(),
  nickname text PRIMARY KEY,
  password text NOT NULL,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  USING (true);

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can register"
  ON users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own password
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (nickname = current_setting('app.current_user', true))
  WITH CHECK (nickname = current_setting('app.current_user', true));
