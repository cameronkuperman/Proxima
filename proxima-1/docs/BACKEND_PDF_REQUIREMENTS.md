# Backend Requirements for PDF Generation System

## Overview
This document outlines the backend requirements for the PDF generation and email delivery system. The frontend is fully implemented and ready - these are the backend endpoints and services needed.

## Required Backend Endpoints

### 1. Email Delivery Endpoint
**Endpoint:** `POST /api/email/send-report`

**Purpose:** Send medical report PDFs via email

**Request Body:**
```json
{
  "to": "recipient@email.com",
  "cc": ["cc@email.com"],
  "subject": "Your Seimeo Health Assessment",
  "template": "patient" | "doctor" | "employer",
  "attachment": {
    "filename": "medical-report-123.pdf",
    "content": "base64_encoded_pdf_content",
    "type": "application/pdf"
  },
  "customMessage": "Optional custom message",
  "metadata": {
    "sent_at": "2025-01-18T14:30:00Z",
    "expires_in_days": 7
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "msg_123456",
  "sentAt": "2025-01-18T14:30:00Z"
}
```

**Implementation Notes:**
- Use SendGrid, AWS SES, or similar email service
- Validate recipient email addresses
- Implement rate limiting (5 emails per user per hour)
- Store email send history in database

### 2. Quick Scan Email Endpoint
**Endpoint:** `POST /api/email/send-scan`

**Purpose:** Send quick scan results without PDF attachment

**Request Body:**
```json
{
  "to": "recipient@email.com",
  "subject": "Your Quick Scan Results",
  "template": "quick_scan",
  "data": {
    "bodyPart": "head",
    "primaryCondition": "Tension headache",
    "confidence": 87,
    "recommendations": ["Rest", "Hydration"],
    "scanId": "QS-2025-ABC123"
  }
}
```

### 3. Tracking Data Endpoint (for PDF inclusion)
**Endpoint:** `GET /api/tracking/chart-data/{scanId}`

**Purpose:** Fetch symptom tracking data to include in PDFs

**Response:**
```json
{
  "trackingData": [
    {"date": "2025-01-10", "severity": 4},
    {"date": "2025-01-15", "severity": 6},
    {"date": "2025-01-18", "severity": 5}
  ],
  "trend": "improving" | "worsening" | "stable",
  "metricName": "Headache Severity",
  "frequency": "daily"
}
```

## Email Service Configuration

### SendGrid Setup (Recommended)
```javascript
// backend/services/emailService.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendMedicalReport(emailData) {
  const msg = {
    to: emailData.to,
    from: 'reports@seimeo.health',
    subject: emailData.subject,
    html: generateEmailTemplate(emailData.template, emailData.data),
    attachments: [{
      content: emailData.attachment.content,
      filename: emailData.attachment.filename,
      type: emailData.attachment.type,
      disposition: 'attachment'
    }]
  };
  
  return await sgMail.send(msg);
}
```

### AWS SES Alternative
```javascript
// backend/services/sesEmailService.js
const AWS = require('aws-sdk');
const ses = new AWS.SES({ region: 'us-east-1' });

async function sendMedicalReport(emailData) {
  const params = {
    Source: 'reports@seimeo.health',
    Destination: {
      ToAddresses: [emailData.to],
      CcAddresses: emailData.cc || []
    },
    Message: {
      Subject: { Data: emailData.subject },
      Body: {
        Html: { Data: generateEmailTemplate(emailData.template) }
      }
    },
    // For attachments, use raw email format
  };
  
  return await ses.sendEmail(params).promise();
}
```

## Database Schema Updates

### Email History Table
```sql
CREATE TABLE email_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  recipient_email TEXT NOT NULL,
  cc_emails TEXT[],
  email_type TEXT NOT NULL, -- 'medical_report', 'quick_scan', etc
  subject TEXT,
  template TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  message_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_email_history_user_id ON email_history(user_id);
CREATE INDEX idx_email_history_recipient ON email_history(recipient_email);
CREATE INDEX idx_email_history_sent_at ON email_history(sent_at);
```

### PDF Generation Log Table
```sql
CREATE TABLE pdf_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  pdf_type TEXT NOT NULL, -- 'quick_scan', 'medical_report', 'timeline'
  source_id TEXT, -- scan_id, session_id, etc
  file_name TEXT,
  file_size INTEGER,
  generation_time_ms INTEGER,
  verification_hash TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

CREATE INDEX idx_pdf_log_user_id ON pdf_generation_log(user_id);
CREATE INDEX idx_pdf_log_source_id ON pdf_generation_log(source_id);
```

## Environment Variables Required

```env
# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM_ADDRESS=reports@seimeo.health
EMAIL_FROM_NAME=Seimeo Health Platform

# AWS SES (if using instead of SendGrid)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Rate Limiting
MAX_EMAILS_PER_USER_PER_HOUR=5
MAX_PDF_GENERATIONS_PER_DAY=20

# PDF Settings
PDF_EXPIRY_DAYS=7
PDF_MAX_SIZE_MB=10
```

## Security Considerations

### 1. Authentication
- All endpoints must verify user authentication
- Use Bearer token from Supabase auth
- Validate user owns the data being exported

### 2. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 emails per hour
  message: 'Too many email requests, please try again later'
});

app.use('/api/email', emailLimiter);
```

### 3. Input Validation
```javascript
const { body, validationResult } = require('express-validator');

const validateEmailRequest = [
  body('to').isEmail().normalizeEmail(),
  body('cc.*').optional().isEmail().normalizeEmail(),
  body('template').isIn(['patient', 'doctor', 'employer']),
  body('attachment.content').optional().isBase64(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

### 4. Data Privacy
- Don't log sensitive medical information
- Encrypt PDFs at rest if storing
- Set appropriate CORS headers
- Implement audit logging for compliance

## Implementation Checklist

- [ ] Set up email service (SendGrid or AWS SES)
- [ ] Create email templates
- [ ] Implement `/api/email/send-report` endpoint
- [ ] Implement `/api/email/send-scan` endpoint
- [ ] Add email history tracking to database
- [ ] Configure rate limiting
- [ ] Add input validation
- [ ] Set up error handling and logging
- [ ] Test email delivery to major providers (Gmail, Outlook, etc)
- [ ] Add PDF generation logging
- [ ] Implement PDF expiry mechanism
- [ ] Add authentication middleware
- [ ] Configure CORS for frontend domain
- [ ] Set up monitoring and alerts
- [ ] Document API in Swagger/OpenAPI

## Testing Requirements

### Unit Tests
- Email template generation
- Input validation
- Rate limiting logic
- PDF base64 encoding/decoding

### Integration Tests
- End-to-end email delivery
- PDF attachment handling
- Database logging
- Error scenarios

### Load Tests
- Concurrent email requests
- Large PDF attachments
- Rate limiting behavior

## Monitoring

### Key Metrics to Track
- Email delivery success rate
- Average email delivery time
- PDF generation time
- Failed email attempts
- Rate limit violations
- Attachment sizes

### Alerts to Configure
- Email service down
- High failure rate (>5%)
- Rate limit exceeded frequently
- Large attachment attempts (>10MB)

---

## Quick Start Implementation

For fastest implementation, use this minimal Node.js/Express setup:

```javascript
// server.js
const express = require('express');
const sgMail = require('@sendgrid/mail');
const app = express();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/email/send-report', async (req, res) => {
  try {
    const { to, attachment, template } = req.body;
    
    const msg = {
      to,
      from: 'reports@seimeo.health',
      subject: 'Your Medical Report',
      html: `<p>Your medical report is attached.</p>`,
      attachments: [{
        content: attachment.content,
        filename: attachment.filename,
        type: 'application/pdf'
      }]
    };
    
    await sgMail.send(msg);
    res.json({ success: true, messageId: 'msg_' + Date.now() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Email service running on port 3001');
});
```

This minimal implementation will get email delivery working immediately. Add authentication, validation, and database logging as needed.

---

*This document outlines all backend requirements for the PDF generation and email system. The frontend is fully implemented and waiting for these endpoints.*