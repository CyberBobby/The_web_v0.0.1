/*
  # Crea tabella flyer

  1. Nuova Tabella
    - `flyer`
      - `id` (uuid, primary key) - Identificativo univoco del flyer
      - `user_nickname` (text, foreign key) - Riferimento al nickname dell'utente che ha creato il flyer
      - `nome` (text) - Nome dell'evento o del flyer
      - `data` (date) - Data dell'evento
      - `crew` (text) - Nome della crew organizzatrice
      - `descrizione` (text) - Descrizione dettagliata dell'evento
      - `created_at` (timestamptz) - Timestamp di creazione
  
  2. Sicurezza
    - Abilita RLS sulla tabella `flyer`
    - Policy per permettere a tutti (anche non autenticati) di leggere i flyer
    - Policy per permettere agli utenti autenticati di creare flyer
    - Policy per permettere agli utenti di aggiornare solo i propri flyer
    - Policy per permettere agli utenti di eliminare solo i propri flyer
  
  3. Note Importanti
    - La tabella è collegata a `users` tramite `user_nickname` (riferimento a nickname)
    - Tutti possono visualizzare i flyer, anche senza essere loggati
    - Solo gli utenti autenticati possono creare nuovi flyer
    - Gli utenti possono modificare/eliminare solo i propri flyer
*/

CREATE TABLE IF NOT EXISTS flyer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_nickname text NOT NULL REFERENCES users(nickname) ON DELETE CASCADE,
  nome text NOT NULL,
  data date NOT NULL,
  crew text NOT NULL,
  descrizione text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE flyer ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutti possono leggere i flyer"
  ON flyer FOR SELECT
  USING (true);

CREATE POLICY "Utenti autenticati possono creare flyer"
  ON flyer FOR INSERT
  TO authenticated
  WITH CHECK (user_nickname = current_user);

CREATE POLICY "Utenti possono aggiornare i propri flyer"
  ON flyer FOR UPDATE
  TO authenticated
  USING (user_nickname = current_user)
  WITH CHECK (user_nickname = current_user);

CREATE POLICY "Utenti possono eliminare i propri flyer"
  ON flyer FOR DELETE
  TO authenticated
  USING (user_nickname = current_user);

CREATE INDEX IF NOT EXISTS idx_flyer_user_nickname ON flyer(user_nickname);
CREATE INDEX IF NOT EXISTS idx_flyer_data ON flyer(data DESC);