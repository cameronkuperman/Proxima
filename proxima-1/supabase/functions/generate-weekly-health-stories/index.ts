import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const oracleApiUrl = Deno.env.get('ORACLE_API_URL') || 'https://web-production-945c4.up.railway.app'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  try {
    // Log the request for debugging
    console.log('Weekly health story generation started')

    // Get all active users who haven't received a health story in the last 7 days
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    // Get users who need health stories
    const { data: users, error: usersError } = await supabase
      .from('profiles') // or your users table
      .select('id')
      .eq('active', true) // Only active users

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    console.log(`Found ${users?.length || 0} active users`)

    const results = []

    // Generate health stories for each user
    for (const user of users || []) {
      try {
        // Check if user already has a recent health story
        const { data: recentStory, error: storyCheckError } = await supabase
          .from('health_stories')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', oneWeekAgo.toISOString())
          .single()

        if (storyCheckError && storyCheckError.code !== 'PGRST116') {
          // PGRST116 means no rows found, which is expected
          console.error(`Error checking recent story for user ${user.id}:`, storyCheckError)
        }

        if (!recentStory) {
          console.log(`Generating health story for user ${user.id}`)
          
          // Generate new health story
          const response = await fetch(`${oracleApiUrl}/api/health-story`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: user.id,
              date_range: {
                start: oneWeekAgo.toISOString(),
                end: new Date().toISOString()
              },
              include_data: {
                oracle_chats: true,
                deep_dives: true,
                quick_scans: true,
                medical_profile: true
              }
            })
          })

          const result = await response.json()
          
          if (result.success && result.health_story) {
            // Save the generated story to the database
            const { error: saveError } = await supabase
              .from('health_stories')
              .insert({
                id: result.health_story.story_id,
                user_id: user.id,
                header: result.health_story.header,
                story_text: result.health_story.story_text,
                generated_date: result.health_story.generated_date,
                date_range: {
                  start: oneWeekAgo.toISOString(),
                  end: new Date().toISOString()
                },
                data_sources: result.health_story.data_sources || {},
                created_at: new Date().toISOString()
              })

            if (saveError) {
              console.error(`Error saving story for user ${user.id}:`, saveError)
              results.push({
                user_id: user.id,
                success: false,
                error: `Failed to save story: ${saveError.message}`
              })
            } else {
              results.push({
                user_id: user.id,
                success: true,
                story_id: result.health_story.story_id
              })
            }
          } else {
            results.push({
              user_id: user.id,
              success: false,
              error: result.error || 'Failed to generate story'
            })
          }
        } else {
          console.log(`User ${user.id} already has a recent health story`)
        }
      } catch (error) {
        console.error(`Error generating story for user ${user.id}:`, error)
        results.push({
          user_id: user.id,
          success: false,
          error: error.message
        })
      }
    }

    const summary = {
      success: true,
      total_users: users?.length || 0,
      generated: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      skipped: (users?.length || 0) - results.length,
      results
    }

    console.log('Weekly health story generation completed:', summary)

    return new Response(
      JSON.stringify(summary),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Fatal error in health story generation:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})