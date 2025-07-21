-- Create user_tutorials table for tracking tutorial progress
CREATE TABLE IF NOT EXISTS public.user_tutorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_seen_welcome BOOLEAN DEFAULT false,
  completed_tours JSONB DEFAULT '[]'::jsonb,
  last_tour_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one record per user
  CONSTRAINT unique_user_tutorial UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_tutorials_user_id ON public.user_tutorials(user_id);

-- Enable RLS
ALTER TABLE public.user_tutorials ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only view their own tutorial progress
CREATE POLICY "Users can view own tutorial progress" ON public.user_tutorials
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own tutorial record
CREATE POLICY "Users can insert own tutorial progress" ON public.user_tutorials
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tutorial progress
CREATE POLICY "Users can update own tutorial progress" ON public.user_tutorials
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at (using existing function)
DROP TRIGGER IF EXISTS update_user_tutorials_updated_at ON public.user_tutorials;
CREATE TRIGGER update_user_tutorials_updated_at BEFORE UPDATE ON public.user_tutorials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();