import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, History as HistoryIcon, Link, Mail, LogIn, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface SecurityEvent {
  id: string;
  event_type: string;
  input_value: string | null;
  verdict: string | null;
  risk_score: number | null;
  reasons: string[] | null;
  created_at: string;
}

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('security_events')
        .select('id, event_type, input_value, verdict, risk_score, reasons, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      setEvents(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'url_analysis':
        return <Link className="h-4 w-4" />;
      case 'email_analysis':
        return <Mail className="h-4 w-4" />;
      case 'login_success':
      case 'login_failed':
        return <LogIn className="h-4 w-4" />;
      default:
        return <HistoryIcon className="h-4 w-4" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    switch (eventType) {
      case 'url_analysis':
        return 'URL Analysis';
      case 'email_analysis':
        return 'Email Analysis';
      case 'login_success':
        return 'Login Success';
      case 'login_failed':
        return 'Login Failed';
      default:
        return eventType;
    }
  };

  const analysisEvents = events.filter(e => e.event_type === 'url_analysis' || e.event_type === 'email_analysis');
  const loginEvents = events.filter(e => e.event_type === 'login_success' || e.event_type === 'login_failed');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <HistoryIcon className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">My History</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="analysis" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Analysis History ({analysisEvents.length})
              </TabsTrigger>
              <TabsTrigger value="logins" className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login Events ({loginEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="analysis">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis History</CardTitle>
                  <CardDescription>
                    Your URL and email content analysis history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {analysisEvents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No analysis history yet. Try analyzing a URL or email!
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Input</TableHead>
                          <TableHead>Verdict</TableHead>
                          <TableHead>Risk</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {analysisEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getEventIcon(event.event_type)}
                                <span className="text-sm">{getEventLabel(event.event_type)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate font-mono text-xs">
                              {event.input_value || '-'}
                            </TableCell>
                            <TableCell>
                              {event.verdict && (
                                <Badge variant={event.verdict === 'suspicious' ? 'destructive' : 'default'}>
                                  {event.verdict === 'suspicious' ? (
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                  )}
                                  {event.verdict}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <span className={`font-medium ${(event.risk_score || 0) >= 30 ? 'text-destructive' : 'text-green-500'}`}>
                                {event.risk_score ?? 0}%
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logins">
              <Card>
                <CardHeader>
                  <CardTitle>Login Events</CardTitle>
                  <CardDescription>
                    Your login activity history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loginEvents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No login events recorded yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Date & Time</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loginEvents.map((event) => (
                          <TableRow key={event.id}>
                            <TableCell>
                            <Badge variant={event.event_type === 'login_success' ? 'default' : 'destructive'}>
                                {event.event_type === 'login_success' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                )}
                                {event.event_type === 'login_success' ? 'Successful' : 'Failed'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(event.created_at), 'MMM d, yyyy HH:mm:ss')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
