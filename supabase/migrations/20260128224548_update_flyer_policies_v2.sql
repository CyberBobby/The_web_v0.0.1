/*
  # Aggiorna policies per tabella flyer con nuovi ruoli

  1. Modifiche alle Policy
    - Rimuovi tutte le vecchie policy esistenti
    - Crea nuove policy per gestire i ruoli admin, developer, publisher
  
  2. Nuove Regole di Accesso
    - SELECT: Tutti possono leggere (anche non autenticati)
    - INSERT: 
      - Admin e developer possono sempre inserire
      - Publisher con fidelty 'friendly' può inserire
    - UPDATE:
      - Admin e developer possono aggiornare qualsiasi flyer
      - Publisher può aggiornare solo i propri flyer
    - DELETE:
      - Admin e developer possono eliminare qualsiasi flyer
      - Publisher può eliminare solo i propri flyer
  
  3. Note Importanti
    - Admin e developer hanno pieno controllo su tutti i flyer
    - Publisher con fidelty 'friendly' può postare direttamente
    - Publisher con altre fidelty deve usare flyer_requests
*/

DO $$
BEGIN
  DROP POLICY IF EXISTS "Tutti possono leggere i flyer" ON flyer;
  DROP POLICY IF EXISTS "Utenti autenticati possono creare flyer" ON flyer;
  DROP POLICY IF EXISTS "Utenti possono aggiornare i propri flyer" ON flyer;
  DROP POLICY IF EXISTS "Utenti possono eliminare i propri flyer" ON flyer;
  DROP POLICY IF EXISTS "Admin e developer possono creare flyer" ON flyer;
  DROP POLICY IF EXISTS "Publisher friendly può creare flyer" ON flyer;
  DROP POLICY IF EXISTS "Admin e developer possono aggiornare tutti i flyer" ON flyer;
  DROP POLICY IF EXISTS "Publisher può aggiornare i propri flyer" ON flyer;
  DROP POLICY IF EXISTS "Admin e developer possono eliminare tutti i flyer" ON flyer;
  DROP POLICY IF EXISTS "Publisher può eliminare i propri flyer" ON flyer;
END $$;

CREATE POLICY "Tutti possono leggere i flyer"
  ON flyer FOR SELECT
  USING (true);

CREATE POLICY "Admin e developer possono creare flyer"
  ON flyer FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Publisher friendly può creare flyer"
  ON flyer FOR INSERT
  TO authenticated
  WITH CHECK (
    user_nickname = current_user
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role = 'publisher'
      AND fidelty = 'friendly'
    )
  );

CREATE POLICY "Admin e developer possono aggiornare tutti i flyer"
  ON flyer FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Publisher può aggiornare i propri flyer"
  ON flyer FOR UPDATE
  TO authenticated
  USING (
    user_nickname = current_user
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role = 'publisher'
    )
  )
  WITH CHECK (
    user_nickname = current_user
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role = 'publisher'
    )
  );

CREATE POLICY "Admin e developer possono eliminare tutti i flyer"
  ON flyer FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Publisher può eliminare i propri flyer"
  ON flyer FOR DELETE
  TO authenticated
  USING (
    user_nickname = current_user
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role = 'publisher'
    )
  );