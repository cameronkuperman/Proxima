// Timeline API client for fetching all assessment types

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';

export interface TimelineEvent {
  id: string;
  user_id: string;
  event_type: 'flash' | 'general_quick' | 'general_deep' | 'body_quick' | 'body_deep' | 'photo' | 'chat';
  event_category: 'body' | 'general' | 'photo' | 'chat';
  source_table: string;
  source_id: string;
  title: string;
  summary?: string;
  icon_type: string;
  color_scheme: string;
  severity?: string;
  confidence?: number;
  thread_id?: string;
  is_follow_up: boolean;
  metadata?: any;
  tags?: string[];
  event_timestamp: string;
}

export interface FlashAssessment {
  id: string;
  user_id: string;
  user_query: string;
  ai_response: string;
  main_concern: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  confidence_score: number;
  suggested_next_action: string;
  created_at: string;
}

export interface GeneralAssessment {
  id: string;
  user_id: string;
  category: string;
  form_data: any;
  analysis_result: any;
  primary_assessment: string;
  confidence_score: number;
  urgency_level: string;
  created_at: string;
}

export class TimelineClient {
  async fetchTimelineEvents(userId: string, limit: number = 50): Promise<TimelineEvent[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/timeline?user_id=${userId}&limit=${limit}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch timeline events');
      }

      const data = await response.json();
      return data.events || [];
    } catch (error) {
      console.error('Timeline fetch error:', error);
      return [];
    }
  }

  async fetchFlashAssessment(assessmentId: string): Promise<FlashAssessment | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/flash-assessment/${assessmentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch flash assessment');
      }

      return await response.json();
    } catch (error) {
      console.error('Flash assessment fetch error:', error);
      return null;
    }
  }

  async fetchGeneralAssessment(assessmentId: string): Promise<GeneralAssessment | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/general-assessment/${assessmentId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch general assessment');
      }

      return await response.json();
    } catch (error) {
      console.error('General assessment fetch error:', error);
      return null;
    }
  }

  // Helper to get icon component based on event type
  getEventIcon(eventType: string): string {
    const iconMap: Record<string, string> = {
      'flash': 'Sparkles',
      'general_quick': 'Activity',
      'general_deep': 'Brain',
      'body_quick': 'Target',
      'body_deep': 'Microscope',
      'photo': 'Camera',
      'chat': 'MessageSquare'
    };
    return iconMap[eventType] || 'FileText';
  }

  // Helper to get color scheme
  getEventColor(eventType: string): string {
    const colorMap: Record<string, string> = {
      'flash': 'from-amber-500 to-yellow-500',
      'general_quick': 'from-emerald-500 to-green-500',
      'general_deep': 'from-indigo-500 to-purple-500',
      'body_quick': 'from-emerald-500 to-green-500',
      'body_deep': 'from-indigo-500 to-purple-500',
      'photo': 'from-pink-500 to-rose-500',
      'chat': 'from-blue-500 to-cyan-500'
    };
    return colorMap[eventType] || 'from-gray-500 to-gray-600';
  }

  // Group events by thread
  groupEventsByThread(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
    const grouped: Record<string, TimelineEvent[]> = {};
    
    events.forEach(event => {
      const key = event.thread_id || event.id;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(event);
    });

    // Sort each group by timestamp
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => 
        new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
      );
    });

    return grouped;
  }

  // Format event for display
  formatEventForDisplay(event: TimelineEvent): {
    title: string;
    subtitle: string;
    time: string;
    icon: string;
    color: string;
    urgency?: string;
  } {
    const date = new Date(event.event_timestamp);
    const time = date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });

    let subtitle = '';
    if (event.confidence) {
      subtitle = `${event.confidence}% confidence`;
    }
    if (event.severity) {
      subtitle += subtitle ? ' • ' : '';
      subtitle += `${event.severity} severity`;
    }

    return {
      title: event.title,
      subtitle: subtitle || event.summary || '',
      time,
      icon: event.icon_type,
      color: event.color_scheme,
      urgency: event.severity
    };
  }
}

export const timelineClient = new TimelineClient();