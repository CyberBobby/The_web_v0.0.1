/*
  # Create authentication functions

  1. New Functions
    - `register_user` - Registra un nuovo utente con password criptata
    - `login_user` - Verifica le credenziali e restituisce i dati utente
  
  2. Security
    - Le password sono criptate usando crypt() di pgcrypto
    - Il login verifica la password usando crypt() con il salt salvato
    - Le funzioni sono sicure e prevengono SQL injection
  
  3. Important Notes
    - La funzione register_user crea un nuovo utente con password criptata
    - La funzione login_user verifica le credenziali e restituisce i dati dell'utente
    - Le password non vengono mai restituite nelle query
*/

-- Function to register a new user
CREATE OR REPLACE FUNCTION register_user(
  p_nickname text,
  p_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (nickname, password)
  VALUES (p_nickname, crypt(p_password, gen_salt('bf')));
END;
$$;

-- Function to login and verify credentials
CREATE OR REPLACE FUNCTION login_user(
  p_nickname text,
  p_password text
)
RETURNS TABLE(id uuid, nickname text, role text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.nickname, u.role, u.created_at
  FROM users u
  WHERE u.nickname = p_nickname
    AND u.password = crypt(p_password, u.password);
END;
$$;
