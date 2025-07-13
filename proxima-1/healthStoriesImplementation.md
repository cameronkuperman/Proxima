# Supabase Setup for Weekly Health Stories

This directory contains the Supabase Edge Functions and database migrations for the weekly health story generation feature.

## Setup Instructions

### 1. Database Setup

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the migration files in order:
   - `migrations/20240101000000_create_health_stories_table.sql`
   - `migrations/20240101000001_setup_health_story_cron.sql`

### 2. Edge Function Deployment

Deploy the health story generation function:

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Link your project (replace with your project ref)
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy generate-weekly-health-stories
```

### 3. Environment Variables

Set the following environment variables in your Supabase Edge Functions settings:

- `ORACLE_API_URL`: Your MCP server URL (default: https://web-production-945c4.up.railway.app)

The following are automatically available in edge functions:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Enable pg_cron Extension

1. Go to Database > Extensions in your Supabase Dashboard
2. Enable the `pg_cron` extension

### 5. Schedule the Cron Job

After enabling pg_cron, run this in the SQL Editor:

```sql
-- Replace 'your-project-ref' and 'YOUR_ANON_KEY' with actual values
SELECT cron.schedule(
  'generate-weekly-health-stories',
  '0 9 * * 1', -- Every Monday at 9 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-ref.supabase.co/functions/v1/generate-weekly-health-stories',
      headers := jsonb_build_object(
        'Authorization', 'Bearer YOUR_ANON_KEY',
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object()
    );
  $$
);
```

### 6. Required Environment Variables for Next.js App

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Testing

### Manual Testing

You can manually trigger the edge function:

```bash
# Using curl
curl -X POST https://your-project-ref.supabase.co/functions/v1/generate-weekly-health-stories \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Check Cron Job Status

```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details 
WHERE jobname = 'generate-weekly-health-stories' 
ORDER BY start_time DESC 
LIMIT 10;
```

## How It Works

1. **Weekly Schedule**: The cron job runs every Monday at 9 AM UTC
2. **User Selection**: Fetches all active users from the `profiles` table
3. **Story Check**: For each user, checks if they already have a health story from the past week
4. **Story Generation**: If no recent story exists, calls the MCP server to generate one
5. **Storage**: Saves the generated story to the `health_stories` table
6. **Access**: Users can view their stories through the Next.js app

## Troubleshooting

### Edge Function Not Running
- Check the function logs in Supabase Dashboard > Functions
- Verify environment variables are set correctly
- Ensure the MCP server is accessible

### Cron Job Not Triggering
- Verify pg_cron is enabled
- Check the cron.job table for your scheduled job
- Look at cron.job_run_details for error messages

### Stories Not Generating
- Check if users have the `active` field set to true in profiles table
- Verify the MCP server endpoint is working
- Check edge function logs for API errors