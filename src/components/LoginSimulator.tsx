import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";

// Generate a simulated IP address
const generateRandomIP = () => {
  // Use a few recurring IPs to demonstrate suspicious activity detection
  const commonIPs = [
    "192.168.1.100",
    "10.0.0.55",
    "172.16.0.42",
    "192.168.1.100", // Duplicate to increase chance of repeated IP
  ];
  
  // 60% chance to use a common IP (to demo suspicious activity)
  if (Math.random() < 0.6) {
    return commonIPs[Math.floor(Math.random() * commonIPs.length)];
  }
  
  // Generate random IP
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};

export function LoginSimulator() {
  const [isLoading, setIsLoading] = useState<'success' | 'failed' | null>(null);
  const [lastAttempt, setLastAttempt] = useState<{ ip: string; status: string } | null>(null);

  const simulateLogin = async (status: 'success' | 'failed') => {
    setIsLoading(status);
    const ip = generateRandomIP();

    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .insert({
          ip_address: ip,
          status: status,
        })
        .select()
        .single();

      if (error) throw error;

      setLastAttempt({ ip, status });

      if (data.is_suspicious) {
        toast({
          title: "⚠️ Suspicious Activity Detected!",
          description: `Multiple failed attempts from IP: ${ip}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: status === 'success' ? "Login Successful" : "Login Failed",
          description: `Attempt from IP: ${ip}`,
        });
      }
    } catch (error) {
      console.error('Error recording login attempt:', error);
      toast({
        title: "Error",
        description: "Failed to record login attempt",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="border-gradient p-8 rounded-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Login Simulator</h2>
          <p className="text-sm text-muted-foreground">Simulate login attempts to test detection</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Button
          variant="success"
          size="lg"
          onClick={() => simulateLogin('success')}
          disabled={isLoading !== null}
          className="w-full"
        >
          {isLoading === 'success' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <CheckCircle />
          )}
          Login Success
        </Button>

        <Button
          variant="destructive"
          size="lg"
          onClick={() => simulateLogin('failed')}
          disabled={isLoading !== null}
          className="w-full"
        >
          {isLoading === 'failed' ? (
            <Loader2 className="animate-spin" />
          ) : (
            <XCircle />
          )}
          Login Failed
        </Button>
      </div>

      {lastAttempt && (
        <div className="p-4 rounded-lg bg-secondary/50 animate-fade-in">
          <p className="text-sm text-muted-foreground mb-1">Last Attempt:</p>
          <div className="flex items-center gap-3">
            <span className={`status-dot ${lastAttempt.status === 'success' ? 'status-success' : 'status-failed'}`} />
            <code className="font-mono text-sm text-foreground">{lastAttempt.ip}</code>
            <span className={`text-sm font-medium ${lastAttempt.status === 'success' ? 'text-success' : 'text-destructive'}`}>
              {lastAttempt.status.toUpperCase()}
            </span>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong className="text-warning">Detection Rule:</strong> 3+ failed attempts from the same IP within 5 minutes triggers a suspicious activity alert.
        </p>
      </div>
    </div>
  );
}
