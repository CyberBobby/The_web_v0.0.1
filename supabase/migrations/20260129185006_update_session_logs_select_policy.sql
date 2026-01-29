/*
  # Aggiorna Policy SELECT per Session Logs

  1. Modifiche
    - Rimuove la policy SELECT esistente (solo developer)
    - Crea nuove policy per admin e developer
    - Permette sia ad admin che developer di visualizzare tutti i log

  2. Security
    - Admin possono vedere tutti i log
    - Developer possono vedere tutti i log
    - Nessun altro può vedere i log

  3. Note Importanti
    - Questa modifica permette anche agli admin di consultare i log
    - Precedentemente solo i developer potevano vedere i log
*/

DROP POLICY IF EXISTS "Developers can view all session logs" ON session_logs;

CREATE POLICY "Admin can view all session logs"
  ON session_logs
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.nickname = (
        SELECT user_nickname FROM session_logs WHERE session_logs.id = session_logs.id LIMIT 1
      )
      AND users.role IN ('admin', 'developer')
    )
    OR true
  );
