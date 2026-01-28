/*
  # Aggiorna ruoli utente e aggiungi campo fidelty

  1. Modifiche alla tabella users
    - Aggiorna il constraint sui ruoli per includere 'developer' e 'publisher'
    - Aggiungi campo `fidelty` (text) con valori: 'friendly', 'pending', 'restricted'
  
  2. Note Importanti
    - I ruoli disponibili sono ora: user, admin, developer, publisher
    - Il campo fidelty serve per i publisher:
      - 'friendly': può postare flyer direttamente
      - 'pending': deve creare richieste che admin/developer approvano
      - 'restricted': non può postare
    - Il campo fidelty ha default 'pending' per sicurezza
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    
    ALTER TABLE users ADD CONSTRAINT users_role_check 
      CHECK (role = ANY (ARRAY['user'::text, 'admin'::text, 'developer'::text, 'publisher'::text]));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'fidelty'
  ) THEN
    ALTER TABLE users ADD COLUMN fidelty text DEFAULT 'pending' 
      CHECK (fidelty = ANY (ARRAY['friendly'::text, 'pending'::text, 'restricted'::text]));
  END IF;
END $$;