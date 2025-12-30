import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Shield, AlertTriangle, CheckCircle, Brain, Cpu, TreePine } from "lucide-react";
import { analyzeEmail, EmailAnalysisResult } from "@/lib/emailAnalyzer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MLAnalysisResult extends EmailAnalysisResult {
  method?: 'rule-based' | 'ml-ai' | 'decision-tree' | 'hybrid-tree' | 'hybrid-tree+gemini';
  confidence?: number;
  primaryMethod?: string;
  secondaryMethod?: string;
  modeUsed?: string;
}

export default function EmailAnalyzer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emailContent, setEmailContent] = useState("");
  const [result, setResult] = useState<MLAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mlMethod, setMlMethod] = useState<'decision-tree' | 'gemini' | 'hybrid'>('hybrid');

  const handleAnalyze = async () => {
    if (!emailContent.trim()) {
      toast.error("Please enter email content to analyze");
      return;
    }

    setIsAnalyzing(true);
    
    let analysisResult: MLAnalysisResult;

    try {
      // Call the ML backend endpoint
      const { data, error } = await supabase.functions.invoke('analyze-email-ml', {
        body: { emailContent, mlMethod }
      });

      if (error) {
        console.error('ML analysis error:', error);
        // Fallback to client-side analysis
        const clientResult = analyzeEmail(emailContent);
        analysisResult = { ...clientResult, method: 'rule-based' };
        toast.warning("Using fallback analysis (ML unavailable)");
      } else {
        analysisResult = {
          verdict: data.verdict,
          riskScore: data.riskScore,
          reasons: data.reasons,
          method: data.method,
          confidence: data.confidence,
          modeUsed: data.modeUsed
        };
        
        if (data.method === 'ml-ai') {
          toast.success("ML Analysis Complete");
        }
      }
    } catch (err) {
      console.error('Analysis error:', err);
      // Fallback to client-side
      const clientResult = analyzeEmail(emailContent);
      analysisResult = { ...clientResult, method: 'rule-based' };
    }

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
              <div className="p-3 bg-muted/50 rounded-lg">
                <Label className="text-sm font-medium mb-3 block">Analysis Method</Label>
                <RadioGroup value={mlMethod} onValueChange={(value) => setMlMethod(value as typeof mlMethod)} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="decision-tree" id="tree" />
                    <Label htmlFor="tree" className="flex items-center gap-1 text-sm">
                      <TreePine className="h-3 w-3" />
                      Decision Tree
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="gemini" id="gemini" />
                    <Label htmlFor="gemini" className="flex items-center gap-1 text-sm">
                      <Brain className="h-3 w-3" />
                      Gemini AI
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hybrid" id="hybrid" />
                    <Label htmlFor="hybrid" className="flex items-center gap-1 text-sm">
                      <Shield className="h-3 w-3" />
                      Hybrid
                    </Label>
                  </div>
                </RadioGroup>
              </div>
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

                <div className="flex gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Verdict</h4>
                    <Badge variant={result.verdict === 'suspicious' ? 'destructive' : 'default'}>
                      {result.verdict.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Method</h4>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {result.method === 'ml-ai' || result.method === 'hybrid-tree+gemini' ? <Brain className="h-3 w-3" /> :
                       result.method === 'decision-tree' || result.method === 'hybrid-tree' ? <TreePine className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
                      Mode: {result.modeUsed} | Method: {result.method === 'ml-ai' ? 'Gemini AI' :
                       result.method === 'decision-tree' ? 'Decision Tree' :
                       result.method === 'hybrid-tree' ? 'Hybrid (Tree)' :
                       result.method === 'hybrid-tree+gemini' ? 'Hybrid (Tree+Gemini)' : 'Rule-Based'}
                    </Badge>
                  </div>
                  {result.confidence !== undefined && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Confidence</h4>
                      <Badge variant="secondary">
                        {Math.round(result.confidence * 100)}%
                      </Badge>
                    </div>
                  )}
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
