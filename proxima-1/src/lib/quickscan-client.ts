// Quick Scan API client

const API_BASE_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://web-production-945c4.up.railway.app';
console.log('Quick Scan API URL:', API_BASE_URL);

export interface QuickScanFormData {
  symptoms: string;
  painType?: string[];
  painLevel?: string;
  duration?: string;
  dailyImpact?: string[];
  worseWhen?: string;
  betterWhen?: string;
  sleepImpact?: string;
  frequency?: string;
  whatTried?: string;
  didItHelp?: string;
  associatedSymptoms?: string;
  triggerEvent?: string;
}

export interface AnalysisResult {
  confidence: number;
  primaryCondition: string;
  likelihood: string;
  symptoms: string[];
  recommendations: string[];
  urgency: 'low' | 'medium' | 'high';
  differentials: Array<{
    condition: string;
    probability: number;
  }>;
  redFlags: string[];
  selfCare: string[];
  timeline: string;
  followUp: string;
  relatedSymptoms: string[];
}

export interface QuickScanResponse {
  scan_id: string;
  analysis: AnalysisResult;
  body_part: string;
  confidence: number;
  user_id: string | null;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  status: 'success' | 'error';
  error?: string;
}

export class QuickScanClient {
  async performQuickScan(
    bodyPart: string,
    formData: QuickScanFormData,
    userId?: string
  ): Promise<QuickScanResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quick-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body_part: bodyPart,
          form_data: {
            ...formData,
            painLevel: formData.painLevel ? parseInt(formData.painLevel) : undefined
          },
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `Quick scan failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Quick Scan API response:', JSON.stringify(data, null, 2));
      
      if (data.status === 'error') {
        console.error('API returned error status:', data.error);
        throw new Error(data.error || 'Quick scan analysis failed');
      }

      return data;
    } catch (error) {
      console.error('Quick scan error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Quick scan failed');
    }
  }

  async generateSummary(scanId: string, userId: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate_summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quick_scan_id: scanId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Summary generation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Summary generation error:', error);
      // Don't throw - summary generation is not critical
      return null;
    }
  }
}

export const quickScanClient = new QuickScanClient();