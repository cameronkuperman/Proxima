import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/client';
import { logger } from '@/utils/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';
    
    // Create Supabase client
    const supabase = createClient();
    
    // Get session instead of user for better auth handling
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      logger.error('Session error in timeline:', sessionError);
      return NextResponse.json({ 
        error: 'Unauthorized',
        interactions: [],
        pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
      }, { status: 401 });
    }
    
    const user = session.user;
    
    // Query the view directly with proper user filtering
    let query = supabase
      .from('user_interactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);
    
    // Add search filter if provided
    if (search) {
      query = query.or(`title.ilike.%${search}%,metadata->>body_part.ilike.%${search}%,metadata->>condition.ilike.%${search}%`);
    }
    
    // Add type filter if provided
    if (type) {
      query = query.eq('interaction_type', type);
    }
    
    // Add ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    // Execute query
    const { data, error, count } = await query;
    
    if (error) {
      logger.error('Timeline query error:', error);
      logger.error('Query details:', { user_id: user.id, search, type, limit, offset });
      
      // Try a direct query to quick_scans to debug
      const { data: debugData, error: debugError } = await supabase
        .from('quick_scans')
        .select('id, user_id, created_at')
        .limit(5);
        
      logger.debug('Debug quick_scans query:', { debugData, debugError });
      
      return NextResponse.json({ 
        error: 'Failed to fetch timeline data',
        details: error.message,
        user_id: user.id,
        debug: { hasQuickScans: !!debugData?.length }
      }, { status: 500 });
    }
    
    // Return successful response with pagination info
    return NextResponse.json({
      interactions: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
    
  } catch (error) {
    logger.error('Timeline API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      interactions: [],
      pagination: { total: 0, limit: 50, offset: 0, hasMore: false }
    }, { status: 500 });
  }
}

// Helper function to validate interaction exists before navigation
export async function POST(request: Request) {
  try {
    const { interactionId, interactionType } = await request.json();
    
    const supabase = createClient();
    
    // Get session for auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      logger.error('Session error in timeline validation:', sessionError);
      return NextResponse.json({ 
        isValid: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const user = session.user;
    
    // Validate the interaction exists based on type
    let isValid = false;
    let navigationPath = '';
    
    switch (interactionType) {
      case 'quick_scan':
        const { data: quickScan } = await supabase
          .from('quick_scans')
          .select('id')
          .eq('id', interactionId)
          .eq('user_id', user.id)
          .single();
        
        if (quickScan) {
          isValid = true;
          navigationPath = `/scan/results/${interactionId}`;
        }
        break;
        
      case 'deep_dive':
        const { data: deepDive } = await supabase
          .from('deep_dive_sessions')
          .select('id, status')
          .eq('id', interactionId)
          .eq('user_id', user.id)
          .single();
        
        if (deepDive) {
          isValid = true;
          navigationPath = deepDive.status === 'completed' 
            ? `/scan/deep-dive/results/${interactionId}`
            : `/scan/deep-dive/${interactionId}`;
        }
        break;
        
      case 'flash_assessment':
        const { data: flashAssessment } = await supabase
          .from('flash_assessments')
          .select('id')
          .eq('id', interactionId)
          .eq('user_id', user.id)
          .single();
        
        if (flashAssessment) {
          isValid = true;
          navigationPath = `/assessment/flash/${interactionId}`;
        }
        break;
        
      case 'general_assessment':
        const { data: generalAssessment } = await supabase
          .from('general_assessments')
          .select('id')
          .eq('id', interactionId)
          .eq('user_id', user.id)
          .single();
        
        if (generalAssessment) {
          isValid = true;
          navigationPath = `/assessment/general/${interactionId}`;
        }
        break;
        
      case 'general_deepdive':
        const { data: generalDeepDive } = await supabase
          .from('general_deepdive_sessions')
          .select('id, status')
          .eq('id', interactionId)
          .eq('user_id', user.id)
          .single();
        
        if (generalDeepDive) {
          isValid = true;
          navigationPath = generalDeepDive.status === 'completed'
            ? `/assessment/deep-dive/results/${interactionId}`
            : `/assessment/deep-dive/${interactionId}`;
        }
        break;
        
      case 'photo_analysis':
        // For photo analysis, we need the session_id from metadata
        const { data: photoSession } = await supabase
          .from('photo_sessions')
          .select('id')
          .eq('id', interactionId)
          .eq('user_id', user.id)
          .single();
        
        if (photoSession) {
          isValid = true;
          navigationPath = `/photo-analysis?session=${interactionId}`;
        }
        break;
        
      case 'report':
        const { data: report } = await supabase
          .from('medical_reports')
          .select('id')
          .eq('id', interactionId)
          .eq('user_id', user.id)
          .single();
        
        if (report) {
          isValid = true;
          navigationPath = `/reports/${interactionId}`;
        }
        break;
        
      case 'oracle_chat':
        const { data: conversation } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', interactionId)
          .eq('user_id', user.id)
          .single();
        
        if (conversation) {
          isValid = true;
          navigationPath = `/oracle?conversation=${interactionId}`;
        }
        break;
        
      case 'tracking_log':
        // For tracking logs, we just open the chart modal
        isValid = true;
        navigationPath = 'modal:tracking_chart';
        break;
    }
    
    return NextResponse.json({
      isValid,
      navigationPath
    });
    
  } catch (error) {
    logger.error('Validation error:', error);
    return NextResponse.json({ 
      isValid: false,
      error: 'Failed to validate interaction' 
    }, { status: 500 });
  }
}