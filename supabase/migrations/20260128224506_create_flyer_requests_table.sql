/*
  # Crea tabella flyer_requests per richieste in attesa

  1. Nuova Tabella
    - `flyer_requests`
      - `id` (uuid, primary key) - Identificativo univoco della richiesta
      - `publisher_nickname` (text, foreign key) - Nickname del publisher che ha fatto la richiesta
      - `nome` (text) - Nome dell'evento
      - `data` (date) - Data dell'evento
      - `crew` (text) - Nome della crew
      - `descrizione` (text) - Descrizione dell'evento
      - `status` (text) - Stato della richiesta: 'pending', 'approved', 'rejected'
      - `reviewed_by` (text) - Nickname di chi ha revisionato (admin/developer)
      - `reviewed_at` (timestamptz) - Timestamp della revisione
      - `created_at` (timestamptz) - Timestamp di creazione
  
  2. Sicurezza
    - Abilita RLS sulla tabella
    - Admin e developer possono vedere tutte le richieste
    - Publisher può vedere solo le proprie richieste
    - Solo admin e developer possono approvare/rifiutare richieste
  
  3. Note Importanti
    - Le richieste approvate verranno spostate nella tabella flyer
    - Le richieste rifiutate rimarranno nella tabella per storico
*/

CREATE TABLE IF NOT EXISTS flyer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publisher_nickname text NOT NULL REFERENCES users(nickname) ON DELETE CASCADE,
  nome text NOT NULL,
  data date NOT NULL,
  crew text NOT NULL,
  descrizione text NOT NULL DEFAULT '',
  status text DEFAULT 'pending' CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flyer_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin e developer possono vedere tutte le richieste"
  ON flyer_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Publisher può vedere le proprie richieste"
  ON flyer_requests FOR SELECT
  USING (publisher_nickname = current_user);

CREATE POLICY "Publisher può creare richieste"
  ON flyer_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    publisher_nickname = current_user
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE nickname = current_user 
      AND role = 'publisher'
    )
  );

CREATE POLICY "Admin e developer possono aggiornare richieste"
  ON flyer_requests FOR UPDATE
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

CREATE INDEX IF NOT EXISTS idx_flyer_requests_publisher ON flyer_requests(publisher_nickname);
CREATE INDEX IF NOT EXISTS idx_flyer_requests_status ON flyer_requests(status);