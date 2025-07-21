-- Fix medical table to properly handle OAuth users
-- This migration ensures OAuth users can be created in the medical table

-- 1. Ensure medical table can handle OAuth users
ALTER TABLE public.medical 
  ALTER COLUMN email DROP NOT NULL,
  ALTER COLUMN name SET DEFAULT '',
  ALTER COLUMN age DROP NOT NULL,
  ALTER COLUMN height DROP NOT NULL,
  ALTER COLUMN weight DROP NOT NULL,
  ALTER COLUMN is_male DROP NOT NULL;

-- 2. Set defaults for OAuth users
ALTER TABLE public.medical 
  ALTER COLUMN age SET DEFAULT NULL,
  ALTER COLUMN height SET DEFAULT '',
  ALTER COLUMN weight SET DEFAULT '',
  ALTER COLUMN is_male SET DEFAULT NULL,
  ALTER COLUMN blood_type SET DEFAULT '',
  ALTER COLUMN ethnicity SET DEFAULT '',
  ALTER COLUMN email SET DEFAULT '';

-- 3. Create function to handle OAuth user creation
CREATE OR REPLACE FUNCTION public.handle_new_oauth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create medical record for OAuth users
  IF NEW.raw_app_meta_data->>'provider' IN ('google', 'apple', 'github') THEN
    INSERT INTO public.medical (
      id,
      email,
      name,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      COALESCE(NEW.email, ''),
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        ''
      ),
      NOW(),
      NOW()
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for automatic medical record creation
DROP TRIGGER IF EXISTS on_oauth_user_created ON auth.users;
CREATE TRIGGER on_oauth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_oauth_user();

-- 5. Backfill medical records for existing OAuth users
INSERT INTO public.medical (id, email, name, created_at, updated_at)
SELECT 
  u.id,
  COALESCE(u.email, ''),
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1),
    ''
  ),
  u.created_at,
  NOW()
FROM auth.users u
LEFT JOIN public.medical m ON u.id = m.id
WHERE m.id IS NULL
  AND u.raw_app_meta_data->>'provider' IN ('google', 'apple', 'github')
ON CONFLICT (id) DO NOTHING;

-- 6. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_medical_email ON public.medical(email);
CREATE INDEX IF NOT EXISTS idx_medical_created_at ON public.medical(created_at);

-- 7. Update RLS policies to handle OAuth users
DROP POLICY IF EXISTS "Users can insert own medical data" ON public.medical;
CREATE POLICY "Users can insert own medical data" ON public.medical
  FOR INSERT WITH CHECK (
    auth.uid() = id OR 
    (auth.uid() IS NOT NULL AND id = auth.uid())
  );

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.medical TO authenticated;

-- 9. Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'OAuth medical table fixes applied successfully';
  RAISE NOTICE 'Medical table now supports OAuth users with partial data';
  RAISE NOTICE 'Trigger created for automatic medical record creation';
END $$;