-- Add username column to profiles table
ALTER TABLE public.profiles ADD COLUMN username text;

-- Create unique index for username
CREATE UNIQUE INDEX profiles_username_unique ON public.profiles(username) WHERE username IS NOT NULL;

-- Create severity enum
CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high');

-- Create event_type enum
CREATE TYPE public.event_type AS ENUM ('url_analysis', 'email_analysis', 'login_success', 'login_failed');

-- Create verdict enum
CREATE TYPE public.verdict_type AS ENUM ('safe', 'suspicious');

-- Create security_events table (replaces login_attempts for unified logging)
CREATE TABLE public.security_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  username text,
  event_type public.event_type NOT NULL,
  input_value text,
  verdict public.verdict_type,
  risk_score integer CHECK (risk_score >= 0 AND risk_score <= 100),
  reasons text[],
  ip_address text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create alerts table
CREATE TABLE public.alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'medium',
  message text NOT NULL,
  related_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  related_ip text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on security_events
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Enable RLS on alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for security_events
CREATE POLICY "Users can view their own events"
ON public.security_events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
ON public.security_events
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all events"
ON public.security_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for alerts
CREATE POLICY "Admins can view all alerts"
ON public.alerts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update alerts"
ON public.alerts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- System can insert alerts (for automated detection)
CREATE POLICY "System can insert alerts"
ON public.alerts
FOR INSERT
WITH CHECK (true);

-- Update handle_new_user function to require username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, username)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'username');
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create function to check for suspicious activity and create alerts
CREATE OR REPLACE FUNCTION public.check_security_events_suspicious()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  suspicious_count INTEGER;
BEGIN
  -- Check if user has 3+ suspicious results in last 5 minutes
  IF NEW.verdict = 'suspicious' AND NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO suspicious_count
    FROM public.security_events
    WHERE user_id = NEW.user_id
      AND verdict = 'suspicious'
      AND created_at > (now() - INTERVAL '5 minutes');
    
    IF suspicious_count >= 2 THEN  -- This will be 3rd or more
      INSERT INTO public.alerts (alert_type, severity, message, related_user_id, related_ip)
      VALUES (
        'MULTIPLE_SUSPICIOUS_ACTIVITIES',
        'high',
        'User submitted 3+ suspicious content within 5 minutes',
        NEW.user_id,
        NEW.ip_address
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for suspicious activity detection
CREATE TRIGGER on_security_event_insert
  AFTER INSERT ON public.security_events
  FOR EACH ROW
  EXECUTE FUNCTION public.check_security_events_suspicious();

-- Enable realtime for security_events and alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.security_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;