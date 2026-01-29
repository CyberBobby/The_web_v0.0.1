/*
  # Create Storage Bucket for Flyer Images

  1. Nuovo Bucket
    - Nome: `flyer-images`
    - Pubblico: true (le immagini possono essere visualizzate da tutti)
    - Dimensione massima file: 5MB
    - Tipi di file consentiti: image/jpeg, image/png, image/webp

  2. Security Policies
    - Tutti possono vedere le immagini (SELECT)
    - Tutti possono caricare immagini (INSERT)
    - Tutti possono aggiornare/eliminare immagini (UPDATE/DELETE)

  3. Note Importanti
    - Le immagini sono pubblicamente accessibili via URL
    - La gestione delle eliminazioni è gestita lato applicazione
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'flyer-images',
  'flyer-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'flyer-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Allow anyone to upload images'
  ) THEN
    CREATE POLICY "Allow anyone to upload images"
    ON storage.objects FOR INSERT
    TO public
    WITH CHECK (bucket_id = 'flyer-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Allow users to update their own images'
  ) THEN
    CREATE POLICY "Allow users to update their own images"
    ON storage.objects FOR UPDATE
    TO public
    USING (bucket_id = 'flyer-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Allow users to delete their own images'
  ) THEN
    CREATE POLICY "Allow users to delete their own images"
    ON storage.objects FOR DELETE
    TO public
    USING (bucket_id = 'flyer-images');
  END IF;
END $$;
