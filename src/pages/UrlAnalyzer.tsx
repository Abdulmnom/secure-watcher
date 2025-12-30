import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { AuthNav } from "@/components/AuthNav";
import {
  Link2,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Brain,
  Cpu,
  TreePine,
} from "lucide-react";

interface AnalysisResult {
  verdict: "safe" | "suspicious";
  riskScore: number;
  reasons: string[];
  confidence?: number;
  method?: string;
  primaryMethod?: string;
  secondaryMethod?: string;
  modeUsed?: string;
}

const UrlAnalyzer = () => {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mlMethod, setMlMethod] = useState<'decision-tree' | 'gemini' | 'hybrid'>('hybrid');
  const { user } = useAuth();

  const getIpAddress = async () => {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "127.0.0.1";
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      // Call ML edge function
      const response = await supabase.functions.invoke("analyze-url-ml", {
        body: { url, mlMethod },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const analysisResult: AnalysisResult = {
        verdict: response.data.verdict,
        riskScore: response.data.riskScore,
        reasons: response.data.reasons,
        confidence: response.data.confidence,
        method: response.data.method,
        modeUsed: response.data.modeUsed,
      };
      
      setResult(analysisResult);

      // Get username from profile
      let username = null;
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("user_id", user.id)
          .maybeSingle();
        username = profile?.username || null;
      }

      // Log security event
      const ip = await getIpAddress();
      await supabase.from("security_events").insert({
        user_id: user?.id || null,
        username,
        event_type: "url_analysis" as const,
        input_value: url.substring(0, 500),
        verdict: analysisResult.verdict as 'safe' | 'suspicious',
        risk_score: analysisResult.riskScore,
        reasons: analysisResult.reasons,
        ip_address: ip,
      });

      toast({
        title: "Analysis Complete",
        description: `URL analyzed: ${analysisResult.verdict.toUpperCase()} (${analysisResult.method})`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Error",
        description: "Failed to complete analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      <div className="container max-w-3xl py-12 relative z-10">
        <nav className="flex justify-between items-center mb-8 animate-fade-in">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Link>
          </Button>
          <AuthNav />
        </nav>

        <header className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 glow-primary mb-6">
            <Link2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">URL Analyzer</h1>
          <p className="text-muted-foreground">
            Enter a URL to check for suspicious patterns and phishing indicators
          </p>
        </header>

        {/* Analysis Form */}
        <div className="border-gradient p-8 rounded-xl mb-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-foreground">URL to Analyze</Label>
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="url"
                  type="text"
                  placeholder="https://example.com/path"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                  className="pl-10 font-mono text-sm"
                  disabled={isAnalyzing}
                />
              </div>
            </div>

            {/* ML Method Selection */}
            <div className="p-4 rounded-lg bg-muted/30 border border-border">
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

            <Button
              onClick={handleAnalyze}
              variant="glow"
              size="lg"
              className="w-full"
              disabled={isAnalyzing || !url.trim()}
            >
              {isAnalyzing ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Analyze URL
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div
            className={`border-gradient p-8 rounded-xl animate-fade-in ${
              result.verdict === "suspicious" ? "glow-warning" : "glow-success"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {result.verdict === "suspicious" ? (
                  <div className="p-3 rounded-lg bg-warning/10">
                    <ShieldAlert className="w-8 h-8 text-warning" />
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-success/10">
                    <ShieldCheck className="w-8 h-8 text-success" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    {result.verdict === "suspicious" ? "Suspicious URL" : "Safe URL"}
                  </h2>
                  <p className="text-muted-foreground">Analysis complete</p>
                </div>
              </div>
              
              {/* Analysis Method Badge */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                result.method === 'ml-ai' || result.method === 'hybrid-tree+gemini'
                  ? 'bg-primary/10 text-primary'
                  : result.method === 'decision-tree' || result.method === 'hybrid-tree'
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {result.method === 'ml-ai' || result.method === 'hybrid-tree+gemini' ? (
                  <Brain className="w-3 h-3" />
                ) : result.method === 'decision-tree' || result.method === 'hybrid-tree' ? (
                  <TreePine className="w-3 h-3" />
                ) : (
                  <Cpu className="w-3 h-3" />
                )}
                Mode: {result.modeUsed} | Method: {result.method === 'ml-ai' ? 'Gemini AI' :
                 result.method === 'decision-tree' ? 'Decision Tree' :
                 result.method === 'hybrid-tree' ? 'Hybrid (Tree)' :
                 result.method === 'hybrid-tree+gemini' ? 'Hybrid (Tree+Gemini)' : 'Rule-based'}
              </div>
            </div>

            {/* Risk Score */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Risk Score</span>
                <div className="flex items-center gap-3">
                  {result.confidence !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </span>
                  )}
                  <span
                    className={`text-lg font-bold ${
                      result.riskScore >= 50
                        ? "text-destructive"
                        : result.riskScore >= 30
                        ? "text-warning"
                        : "text-success"
                    }`}
                  >
                    {result.riskScore}/100
                  </span>
                </div>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    result.riskScore >= 50
                      ? "bg-destructive"
                      : result.riskScore >= 30
                      ? "bg-warning"
                      : "bg-success"
                  }`}
                  style={{ width: `${result.riskScore}%` }}
                />
              </div>
            </div>

            {/* Reasons */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">Analysis Details</h3>
              <ul className="space-y-2">
                {result.reasons.map((reason, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    {result.verdict === "suspicious" ? (
                      <XCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                    )}
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border animate-fade-in" style={{ animationDelay: "200ms" }}>
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">How It Works</h3>
              <p className="text-xs text-muted-foreground">
                Choose your analysis method: Decision Tree for fast rule-based detection, Gemini AI for advanced pattern recognition, or Hybrid for the best of both worlds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UrlAnalyzer;
