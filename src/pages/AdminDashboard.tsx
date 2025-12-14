import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SecurityEventsTable } from "@/components/SecurityEventsTable";
import { AlertsPanel } from "@/components/AlertsPanel";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import {
  Shield,
  ArrowLeft,
  Activity,
  CheckCircle,
  AlertTriangle,
  Link2,
  LogOut,
} from "lucide-react";

interface Stats {
  total: number;
  safe: number;
  suspicious: number;
  urlAnalysis: number;
}

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const [stats, setStats] = useState<Stats>({ total: 0, safe: 0, suspicious: 0, urlAnalysis: 0 });

  const handleStatsChange = (newStats: Stats) => {
    setStats(newStats);
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      <div className="container max-w-7xl py-8 relative z-10">
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
                <p className="text-sm text-muted-foreground">Security Events & Alerts</p>
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

        {/* Stats Grid */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in"
          style={{ animationDelay: "100ms" }}
        >
          <StatsCard
            title="Total Events"
            value={stats.total}
            subtitle="All recorded"
            icon={Activity}
            variant="default"
          />
          <StatsCard
            title="Safe"
            value={stats.safe}
            subtitle="Passed checks"
            icon={CheckCircle}
            variant="success"
          />
          <StatsCard
            title="Suspicious"
            value={stats.suspicious}
            subtitle="Flagged"
            icon={AlertTriangle}
            variant="warning"
          />
          <StatsCard
            title="URL Analyses"
            value={stats.urlAnalysis}
            subtitle="URLs checked"
            icon={Link2}
            variant="default"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
          {/* Events Table - 2 columns */}
          <div className="lg:col-span-2">
            <SecurityEventsTable onStatsChange={handleStatsChange} />
          </div>

          {/* Alerts Panel - 1 column */}
          <div>
            <AlertsPanel />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          <p className="text-xs text-muted-foreground">
            Educational Security Monitoring System • Not for production use
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;