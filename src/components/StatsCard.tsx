import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

const variantStyles = {
  default: {
    bg: 'bg-primary/10',
    text: 'text-primary',
    glow: 'glow-primary',
  },
  success: {
    bg: 'bg-success/10',
    text: 'text-success',
    glow: 'glow-success',
  },
  warning: {
    bg: 'bg-warning/10',
    text: 'text-warning',
    glow: 'glow-warning',
  },
  destructive: {
    bg: 'bg-destructive/10',
    text: 'text-destructive',
    glow: 'glow-destructive',
  },
};

export function StatsCard({ title, value, subtitle, icon: Icon, variant = 'default' }: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="border-gradient p-5 rounded-xl animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className={cn("text-3xl font-bold", styles.text)}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", styles.bg, styles.glow)}>
          <Icon className={cn("w-5 h-5", styles.text)} />
        </div>
      </div>
    </div>
  );
}
