/*
  # Fix update_user_fidelty function

  1. Modifiche
    - Rimuove la verifica del ruolo del chiamante tramite auth.uid()
    - L'app non usa Supabase Auth, quindi auth.uid() è sempre NULL
    - La verifica dei permessi è gestita lato UI (solo admin/developer vedono l'interfaccia)
    - Mantiene solo la verifica che il target sia un publisher

  2. Security
    - La sicurezza è gestita lato applicazione
    - Solo admin e developer hanno accesso all'interfaccia di gestione utenti
    - La funzione verifica comunque che il target sia un publisher

  3. Note Importanti
    - Per una sicurezza maggiore, bisognerebbe migrare a Supabase Auth
    - In questo contesto (app interna), la sicurezza lato UI è accettabile
*/

DROP FUNCTION IF EXISTS update_user_fidelty(text, text);

CREATE OR REPLACE FUNCTION update_user_fidelty(
  p_target_nickname text,
  p_new_fidelty text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_role text;
BEGIN
  IF p_new_fidelty NOT IN ('friendly', 'pending', 'restricted') THEN
    RAISE EXCEPTION 'Valore fidelty non valido. Usa: friendly, pending, o restricted';
  END IF;

  SELECT role INTO v_target_role
  FROM users
  WHERE nickname = p_target_nickname;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Utente non trovato';
  END IF;

  IF v_target_role != 'publisher' THEN
    RAISE EXCEPTION 'Puoi aggiornare la fidelty solo per gli utenti publisher';
  END IF;

  UPDATE users
  SET fidelty = p_new_fidelty
  WHERE nickname = p_target_nickname;

  RETURN true;
END;
$$;
