-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (device-based authentication)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  tier TEXT DEFAULT 'basic',
  duration_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation codes table
CREATE TABLE activation_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_by UUID REFERENCES users(id),
  tier TEXT DEFAULT 'basic',
  duration_days INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Quiz history table
CREATE TABLE quiz_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_questions INTEGER DEFAULT 25,
  correct_count INTEGER DEFAULT 0,
  score_percent NUMERIC(5,2),
  passed BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_device_id ON users(device_id);
CREATE INDEX idx_users_session_token ON users(session_token);
CREATE INDEX idx_activation_codes_code ON activation_codes(code);
CREATE INDEX idx_activation_codes_is_used ON activation_codes(is_used);
CREATE INDEX idx_quiz_history_user_id ON quiz_history(user_id);
CREATE INDEX idx_quiz_history_created_at ON quiz_history(created_at DESC);

-- Helper function to set device context for RLS
CREATE OR REPLACE FUNCTION set_device_context(device_id TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_device_id', device_id, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (device_id = current_setting('app.current_device_id', true));

-- RLS Policies for activation codes (admin only via service role)
CREATE POLICY "No direct access to activation codes" ON activation_codes
  FOR ALL USING (false);

-- RLS Policies for quiz history
CREATE POLICY "Users can view their own quiz history" ON quiz_history
  FOR SELECT USING (
    user_id IN (
      SELECT id FROM users WHERE device_id = current_setting('app.current_device_id', true)
    )
  );

CREATE POLICY "Users can insert their own quiz history" ON quiz_history
  FOR INSERT WITH CHECK (
    user_id IN (
      SELECT id FROM users WHERE device_id = current_setting('app.current_device_id', true)
    )
  );
