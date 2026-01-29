/*
  # Crea funzione per aggiornare fidelty degli utenti

  1. Nuove Funzioni
    - `update_user_fidelty` (nickname text, new_fidelty text)
      - Permette agli admin e developer di aggiornare la fidelty di un publisher
      - Restituisce true se l'aggiornamento ha successo
      - Verifica che l'utente target sia effettivamente un publisher
  
  2. Security
    - Solo admin e developer possono eseguire questa funzione
    - Può essere applicata solo a utenti con ruolo 'publisher'
    - La funzione è SECURITY DEFINER per permettere l'aggiornamento
  
  3. Note Importanti
    - Valori validi per fidelty: 'friendly', 'pending', 'restricted'
    - La funzione verifica automaticamente i permessi del chiamante
*/

CREATE OR REPLACE FUNCTION update_user_fidelty(
  p_target_nickname text,
  p_new_fidelty text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_role text;
  v_target_role text;
BEGIN
  -- Verifica che il valore fidelty sia valido
  IF p_new_fidelty NOT IN ('friendly', 'pending', 'restricted') THEN
    RAISE EXCEPTION 'Valore fidelty non valido. Usa: friendly, pending, o restricted';
  END IF;

  -- Ottieni il ruolo del chiamante
  SELECT role INTO v_caller_role
  FROM users
  WHERE nickname = (
    SELECT raw_user_meta_data->>'nickname' 
    FROM auth.users 
    WHERE auth.users.id = auth.uid()
  );

  -- Verifica che il chiamante sia admin o developer
  IF v_caller_role NOT IN ('admin', 'developer') THEN
    RAISE EXCEPTION 'Solo admin e developer possono aggiornare la fidelty';
  END IF;

  -- Ottieni il ruolo dell'utente target
  SELECT role INTO v_target_role
  FROM users
  WHERE nickname = p_target_nickname;

  -- Verifica che l'utente target esista
  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'Utente non trovato';
  END IF;

  -- Verifica che l'utente target sia un publisher
  IF v_target_role != 'publisher' THEN
    RAISE EXCEPTION 'Puoi aggiornare la fidelty solo per gli utenti publisher';
  END IF;

  -- Aggiorna la fidelty
  UPDATE users
  SET fidelty = p_new_fidelty
  WHERE nickname = p_target_nickname;

  RETURN true;
END;
$$;
