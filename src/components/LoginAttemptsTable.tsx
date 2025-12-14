import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { RefreshCw, Clock, Globe, CheckCircle, XCircle, AlertTriangle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LoginAttempt {
  id: string;
  email: string | null;
  ip_address: string;
  status: 'success' | 'failed';
  is_suspicious: boolean;
  created_at: string;
}

interface LoginAttemptsTableProps {
  onSuspiciousChange: (count: number, ips: string[]) => void;
}

export function LoginAttemptsTable({ onSuspiciousChange }: LoginAttemptsTableProps) {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAttempts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const typedData = (data || []) as LoginAttempt[];
      setAttempts(typedData);

      // Calculate suspicious stats
      const suspiciousAttempts = typedData.filter(a => a.is_suspicious);
      const suspiciousIPs = [...new Set(suspiciousAttempts.map(a => a.ip_address))];
      onSuspiciousChange(suspiciousAttempts.length, suspiciousIPs);
    } catch (error) {
      console.error('Error fetching attempts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('login-attempts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'login_attempts',
        },
        () => {
          fetchAttempts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="border-gradient rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Login Attempts Log</h2>
            <p className="text-xs text-muted-foreground">{attempts.length} recent attempts</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchAttempts}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  IP Address
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timestamp
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">Status</TableHead>
              <TableHead className="text-muted-foreground font-medium">Alert</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attempts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading attempts...
                    </div>
                  ) : (
                    "No login attempts recorded yet. Try signing in!"
                  )}
                </TableCell>
              </TableRow>
            ) : (
              attempts.map((attempt, index) => (
                <TableRow
                  key={attempt.id}
                  className={cn(
                    "border-border transition-colors animate-fade-in",
                    attempt.is_suspicious && "bg-warning/5 hover:bg-warning/10",
                    !attempt.is_suspicious && "hover:bg-secondary/50"
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <TableCell className="text-sm text-foreground">
                    {attempt.email || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-foreground">
                    {attempt.ip_address}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(attempt.created_at), "MMM dd, HH:mm:ss")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {attempt.status === 'success' ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-success" />
                          <span className="text-sm font-medium text-success">Success</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-destructive" />
                          <span className="text-sm font-medium text-destructive">Failed</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {attempt.is_suspicious ? (
                      <div className="flex items-center gap-2 text-warning">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase">Suspicious</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
