/*
  # Fix Session Logs INSERT Policy

  1. Modifiche
    - Rimuove la policy INSERT esistente che richiedeva autenticazione Supabase Auth
    - Crea una nuova policy che permette INSERT anche agli utenti anonimi
    - L'app usa autenticazione custom (tabella users), non Supabase Auth
    - La validazione dei ruoli è gestita lato applicazione

  2. Security
    - Permette INSERT a tutti (anon e authenticated)
    - La logica di controllo rimane nell'app (solo admin/developer/publisher loggano)
    - La policy SELECT rimane restrittiva (solo developer possono leggere)

  3. Note Importanti
    - Questa modifica risolve il problema dei log vuoti
    - Gli INSERT funzioneranno anche senza autenticazione Supabase
*/

DROP POLICY IF EXISTS "Authenticated users can insert session logs" ON session_logs;

CREATE POLICY "Anyone can insert session logs"
  ON session_logs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
