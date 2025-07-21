-- Complete migration to fix medical table schema and OAuth issues
-- Run this entire file in Supabase SQL editor

-- 1. First, let's see the actual structure of the medical table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'medical' 
ORDER BY ordinal_position;

-- 2. Backup existing data before making changes
CREATE TABLE IF NOT EXISTS medical_backup AS SELECT * FROM medical;

-- 3. Convert TEXT columns to JSONB where needed
DO $$ 
BEGIN
    -- Convert medications from TEXT to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='medications' AND data_type='text'
    ) THEN
        -- First add a temporary column
        ALTER TABLE public.medical ADD COLUMN medications_temp JSONB;
        
        -- Copy and convert data
        UPDATE public.medical 
        SET medications_temp = 
            CASE 
                WHEN medications IS NULL OR medications = '' THEN '[]'::jsonb
                WHEN medications::text LIKE '[%' THEN medications::jsonb
                ELSE '[]'::jsonb
            END;
        
        -- Drop old column and rename new one
        ALTER TABLE public.medical DROP COLUMN medications;
        ALTER TABLE public.medical RENAME COLUMN medications_temp TO medications;
    END IF;

    -- Convert family_history from TEXT to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='family_history' AND data_type='text'
    ) THEN
        ALTER TABLE public.medical ADD COLUMN family_history_temp JSONB;
        
        UPDATE public.medical 
        SET family_history_temp = 
            CASE 
                WHEN family_history IS NULL OR family_history = '' THEN '[]'::jsonb
                WHEN family_history::text LIKE '[%' THEN family_history::jsonb
                ELSE '[]'::jsonb
            END;
        
        ALTER TABLE public.medical DROP COLUMN family_history;
        ALTER TABLE public.medical RENAME COLUMN family_history_temp TO family_history;
    END IF;

    -- Convert allergies from TEXT to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='allergies' AND data_type='text'
    ) THEN
        ALTER TABLE public.medical ADD COLUMN allergies_temp JSONB;
        
        UPDATE public.medical 
        SET allergies_temp = 
            CASE 
                WHEN allergies IS NULL OR allergies = '' THEN '[]'::jsonb
                WHEN allergies::text LIKE '[%' THEN allergies::jsonb
                ELSE '[]'::jsonb
            END;
        
        ALTER TABLE public.medical DROP COLUMN allergies;
        ALTER TABLE public.medical RENAME COLUMN allergies_temp TO allergies;
    END IF;

    -- Convert race from TEXT to JSONB
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='race' AND data_type='text'
    ) THEN
        ALTER TABLE public.medical ADD COLUMN race_temp JSONB;
        
        UPDATE public.medical 
        SET race_temp = 
            CASE 
                WHEN race IS NULL OR race = '' THEN '[]'::jsonb
                WHEN race::text LIKE '[%' THEN race::jsonb
                ELSE '[]'::jsonb
            END;
        
        ALTER TABLE public.medical DROP COLUMN race;
        ALTER TABLE public.medical RENAME COLUMN race_temp TO race;
    END IF;
END $$;

-- 4. Add missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='lifestyle_smoking_status') THEN
        ALTER TABLE public.medical ADD COLUMN lifestyle_smoking_status VARCHAR(50) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='lifestyle_alcohol_consumption') THEN
        ALTER TABLE public.medical ADD COLUMN lifestyle_alcohol_consumption VARCHAR(50) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='lifestyle_exercise_frequency') THEN
        ALTER TABLE public.medical ADD COLUMN lifestyle_exercise_frequency VARCHAR(50) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='lifestyle_sleep_hours') THEN
        ALTER TABLE public.medical ADD COLUMN lifestyle_sleep_hours VARCHAR(10) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='lifestyle_stress_level') THEN
        ALTER TABLE public.medical ADD COLUMN lifestyle_stress_level VARCHAR(50) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='lifestyle_diet_type') THEN
        ALTER TABLE public.medical ADD COLUMN lifestyle_diet_type VARCHAR(50) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='emergency_contact_name') THEN
        ALTER TABLE public.medical ADD COLUMN emergency_contact_name VARCHAR(255) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='emergency_contact_relation') THEN
        ALTER TABLE public.medical ADD COLUMN emergency_contact_relation VARCHAR(100) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='emergency_contact_phone') THEN
        ALTER TABLE public.medical ADD COLUMN emergency_contact_phone VARCHAR(50) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='emergency_contact_email') THEN
        ALTER TABLE public.medical ADD COLUMN emergency_contact_email VARCHAR(255) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='created_at') THEN
        ALTER TABLE public.medical ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='medical' AND column_name='updated_at') THEN
        ALTER TABLE public.medical ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 5. Set default values for JSONB columns (only if they are JSONB)
DO $$
BEGIN
    -- Only set defaults if columns are JSONB type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='medications' AND data_type='jsonb'
    ) THEN
        ALTER TABLE public.medical ALTER COLUMN medications SET DEFAULT '[]'::jsonb;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='family_history' AND data_type='jsonb'
    ) THEN
        ALTER TABLE public.medical ALTER COLUMN family_history SET DEFAULT '[]'::jsonb;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='allergies' AND data_type='jsonb'
    ) THEN
        ALTER TABLE public.medical ALTER COLUMN allergies SET DEFAULT '[]'::jsonb;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='race' AND data_type='jsonb'
    ) THEN
        ALTER TABLE public.medical ALTER COLUMN race SET DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 6. Update any NULL values
DO $$
BEGIN
    -- Update JSONB columns only if they are JSONB type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='medications' AND data_type='jsonb'
    ) THEN
        UPDATE public.medical SET medications = COALESCE(medications, '[]'::jsonb) WHERE medications IS NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='family_history' AND data_type='jsonb'
    ) THEN
        UPDATE public.medical SET family_history = COALESCE(family_history, '[]'::jsonb) WHERE family_history IS NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='allergies' AND data_type='jsonb'
    ) THEN
        UPDATE public.medical SET allergies = COALESCE(allergies, '[]'::jsonb) WHERE allergies IS NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='medical' AND column_name='race' AND data_type='jsonb'
    ) THEN
        UPDATE public.medical SET race = COALESCE(race, '[]'::jsonb) WHERE race IS NULL;
    END IF;
    
    -- Update text columns
    UPDATE public.medical SET personal_health_context = COALESCE(personal_health_context, '') WHERE personal_health_context IS NULL;
END $$;

-- 7. Drop the email unique constraint if it exists
ALTER TABLE public.medical DROP CONSTRAINT IF EXISTS medical_email_key;

-- 8. Enable RLS and create policies
ALTER TABLE public.medical ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own medical data" ON public.medical;
DROP POLICY IF EXISTS "Users can insert own medical data" ON public.medical;
DROP POLICY IF EXISTS "Users can update own medical data" ON public.medical;

CREATE POLICY "Users can view own medical data" ON public.medical
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own medical data" ON public.medical
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own medical data" ON public.medical
  FOR UPDATE USING (auth.uid() = id);

-- 9. Create or replace update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create trigger for medical table
DROP TRIGGER IF EXISTS update_medical_updated_at ON public.medical;
CREATE TRIGGER update_medical_updated_at 
  BEFORE UPDATE ON public.medical
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 11. Create tutorial table and policies
CREATE TABLE IF NOT EXISTS public.user_tutorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_seen_welcome BOOLEAN DEFAULT false,
  completed_tours JSONB DEFAULT '[]'::jsonb,
  last_tour_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_tutorial UNIQUE(user_id)
);

-- 12. Create index for user_tutorials
CREATE INDEX IF NOT EXISTS idx_user_tutorials_user_id ON public.user_tutorials(user_id);

-- 13. Enable RLS on user_tutorials
ALTER TABLE public.user_tutorials ENABLE ROW LEVEL SECURITY;

-- 14. Drop and recreate policies for user_tutorials
DROP POLICY IF EXISTS "Users can view own tutorial progress" ON public.user_tutorials;
DROP POLICY IF EXISTS "Users can insert own tutorial progress" ON public.user_tutorials;
DROP POLICY IF EXISTS "Users can update own tutorial progress" ON public.user_tutorials;

CREATE POLICY "Users can view own tutorial progress" ON public.user_tutorials
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tutorial progress" ON public.user_tutorials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tutorial progress" ON public.user_tutorials
  FOR UPDATE USING (auth.uid() = user_id);

-- 15. Create trigger for user_tutorials
DROP TRIGGER IF EXISTS update_user_tutorials_updated_at ON public.user_tutorials;
CREATE TRIGGER update_user_tutorials_updated_at 
  BEFORE UPDATE ON public.user_tutorials
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 16. Insert tutorial records for existing users (safe with ON CONFLICT)
INSERT INTO public.user_tutorials (user_id, has_seen_welcome, completed_tours)
SELECT 
  id as user_id,
  false as has_seen_welcome,
  '[]'::jsonb as completed_tours
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_tutorials ut WHERE ut.user_id = auth.users.id
)
ON CONFLICT (user_id) DO NOTHING;

-- 17. Final check - show the updated medical table structure
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'medical' 
ORDER BY ordinal_position;

-- 18. Show count of records
SELECT 
    'medical' as table_name, 
    COUNT(*) as record_count 
FROM medical
UNION ALL
SELECT 
    'user_tutorials' as table_name, 
    COUNT(*) as record_count 
FROM user_tutorials;