# Timeline Migration Instructions

## Overview
This migration adds all missing health interaction types to the timeline sidebar:
- Flash Assessments
- General Assessments  
- General Deep Dive Sessions
- Fixes Oracle Chat filtering (now includes 'health_analysis' conversations)

## How to Apply

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the entire contents of `add_all_interactions_to_timeline.sql`
4. Paste and run the SQL
5. Verify by running: `SELECT DISTINCT interaction_type FROM user_interactions;`

## Expected Results
You should now see these interaction types in the timeline:
- `quick_scan` - Body-specific quick scans
- `deep_dive` - Body-specific deep dives
- `flash_assessment` - Quick text-based assessments
- `general_assessment` - Category-based general assessments
- `general_deepdive` - Category-based deep analysis
- `photo_analysis` - Photo analysis sessions
- `report` - Medical reports
- `oracle_chat` - Oracle conversations (both 'general_chat' and 'health_analysis')
- `tracking_log` - Symptom tracking data

## Frontend Updates Complete
The dashboard, HistoryModal, and API routes have been updated to support all new interaction types with appropriate icons and colors.

## Testing
After applying the migration:
1. Check the timeline sidebar shows all interaction types
2. Verify clicking each type opens the correct detail view
3. Test the search functionality across all types
4. Confirm Oracle chats now appear properly