/*
  # Add Location Fields to Flyer Table

  1. Changes
    - Add latitude column (numeric) to flyer table
    - Add longitude column (numeric) to flyer table  
    - Add address column (text) to flyer table
    - Add latitude column to flyer_requests table
    - Add longitude column to flyer_requests table
    - Add address column to flyer_requests table

  2. Notes
    - Location fields are optional (nullable) for backward compatibility
    - Latitude and longitude stored as numeric for precision
    - Address stored as text for full address display
*/

-- Add location fields to flyer table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE flyer ADD COLUMN latitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE flyer ADD COLUMN longitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer' AND column_name = 'address'
  ) THEN
    ALTER TABLE flyer ADD COLUMN address text;
  END IF;
END $$;

-- Add location fields to flyer_requests table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer_requests' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE flyer_requests ADD COLUMN latitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer_requests' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE flyer_requests ADD COLUMN longitude numeric(10, 7);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer_requests' AND column_name = 'address'
  ) THEN
    ALTER TABLE flyer_requests ADD COLUMN address text;
  END IF;
END $$;
