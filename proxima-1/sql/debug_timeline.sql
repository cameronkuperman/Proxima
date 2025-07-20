-- Debug Timeline Issues
-- Run these queries in Supabase SQL Editor to diagnose the problem

-- 1. Check if quick_scans table has any data
SELECT COUNT(*) as total_quick_scans FROM quick_scans;

-- 2. Check your recent quick scans (replace YOUR_USER_ID with your actual user ID)
SELECT * FROM quick_scans 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if the view exists and has proper permissions
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE viewname = 'user_interactions';

-- 4. Test the view directly (replace YOUR_USER_ID with your actual user ID)
-- First, let's see what user_id format is in quick_scans
SELECT DISTINCT 
    user_id,
    pg_typeof(user_id) as user_id_type,
    LENGTH(user_id::text) as user_id_length
FROM quick_scans 
WHERE user_id IS NOT NULL
LIMIT 5;

-- 5. Try to query the view with your user ID
-- If your user_id is a UUID like '45b61b67-175d-48a0-aca6-d0be57609383', use:
SELECT * FROM user_interactions 
WHERE user_id = '45b61b67-175d-48a0-aca6-d0be57609383'
ORDER BY created_at DESC
LIMIT 10;

-- 6. Check RLS policies on base tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('quick_scans', 'deep_dive_sessions', 'photo_sessions', 'conversations', 'medical_reports')
ORDER BY tablename, policyname;

-- 7. Check if RLS is enabled on the tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('quick_scans', 'deep_dive_sessions', 'photo_sessions', 'conversations', 'medical_reports');

-- 8. If you see data in quick_scans but not in user_interactions, try this simpler query
SELECT 
    id,
    user_id::text as user_id,
    'quick_scan' as interaction_type,
    created_at,
    body_part as title
FROM quick_scans
WHERE user_id::text = '45b61b67-175d-48a0-aca6-d0be57609383'
ORDER BY created_at DESC
LIMIT 10;