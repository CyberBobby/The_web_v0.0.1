/*
  # Creazione tabella profili utenti

  1. Nuove Tabelle
    - `profiles`
      - `id` (uuid, primary key) - ID utente collegato a auth.users
      - `email` (text) - Email dell'utente
      - `role` (text) - Ruolo dell'utente (user o admin)
      - `created_at` (timestamptz) - Data di creazione

  2. Sicurezza
    - Abilitazione RLS sulla tabella `profiles`
    - Policy per permettere agli utenti di leggere solo il proprio profilo
    - Policy per permettere l'inserimento automatico del profilo
    - Policy per permettere agli admin di vedere tutti i profili

  3. Funzioni
    - Trigger per creare automaticamente un profilo quando si registra un nuovo utente
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
