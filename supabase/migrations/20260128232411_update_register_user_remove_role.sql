/*
  # Update register_user function to remove role parameter

  1. Changes
    - Drop existing register_user function
    - Create new register_user function without p_role parameter
    - All new users are registered as 'user' role by default

  2. Notes
    - Roles can be changed later by authorized users (developer/admin)
    - This improves security by preventing privilege escalation during registration
*/

DROP FUNCTION IF EXISTS register_user(text, text, text);

CREATE OR REPLACE FUNCTION register_user(
    p_nickname TEXT,
    p_password TEXT
)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_hashed_password TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM users WHERE nickname = p_nickname) THEN
        RAISE EXCEPTION 'Nickname già in uso';
    END IF;

    v_hashed_password := crypt(p_password, gen_salt('bf'));

    INSERT INTO users (nickname, password, role)
    VALUES (p_nickname, v_hashed_password, 'user')
    RETURNING id INTO v_user_id;

    RETURN json_build_object(
        'success', true,
        'user_id', v_user_id,
        'message', 'Utente registrato con successo'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;