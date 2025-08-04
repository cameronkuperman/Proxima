-- Create audit schema for better organization
CREATE SCHEMA IF NOT EXISTS audit;

-- Create audit logs table
CREATE TABLE audit.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit.logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit.logs(timestamp);
CREATE INDEX idx_audit_logs_action ON audit.logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit.logs(created_at);

-- Enable Row Level Security
ALTER TABLE audit.logs ENABLE ROW LEVEL SECURITY;

-- Create a policy that only allows inserts (no updates or deletes for audit integrity)
CREATE POLICY "Service role can insert audit logs" ON audit.logs
  FOR INSERT
  WITH CHECK (true);

-- Create a policy for users to view their own audit logs
CREATE POLICY "Users can view own audit logs" ON audit.logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a function to automatically clean old logs (optional, can be scheduled)
CREATE OR REPLACE FUNCTION audit.clean_old_logs()
RETURNS void AS $$
BEGIN
  -- Delete logs older than 1 year (adjust as needed for compliance)
  DELETE FROM audit.logs 
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create enum for action types for consistency
CREATE TYPE audit.action_type AS ENUM (
  -- Authentication Events
  'LOGIN_SUCCESS',
  'LOGIN_FAILURE',
  'LOGOUT',
  'PASSWORD_RESET_REQUESTED',
  'PASSWORD_CHANGED',
  'ACCOUNT_LOCKED',
  'OAUTH_LOGIN',
  
  -- Medical Data Access
  'MEDICAL_TIMELINE_VIEWED',
  'AI_ANALYSIS_VIEWED',
  'HEALTH_DATA_EXPORTED',
  'DOCTOR_REPORT_GENERATED',
  
  -- Medical Data Changes
  'HEALTH_ASSESSMENT_CREATED',
  'MEDICAL_INFO_UPDATED',
  'HEALTH_RECORD_DELETED',
  'MEDICAL_PHOTO_UPLOADED',
  
  -- AI Usage
  'QUICK_SCAN_PERFORMED',
  'DEEP_DIVE_STARTED',
  'DEEP_DIVE_COMPLETED',
  'PHOTO_ANALYSIS_PERFORMED',
  
  -- Account Changes
  'EMAIL_CHANGED',
  'PROFILE_UPDATED',
  'ACCOUNT_DELETED'
);

-- Add constraint to ensure action is valid
ALTER TABLE audit.logs 
ADD CONSTRAINT valid_action 
CHECK (action::audit.action_type IS NOT NULL);

-- Add comment for documentation
COMMENT ON TABLE audit.logs IS 'Audit log for tracking critical user actions and system events';
COMMENT ON COLUMN audit.logs.user_id IS 'User who performed the action (null for system events)';
COMMENT ON COLUMN audit.logs.action IS 'Type of action performed';
COMMENT ON COLUMN audit.logs.resource_type IS 'Type of resource affected (e.g., timeline, assessment, report)';
COMMENT ON COLUMN audit.logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN audit.logs.metadata IS 'Additional context about the action';