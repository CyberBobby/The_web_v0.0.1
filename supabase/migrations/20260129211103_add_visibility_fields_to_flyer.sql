/*
  # Add Visibility Fields to Flyer Table

  1. Changes to `flyer` table
    - Add `visibility_type` (text) - values: 'all', 'developer_list', 'publisher_list'
      - 'all': visible to everyone (including non-authenticated users)
      - 'developer_list': visible only to users in developer_list
      - 'publisher_list': visible only to users in the publisher's list
    - Add `show_location` (boolean) - if true, show location on map and address
    - Add `created_by_id` (uuid) - reference to the user who created the flyer

  2. Defaults
    - visibility_type defaults to 'all' for backward compatibility
    - show_location defaults to true for backward compatibility

  3. Notes
    - These fields control flyer visibility and location display
    - Existing flyers will have default values (all users, location visible)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer' AND column_name = 'visibility_type'
  ) THEN
    ALTER TABLE flyer ADD COLUMN visibility_type text DEFAULT 'all' CHECK (visibility_type IN ('all', 'developer_list', 'publisher_list'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer' AND column_name = 'show_location'
  ) THEN
    ALTER TABLE flyer ADD COLUMN show_location boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer' AND column_name = 'created_by_id'
  ) THEN
    ALTER TABLE flyer ADD COLUMN created_by_id uuid REFERENCES auth.users(id);
  END IF;
END $$;
