/*
  # Add Publisher ID to Flyer Requests

  1. Changes to `flyer_requests` table
    - Add `publisher_id` (uuid) - references auth.users(id)
    - This field is needed to track who created the request by ID

  2. Notes
    - Existing requests will have NULL publisher_id
    - We'll populate it where possible from publisher_nickname
    - New requests should always include publisher_id
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer_requests' AND column_name = 'publisher_id'
  ) THEN
    ALTER TABLE flyer_requests ADD COLUMN publisher_id uuid REFERENCES auth.users(id);
  END IF;
END $$;
