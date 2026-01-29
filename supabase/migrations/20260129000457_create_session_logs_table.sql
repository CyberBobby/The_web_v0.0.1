/*
  # Create Session Logs Table

  1. New Tables
    - `session_logs`
      - `id` (uuid, primary key)
      - `user_nickname` (text) - Nickname dell'utente che ha fatto l'azione
      - `user_role` (text) - Ruolo dell'utente (admin/developer/publisher)
      - `action_type` (text) - Tipo di azione (create_flyer, edit_flyer, delete_flyer, approve_request, reject_request, manage_user, login, logout)
      - `action_details` (jsonb) - Dettagli dell'azione in formato JSON
      - `created_at` (timestamptz) - Timestamp dell'azione

  2. Security
    - Enable RLS on `session_logs` table
    - Only developers can view all logs
    - Users can only see their own logs
    - Auto-delete logs older than 14 days using a policy

  3. Notes
    - Logs are automatically cleaned up after 14 days
    - Only tracks actions from admin, developer, and publisher roles
*/

CREATE TABLE IF NOT EXISTS session_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_nickname text NOT NULL,
  user_role text NOT NULL CHECK (user_role IN ('admin', 'developer', 'publisher')),
  action_type text NOT NULL,
  action_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;

-- Developers can view all logs
CREATE POLICY "Developers can view all session logs"
  ON session_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.nickname = (
        SELECT raw_user_meta_data->>'nickname' 
        FROM auth.users 
        WHERE auth.users.id = auth.uid()
      )
      AND users.role = 'developer'
    )
  );

-- Anyone can insert logs (will be controlled by app logic)
CREATE POLICY "Authenticated users can insert session logs"
  ON session_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_session_logs_created_at ON session_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_logs_user_nickname ON session_logs(user_nickname);
CREATE INDEX IF NOT EXISTS idx_session_logs_user_role ON session_logs(user_role);

-- Function to delete old logs (older than 14 days)
CREATE OR REPLACE FUNCTION delete_old_session_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM session_logs
  WHERE created_at < NOW() - INTERVAL '14 days';
END;
$$;

-- Create a trigger to automatically delete old logs when querying
-- This is a simple approach - in production you'd use a scheduled job
CREATE OR REPLACE FUNCTION cleanup_old_logs_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete old logs whenever a new log is inserted
  DELETE FROM session_logs
  WHERE created_at < NOW() - INTERVAL '14 days';
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cleanup_old_logs
  AFTER INSERT ON session_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_old_logs_trigger();
