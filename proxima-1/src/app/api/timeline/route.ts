import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/client';
import { logger } from '@/utils/logger';
import { ApiErrors, createSuccessResponse } from '@/utils/api-errors';
import { timelineGetSchema, timelinePostSchema, parseQueryParams, validateRequest } from '@/utils/validation-schemas';
import { logMedicalDataAccess } from '@/lib/audit-logger';

export async function GET(request: NextRequest) {
  try {
    // Validate query parameters
    const params = parseQueryParams(request.url);
    const validation = validateRequest(timelineGetSchema, params);
    
    if (!validation.success) {
      return ApiErrors.badRequest('timeline GET', validation.error);
    }
    
    const { limit, offset, search, type } = validation.data;
    
    // Create Supabase client
    const supabase = createClient();
    
    // Get session instead of user for better auth handling
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return ApiErrors.unauthorized('timeline GET');
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
      // Log detailed error info server-side only
      logger.error('Timeline query error:', {
        error,
        userId: user.id,
        filters: { search, type, limit, offset }
      });
      
      return ApiErrors.databaseError(error, 'timeline query');
    }
    
    // Log medical data access
    await logMedicalDataAccess(
      'MEDICAL_TIMELINE_VIEWED',
      user.id,
      request,
      'timeline',
      undefined,
      {
        records_count: data?.length || 0,
        search: search || undefined,
        type: type || undefined,
      }
    );
    
    // Return successful response with pagination info
    return createSuccessResponse({
      interactions: data || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
    
  } catch (error) {
    return ApiErrors.serverError(error, 'timeline GET');
  }
}

// Helper function to validate interaction exists before navigation
export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequest(timelinePostSchema, body);
    
    if (!validation.success) {
      return ApiErrors.badRequest('timeline POST', validation.error);
    }
    
    const { interactionId, interactionType } = validation.data;
    
    const supabase = createClient();
    
    // Get session for auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return ApiErrors.unauthorized('timeline validation');
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
    
    return createSuccessResponse({
      isValid,
      navigationPath
    });
    
  } catch (error) {
    return ApiErrors.serverError(error, 'timeline validation');
  }
}