// Email Service for PDF delivery
// This is a frontend interface - actual email sending happens on backend

export interface EmailOptions {
  recipient: string;
  cc?: string[];
  subject?: string;
  template: 'patient' | 'doctor' | 'employer';
  attachmentUrl?: string;
  attachmentBlob?: Blob;
  customMessage?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class EmailService {
  private apiUrl: string;
  
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.seimeo.health';
  }

  /**
   * Send medical report PDF via email
   */
  async sendMedicalReport(
    pdfBlob: Blob,
    recipient: string,
    options: Partial<EmailOptions> = {}
  ): Promise<EmailResponse> {
    try {
      // Convert blob to base64 for API transmission
      const base64 = await this.blobToBase64(pdfBlob);
      
      const emailData = {
        to: recipient,
        cc: options.cc,
        subject: options.subject || `Your Seimeo Health Assessment - ${new Date().toLocaleDateString()}`,
        template: options.template || 'patient',
        attachment: {
          filename: `medical-report-${Date.now()}.pdf`,
          content: base64,
          type: 'application/pdf'
        },
        customMessage: options.customMessage,
        metadata: {
          sent_at: new Date().toISOString(),
          expires_in_days: 7
        }
      };

      const response = await fetch(`${this.apiUrl}/api/email/send-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Email service error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Send quick scan results via email
   */
  async sendQuickScanResults(
    scanData: any,
    recipient: string,
    options: Partial<EmailOptions> = {}
  ): Promise<EmailResponse> {
    // For quick scan, we might want a simpler email template
    const emailData = {
      to: recipient,
      subject: options.subject || 'Your Quick Scan Results',
      template: 'quick_scan' as any,
      data: {
        bodyPart: scanData.bodyPart,
        primaryCondition: scanData.analysis?.primaryCondition,
        confidence: scanData.confidence,
        recommendations: scanData.analysis?.recommendations,
        scanId: scanData.scan_id
      }
    };

    try {
      const response = await fetch(`${this.apiUrl}/api/email/send-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`
        },
        body: JSON.stringify(emailData)
      });

      if (!response.ok) {
        throw new Error(`Email service error: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        messageId: result.messageId
      };
    } catch (error) {
      console.error('Email service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Get email templates for preview
   */
  async getEmailTemplate(
    template: EmailOptions['template'],
    data?: any
  ): Promise<string> {
    const templates = {
      patient: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Your Health Assessment</h1>
          </div>
          <div style="padding: 30px; background: #f7f7f7;">
            <p>Your medical report has been generated and is attached to this email.</p>
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <strong>Important:</strong> This document expires in 7 days for your security.
            </div>
            <h3>Next Steps:</h3>
            <ul>
              <li>Review the attached PDF report</li>
              <li>Share with your healthcare provider if needed</li>
              <li>Follow the recommended actions in the report</li>
            </ul>
            ${data?.customMessage ? `<p>${data.customMessage}</p>` : ''}
          </div>
          <div style="padding: 20px; background: #333; color: #999; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px;">
            <p>This report is for informational purposes only and does not replace professional medical advice.</p>
            <p>© ${new Date().getFullYear()} Seimeo Health Intelligence Platform</p>
          </div>
        </div>
      `,
      
      doctor: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #2c3e50; padding: 20px; border-bottom: 3px solid #3498db;">
            <h2 style="color: white; margin: 0;">Patient Health Assessment Report</h2>
          </div>
          <div style="padding: 20px; background: white; border: 1px solid #ddd;">
            <p>Dear Healthcare Provider,</p>
            <p>Please find attached a comprehensive health assessment report for your patient.</p>
            <table style="width: 100%; margin: 20px 0;">
              <tr>
                <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6;"><strong>Report Type:</strong></td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">Medical Assessment</td>
              </tr>
              <tr>
                <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6;"><strong>Generated:</strong></td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date().toLocaleString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; background: #f8f9fa; border: 1px solid #dee2e6;"><strong>Valid Until:</strong></td>
                <td style="padding: 10px; border: 1px solid #dee2e6;">${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</td>
              </tr>
            </table>
            <p style="color: #666; font-size: 12px;">
              This report was generated using AI-assisted analysis and should be used as supplementary information only.
            </p>
          </div>
        </div>
      `,
      
      employer: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-bottom: 2px solid #dee2e6;">
            <h2 style="color: #333; margin: 0;">Medical Documentation</h2>
          </div>
          <div style="padding: 20px; background: white;">
            <p>To Whom It May Concern,</p>
            <p>Please find attached medical documentation as requested.</p>
            <p>This document contains health assessment information and is valid for 7 days from the date of generation.</p>
            <p>If you have any questions or need additional information, please contact the individual directly.</p>
            <p style="margin-top: 30px;">Sincerely,<br/>Seimeo Health Platform</p>
          </div>
        </div>
      `
    };

    return templates[template] || templates.patient;
  }

  /**
   * Helper: Convert blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Helper: Get auth token
   */
  private async getAuthToken(): Promise<string> {
    // This would get the actual auth token from your auth system
    // For now, returning a placeholder
    if (typeof window !== 'undefined') {
      const { data: { session } } = await (await import('@/lib/supabase')).supabase.auth.getSession();
      return session?.access_token || '';
    }
    return '';
  }
}

// Export singleton instance
export const emailService = new EmailService();

