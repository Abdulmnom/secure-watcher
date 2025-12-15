import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mail, Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { analyzeEmail, EmailAnalysisResult } from "@/lib/emailAnalyzer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function EmailAnalyzer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emailContent, setEmailContent] = useState("");
  const [result, setResult] = useState<EmailAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!emailContent.trim()) {
      toast.error("Please enter email content to analyze");
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate processing delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const analysisResult = analyzeEmail(emailContent);
    setResult(analysisResult);

    // Log the security event
    try {
      const { error } = await supabase.from('security_events').insert({
        user_id: user?.id,
        username: user?.user_metadata?.username || user?.email,
        event_type: 'email_analysis' as const,
        input_value: emailContent.substring(0, 100) + (emailContent.length > 100 ? '...' : ''),
        verdict: analysisResult.verdict as 'safe' | 'suspicious',
        risk_score: analysisResult.riskScore,
        reasons: analysisResult.reasons,
        ip_address: 'client'
      });

      if (error) {
        console.error('Error logging security event:', error);
      }
    } catch (err) {
      console.error('Error logging event:', err);
    }

    setIsAnalyzing(false);
  };

  const handleClear = () => {
    setEmailContent("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Mail className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Email Content Analyzer</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Analyze Email Content
              </CardTitle>
              <CardDescription>
                Paste the email content below to check for phishing and scam indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste the email content here...

Example:
Dear Customer,

Your account has been suspended! Click here immediately to verify your identity and restore access. This is urgent - your account will be deleted in 24 hours!

Visit: bit.ly/verify-now

Enter your password and credit card details to confirm."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleAnalyze} 
                  disabled={isAnalyzing || !emailContent.trim()}
                  className="flex-1"
                >
                  {isAnalyzing ? "Analyzing..." : "Analyze Email"}
                </Button>
                <Button variant="outline" onClick={handleClear}>
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <Card className={result.verdict === 'suspicious' ? 'border-destructive' : 'border-green-500'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.verdict === 'suspicious' ? (
                    <>
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <span className="text-destructive">Suspicious Email Detected</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-500">Email Appears Safe</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Risk Score</span>
                    <span className="text-sm font-bold">{result.riskScore}/100</span>
                  </div>
                  <Progress 
                    value={result.riskScore} 
                    className={result.riskScore >= 30 ? '[&>div]:bg-destructive' : '[&>div]:bg-green-500'}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Verdict</h4>
                  <Badge variant={result.verdict === 'suspicious' ? 'destructive' : 'default'}>
                    {result.verdict.toUpperCase()}
                  </Badge>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Analysis Details</h4>
                  <ul className="space-y-1">
                    {result.reasons.map((reason, index) => (
                      <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className={result.verdict === 'suspicious' ? 'text-destructive' : 'text-green-500'}>•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-base">What We Check For</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <li>• Urgent/threatening language</li>
                <li>• Requests for sensitive info</li>
                <li>• Shortened/suspicious links</li>
                <li>• Common scam phrases</li>
                <li>• Generic greetings</li>
                <li>• Excessive punctuation</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
