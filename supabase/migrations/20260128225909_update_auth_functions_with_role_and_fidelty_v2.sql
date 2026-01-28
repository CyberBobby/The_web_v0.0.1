/*
  # Aggiorna funzioni di autenticazione

  1. Modifiche
    - Aggiorna register_user per accettare parametro role
    - Rimuove e ricrea login_user per restituire anche fidelty
  
  2. Note Importanti
    - Il ruolo viene impostato durante la registrazione
    - Il campo fidelty viene restituito durante il login per i publisher
*/

DROP FUNCTION IF EXISTS register_user(text, text);
DROP FUNCTION IF EXISTS login_user(text, text);

CREATE OR REPLACE FUNCTION register_user(
  p_nickname text,
  p_password text,
  p_role text DEFAULT 'user'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (nickname, password, role)
  VALUES (p_nickname, crypt(p_password, gen_salt('bf')), p_role);
END;
$$;

CREATE OR REPLACE FUNCTION login_user(
  p_nickname text,
  p_password text
)
RETURNS TABLE(id uuid, nickname text, role text, fidelty text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.nickname, u.role, u.fidelty, u.created_at
  FROM users u
  WHERE u.nickname = p_nickname
    AND u.password = crypt(p_password, u.password);
END;
$$;