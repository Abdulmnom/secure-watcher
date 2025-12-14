import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Shield, Activity, CheckCircle, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

interface Alert {
  id: string;
  alert_type: string;
  severity: "low" | "medium" | "high";
  message: string;
  related_user_id: string | null;
  related_ip: string | null;
  resolved: boolean;
  created_at: string;
}

interface AlertsPanelProps {
  className?: string;
}

const severityConfig = {
  low: { color: "text-muted-foreground", bg: "bg-muted/50", border: "border-muted" },
  medium: { color: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  high: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
};

export function AlertsPanel({ className }: AlertsPanelProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts((data || []) as Alert[]);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({ resolved: true })
        .eq("id", alertId);

      if (error) throw error;
      fetchAlerts();
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel("alerts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const activeAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts.filter((a) => a.resolved);

  if (activeAlerts.length === 0 && resolvedAlerts.length === 0) {
    return (
      <div className={cn("border-gradient rounded-xl p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-success/10">
            <Shield className="w-5 h-5 text-success" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Alerts</h2>
            <p className="text-xs text-muted-foreground">No alerts</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">All systems secure</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-gradient rounded-xl overflow-hidden", className)}>
      <div className="p-4 border-b border-border bg-card/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", activeAlerts.length > 0 ? "bg-warning/10" : "bg-success/10")}>
            {activeAlerts.length > 0 ? (
              <Bell className="w-5 h-5 text-warning" />
            ) : (
              <Shield className="w-5 h-5 text-success" />
            )}
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Alerts</h2>
            <p className="text-xs text-muted-foreground">
              {activeAlerts.length} active, {resolvedAlerts.length} resolved
            </p>
          </div>
        </div>
        {activeAlerts.length > 0 && (
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-warning animate-pulse" />
          </div>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {activeAlerts.map((alert) => {
          const config = severityConfig[alert.severity];
          return (
            <div
              key={alert.id}
              className={cn(
                "p-4 border-b border-border last:border-0",
                config.bg,
                "animate-fade-in"
              )}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={cn("w-5 h-5 mt-0.5", config.color)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-semibold uppercase", config.color)}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(alert.created_at), "MMM dd, HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm text-foreground mb-2">{alert.message}</p>
                  {alert.related_ip && (
                    <code className="text-xs font-mono text-muted-foreground">
                      IP: {alert.related_ip}
                    </code>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resolveAlert(alert.id)}
                  className="shrink-0"
                >
                  Resolve
                </Button>
              </div>
            </div>
          );
        })}

        {resolvedAlerts.length > 0 && (
          <div className="p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Resolved ({resolvedAlerts.length})</p>
            {resolvedAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                <CheckCircle className="w-3 h-3 text-success" />
                <span className="truncate">{alert.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}