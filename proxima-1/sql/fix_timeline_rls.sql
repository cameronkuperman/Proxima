-- Fix RLS and Permissions for Timeline
-- Run this if the debug queries show RLS issues

-- 1. First, check if we need to enable RLS on the tables
ALTER TABLE quick_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_dive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_data_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_configurations ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policies for quick_scans (if they don't exist)
DO $$
BEGIN
    -- Drop existing policies to avoid conflicts
    DROP POLICY IF EXISTS "Users can view own quick scans" ON quick_scans;
    DROP POLICY IF EXISTS "Users can insert own quick scans" ON quick_scans;
    
    -- Create new policies
    CREATE POLICY "Users can view own quick scans" ON quick_scans
        FOR SELECT
        USING (auth.uid()::text = user_id OR user_id IS NULL);
        
    CREATE POLICY "Users can insert own quick scans" ON quick_scans
        FOR INSERT
        WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);
END $$;

-- 3. Create RLS policies for deep_dive_sessions
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own deep dives" ON deep_dive_sessions;
    DROP POLICY IF EXISTS "Users can insert own deep dives" ON deep_dive_sessions;
    
    CREATE POLICY "Users can view own deep dives" ON deep_dive_sessions
        FOR SELECT
        USING (auth.uid()::text = user_id OR user_id IS NULL);
        
    CREATE POLICY "Users can insert own deep dives" ON deep_dive_sessions
        FOR INSERT
        WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);
END $$;

-- 4. Create RLS policies for photo_sessions
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own photo sessions" ON photo_sessions;
    DROP POLICY IF EXISTS "Users can insert own photo sessions" ON photo_sessions;
    
    CREATE POLICY "Users can view own photo sessions" ON photo_sessions
        FOR SELECT
        USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can insert own photo sessions" ON photo_sessions
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END $$;

-- 5. Create RLS policies for conversations
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
    DROP POLICY IF EXISTS "Users can insert own conversations" ON conversations;
    
    CREATE POLICY "Users can view own conversations" ON conversations
        FOR SELECT
        USING (auth.uid() = user_id);
        
    CREATE POLICY "Users can insert own conversations" ON conversations
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
END $$;

-- 6. Create RLS policies for medical_reports
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own reports" ON medical_reports;
    DROP POLICY IF EXISTS "Users can insert own reports" ON medical_reports;
    
    CREATE POLICY "Users can view own reports" ON medical_reports
        FOR SELECT
        USING (auth.uid()::text = user_id OR user_id IS NULL);
        
    CREATE POLICY "Users can insert own reports" ON medical_reports
        FOR INSERT
        WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);
END $$;

-- 7. Create RLS policies for tracking tables
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can view own tracking configs" ON tracking_configurations;
    DROP POLICY IF EXISTS "Users can view own tracking data" ON tracking_data_points;
    
    CREATE POLICY "Users can view own tracking configs" ON tracking_configurations
        FOR SELECT
        USING (auth.uid()::text = user_id);
        
    CREATE POLICY "Users can view own tracking data" ON tracking_data_points
        FOR SELECT
        USING (auth.uid()::text = user_id);
END $$;

-- 8. Grant SELECT permission on the view to authenticated users (if not already granted)
GRANT SELECT ON user_interactions TO authenticated;

-- 9. Alternative: If RLS is causing issues, you can create a security definer function
CREATE OR REPLACE FUNCTION get_user_timeline(
    p_user_id text,
    p_limit int DEFAULT 50,
    p_offset int DEFAULT 0,
    p_search text DEFAULT '',
    p_type text DEFAULT ''
)
RETURNS TABLE (
    id uuid,
    user_id text,
    interaction_type text,
    created_at timestamptz,
    title text,
    severity text,
    metadata jsonb
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Verify the user is querying their own data
    IF p_user_id != auth.uid()::text THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;
    
    RETURN QUERY
    SELECT 
        ui.id,
        ui.user_id,
        ui.interaction_type,
        ui.created_at,
        ui.title,
        ui.severity,
        ui.metadata
    FROM user_interactions ui
    WHERE ui.user_id = p_user_id
        AND (p_search = '' OR ui.title ILIKE '%' || p_search || '%')
        AND (p_type = '' OR ui.interaction_type = p_type)
    ORDER BY ui.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_timeline TO authenticated;