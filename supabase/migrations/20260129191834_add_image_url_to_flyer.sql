/*
  # Add image support to flyer table

  1. Modifiche
    - Aggiunge colonna `image_url` alla tabella flyer per memorizzare il path dell'immagine
    - La colonna è opzionale (nullable) per compatibilità con flyer esistenti

  2. Note Importanti
    - Il path sarà relativo al bucket storage di Supabase
    - Format: "bucket-name/file-name.ext"
    - Le immagini saranno standardizzate a 800x600px in formato JPEG
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'flyer' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE flyer ADD COLUMN image_url text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_flyer_image_url ON flyer(image_url);
