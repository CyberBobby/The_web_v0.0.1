/*
  # Fix Flyer Requests Policies

  1. Security Changes
    - Drop old policies that use current_user
    - Create new policies that use auth.uid()
    - Support both publisher_id and publisher_nickname for backward compatibility

  2. Notes
    - Fixes authentication checks in RLS policies
    - Ensures proper access control for flyer requests
*/

DROP POLICY IF EXISTS "Admin e developer possono vedere tutte le richieste" ON flyer_requests;
DROP POLICY IF EXISTS "Publisher può vedere le proprie richieste" ON flyer_requests;
DROP POLICY IF EXISTS "Publisher può creare richieste" ON flyer_requests;
DROP POLICY IF EXISTS "Admin e developer possono aggiornare richieste" ON flyer_requests;

CREATE POLICY "Admin and developer can view all requests"
  ON flyer_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Publisher can view own requests"
  ON flyer_requests FOR SELECT
  TO authenticated
  USING (
    publisher_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.nickname = flyer_requests.publisher_nickname
    )
  );

CREATE POLICY "Publisher can create requests"
  ON flyer_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    publisher_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role = 'publisher'
    )
  );

CREATE POLICY "Admin and developer can update requests"
  ON flyer_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'developer')
    )
  );
