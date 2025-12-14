import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  RefreshCw, 
  Clock, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Link2,
  Mail,
  LogIn,
  Filter,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type EventType = "url_analysis" | "email_analysis" | "login_success" | "login_failed";
type VerdictType = "safe" | "suspicious";

interface SecurityEvent {
  id: string;
  user_id: string | null;
  username: string | null;
  event_type: EventType;
  input_value: string | null;
  verdict: VerdictType | null;
  risk_score: number | null;
  reasons: string[] | null;
  ip_address: string;
  created_at: string;
}

interface SecurityEventsTableProps {
  onStatsChange: (stats: {
    total: number;
    safe: number;
    suspicious: number;
    urlAnalysis: number;
  }) => void;
}

const eventTypeConfig: Record<EventType, { icon: typeof Link2; label: string; color: string }> = {
  url_analysis: { icon: Link2, label: "URL Analysis", color: "text-primary" },
  email_analysis: { icon: Mail, label: "Email Analysis", color: "text-accent-foreground" },
  login_success: { icon: LogIn, label: "Login Success", color: "text-success" },
  login_failed: { icon: XCircle, label: "Login Failed", color: "text-destructive" },
};

export function SecurityEventsTable({ onStatsChange }: SecurityEventsTableProps) {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterVerdict, setFilterVerdict] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("security_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []) as SecurityEvent[];
      setEvents(typedData);

      // Calculate stats
      const total = typedData.length;
      const safe = typedData.filter((e) => e.verdict === "safe").length;
      const suspicious = typedData.filter((e) => e.verdict === "suspicious").length;
      const urlAnalysis = typedData.filter((e) => e.event_type === "url_analysis").length;

      onStatsChange({ total, safe, suspicious, urlAnalysis });
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    const channel = supabase
      .channel("security-events-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "security_events",
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredEvents = events.filter((event) => {
    if (filterType !== "all" && event.event_type !== filterType) return false;
    if (filterVerdict !== "all" && event.verdict !== filterVerdict) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        event.ip_address.toLowerCase().includes(search) ||
        event.username?.toLowerCase().includes(search) ||
        event.input_value?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  return (
    <div className="border-gradient rounded-xl overflow-hidden">
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Security Events Log</h2>
              <p className="text-xs text-muted-foreground">{filteredEvents.length} events</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="url_analysis">URL Analysis</SelectItem>
                  <SelectItem value="email_analysis">Email Analysis</SelectItem>
                  <SelectItem value="login_success">Login Success</SelectItem>
                  <SelectItem value="login_failed">Login Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterVerdict} onValueChange={setFilterVerdict}>
                <SelectTrigger className="w-[130px] h-8">
                  <SelectValue placeholder="Verdict" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verdicts</SelectItem>
                  <SelectItem value="safe">Safe</SelectItem>
                  <SelectItem value="suspicious">Suspicious</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Search IP/User..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[150px] h-8"
            />
            <Button variant="outline" size="sm" onClick={fetchEvents} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground font-medium">Type</TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  User
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  IP Address
                </div>
              </TableHead>
              <TableHead className="text-muted-foreground font-medium">Input</TableHead>
              <TableHead className="text-muted-foreground font-medium">Verdict</TableHead>
              <TableHead className="text-muted-foreground font-medium">Risk</TableHead>
              <TableHead className="text-muted-foreground font-medium">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Time
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Loading events...
                    </div>
                  ) : (
                    "No security events recorded yet."
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event, index) => {
                const config = eventTypeConfig[event.event_type];
                const EventIcon = config.icon;

                return (
                  <TableRow
                    key={event.id}
                    className={cn(
                      "border-border transition-colors animate-fade-in",
                      event.verdict === "suspicious" && "bg-warning/5 hover:bg-warning/10",
                      event.verdict !== "suspicious" && "hover:bg-secondary/50"
                    )}
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EventIcon className={cn("w-4 h-4", config.color)} />
                        <span className="text-xs font-medium text-foreground">{config.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {event.username || <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-foreground">
                      {event.ip_address}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {event.input_value ? (
                        <span className="text-xs text-muted-foreground truncate block" title={event.input_value}>
                          {event.input_value.length > 40
                            ? event.input_value.substring(0, 40) + "..."
                            : event.input_value}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.verdict === "suspicious" ? (
                        <div className="flex items-center gap-1.5 text-warning">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Suspicious</span>
                        </div>
                      ) : event.verdict === "safe" ? (
                        <div className="flex items-center gap-1.5 text-success">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">Safe</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {event.risk_score !== null ? (
                        <span
                          className={cn(
                            "text-sm font-mono font-medium",
                            event.risk_score >= 50
                              ? "text-destructive"
                              : event.risk_score >= 30
                              ? "text-warning"
                              : "text-success"
                          )}
                        >
                          {event.risk_score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(event.created_at), "MMM dd, HH:mm:ss")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}