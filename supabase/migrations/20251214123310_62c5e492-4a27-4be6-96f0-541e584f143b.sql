-- Create enum for login attempt status
CREATE TYPE public.login_status AS ENUM ('success', 'failed');

-- Create table for login attempts
CREATE TABLE public.login_attempts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT NOT NULL,
    status login_status NOT NULL,
    is_suspicious BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Create policy for public insert (simulating login attempts from anyone)
CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Create policy for public select (for demo purposes - in production this would be admin-only)
CREATE POLICY "Anyone can view login attempts"
ON public.login_attempts
FOR SELECT
USING (true);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.login_attempts;

-- Create function to check and mark suspicious activity
CREATE OR REPLACE FUNCTION public.check_suspicious_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    failed_count INTEGER;
BEGIN
    -- Count failed attempts from same IP in last 5 minutes
    SELECT COUNT(*)
    INTO failed_count
    FROM public.login_attempts
    WHERE ip_address = NEW.ip_address
      AND status = 'failed'
      AND created_at > (now() - INTERVAL '5 minutes');
    
    -- If 3 or more failed attempts (including current), mark as suspicious
    IF NEW.status = 'failed' AND failed_count >= 2 THEN
        NEW.is_suspicious := true;
        
        -- Also mark previous attempts from this IP as suspicious
        UPDATE public.login_attempts
        SET is_suspicious = true
        WHERE ip_address = NEW.ip_address
          AND created_at > (now() - INTERVAL '5 minutes');
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to check suspicious activity on insert
CREATE TRIGGER check_suspicious_on_insert
BEFORE INSERT ON public.login_attempts
FOR EACH ROW
EXECUTE FUNCTION public.check_suspicious_activity();