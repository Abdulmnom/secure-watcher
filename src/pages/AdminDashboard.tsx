import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LoginAttemptsTable } from "@/components/LoginAttemptsTable";
import { AlertBanner } from "@/components/AlertBanner";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  ArrowLeft, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  LogOut 
} from "lucide-react";

interface Stats {
  total: number;
  success: number;
  failed: number;
  suspicious: number;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [suspiciousIPs, setSuspiciousIPs] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, success: 0, failed: 0, suspicious: 0 });

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('status, is_suspicious');

      if (error) throw error;

      const total = data?.length || 0;
      const success = data?.filter(a => a.status === 'success').length || 0;
      const failed = data?.filter(a => a.status === 'failed').length || 0;
      const suspicious = data?.filter(a => a.is_suspicious).length || 0;

      setStats({ total, success, failed, suspicious });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();

    // Subscribe to realtime updates for stats
    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'login_attempts',
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSuspiciousChange = (count: number, ips: string[]) => {
    setSuspiciousCount(count);
    setSuspiciousIPs(ips);
  };

  return (
    <div className="min-h-screen relative">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      <div className="container max-w-6xl py-8 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 animate-fade-in">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link to="/">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 glow-primary">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Security Monitoring System</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/20">
              <Activity className="w-4 h-4 text-success animate-pulse" />
              <span className="text-xs font-medium text-success">LIVE</span>
            </div>
            
            {user && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">{user.email}</span>
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Alert Banner */}
        <div className="mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <AlertBanner suspiciousCount={suspiciousCount} suspiciousIPs={suspiciousIPs} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <StatsCard
            title="Total Attempts"
            value={stats.total}
            subtitle="All recorded"
            icon={Activity}
            variant="default"
          />
          <StatsCard
            title="Successful"
            value={stats.success}
            subtitle="Logged in"
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Failed"
            value={stats.failed}
            subtitle="Blocked"
            icon={XCircle}
            variant="destructive"
          />
          <StatsCard
            title="Suspicious"
            value={stats.suspicious}
            subtitle="Flagged IPs"
            icon={AlertTriangle}
            variant="warning"
          />
        </div>

        {/* Login Attempts Table */}
        <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <LoginAttemptsTable onSuspiciousChange={handleSuspiciousChange} />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center animate-fade-in" style={{ animationDelay: '250ms' }}>
          <p className="text-xs text-muted-foreground">
            Educational Security Monitoring System • Not for production use
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;
