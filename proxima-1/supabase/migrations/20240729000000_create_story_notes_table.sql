-- Create story_notes table for personal notes on health stories
CREATE TABLE IF NOT EXISTS public.story_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    story_id UUID NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_story_notes_user_id ON public.story_notes(user_id);
CREATE INDEX idx_story_notes_story_id ON public.story_notes(story_id);
CREATE INDEX idx_story_notes_user_story ON public.story_notes(user_id, story_id);

-- Enable Row Level Security
ALTER TABLE public.story_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notes" 
    ON public.story_notes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
    ON public.story_notes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
    ON public.story_notes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
    ON public.story_notes FOR DELETE 
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.story_notes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Grant necessary permissions
GRANT ALL ON public.story_notes TO authenticated;
GRANT ALL ON public.story_notes TO service_role;