import { AlertTriangle, Shield, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  suspiciousCount: number;
  suspiciousIPs: string[];
}

export function AlertBanner({ suspiciousCount, suspiciousIPs }: AlertBannerProps) {
  if (suspiciousCount === 0) {
    return (
      <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-4 animate-fade-in">
        <div className="p-2 rounded-lg bg-success/20">
          <Shield className="w-5 h-5 text-success" />
        </div>
        <div>
          <h3 className="font-medium text-success">System Secure</h3>
          <p className="text-sm text-muted-foreground">No suspicious activity detected</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Activity className="w-4 h-4 text-success animate-pulse" />
          <span className="text-xs text-success font-mono">MONITORING</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 rounded-xl border flex items-start gap-4 animate-fade-in",
      "bg-warning/10 border-warning/30 animate-pulse-glow"
    )}>
      <div className="p-2 rounded-lg bg-warning/20">
        <AlertTriangle className="w-5 h-5 text-warning" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-warning">
          ⚠️ Suspicious Activity Detected
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {suspiciousCount} suspicious attempt{suspiciousCount > 1 ? 's' : ''} detected from {suspiciousIPs.length} IP{suspiciousIPs.length > 1 ? 's' : ''}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {suspiciousIPs.slice(0, 5).map((ip) => (
            <code
              key={ip}
              className="px-2 py-1 rounded bg-warning/20 text-warning text-xs font-mono"
            >
              {ip}
            </code>
          ))}
          {suspiciousIPs.length > 5 && (
            <span className="px-2 py-1 text-xs text-muted-foreground">
              +{suspiciousIPs.length - 5} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
