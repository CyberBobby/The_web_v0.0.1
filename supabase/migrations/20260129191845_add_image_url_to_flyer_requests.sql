/*
  # Add image support to flyer_requests table

  1. Modifiche
    - Aggiunge colonna `image_url` alla tabella flyer_requests
    - Permette ai publisher di includere un'immagine nelle loro richieste

  2. Note Importanti
    - Quando una richiesta viene approvata, l'immagine viene copiata nel flyer
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer_requests' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE flyer_requests ADD COLUMN image_url text;
  END IF;
END $$;
