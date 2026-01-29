/*
  # Add Visibility Fields to Flyer Requests Table

  1. Changes to `flyer_requests` table
    - Add `visibility_type` (text) - values: 'all', 'developer_list', 'publisher_list'
    - Add `show_location` (boolean) - if true, show location on map and address

  2. Defaults
    - visibility_type defaults to 'all'
    - show_location defaults to true

  3. Notes
    - These fields are copied from the request to the flyer when approved
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer_requests' AND column_name = 'visibility_type'
  ) THEN
    ALTER TABLE flyer_requests ADD COLUMN visibility_type text DEFAULT 'all' CHECK (visibility_type IN ('all', 'developer_list', 'publisher_list'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer_requests' AND column_name = 'show_location'
  ) THEN
    ALTER TABLE flyer_requests ADD COLUMN show_location boolean DEFAULT true;
  END IF;
END $$;
