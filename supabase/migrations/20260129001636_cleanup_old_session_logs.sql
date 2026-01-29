/*
  # Automatic Cleanup of Session Logs

  1. Changes
    - Enables pg_cron extension for scheduled jobs
    - Creates a function to delete session logs older than 14 days
    - Schedules automatic cleanup to run daily at 2 AM

  2. Security
    - Function runs with security definer to ensure proper permissions
    - Only affects session_logs table
    - Automatically maintains log retention policy
*/

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create function to cleanup old session logs
CREATE OR REPLACE FUNCTION cleanup_old_session_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM session_logs
  WHERE created_at < NOW() - INTERVAL '14 days';
END;
$$;

-- Schedule the cleanup to run daily at 2 AM UTC
SELECT cron.schedule(
  'cleanup-session-logs',
  '0 2 * * *',
  'SELECT cleanup_old_session_logs();'
);
