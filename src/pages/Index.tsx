import { Link } from "react-router-dom";
import { AuthNav } from "@/components/AuthNav";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Shield, Terminal, Activity, Lock, Eye, AlertTriangle, Link2, Mail, Search, User, History } from "lucide-react";

const Index = () => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen relative">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      <div className="container max-w-4xl py-12 relative z-10">
        {/* Navigation */}
        <nav className="flex justify-end mb-8 animate-fade-in">
          <AuthNav />
        </nav>

        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 glow-primary mb-6">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Security Monitoring System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A realistic intrusion detection system for learning purposes. 
            Real authentication with automatic suspicious activity detection.
          </p>
        </header>

        {/* Main Content */}
        <div className="grid gap-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Analysis Tools */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-gradient p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Link2 className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">URL Analyzer</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Check URLs for phishing patterns, suspicious keywords, and security risks.
              </p>
              <Button variant="glow" size="default" className="w-full" asChild>
                <Link to="/url-analyzer">
                  <Search className="w-4 h-4 mr-2" />
                  Analyze URL
                </Link>
              </Button>
            </div>

            <div className="border-gradient p-6 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">Email Analyzer</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Scan email content for phishing attempts and suspicious patterns.
              </p>
              <Button variant="glow" size="default" className="w-full" asChild>
                <Link to="/email-analyzer">
                  <Search className="w-4 h-4 mr-2" />
                  Analyze Email
                </Link>
              </Button>
            </div>
          </div>

          {/* User Status */}
          {user ? (
            <div className="border-gradient p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <Lock className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">Logged In</h2>
                  <p className="text-sm text-muted-foreground">All activities are logged</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/profile">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/history">
                      <History className="w-4 h-4 mr-2" />
                      History
                    </Link>
                  </Button>
                  {isAdmin && (
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/admin">
                        <Eye className="w-4 h-4 mr-2" />
                        Admin
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border-gradient p-6 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">Sign In Required</h2>
                  <p className="text-sm text-muted-foreground">Create an account to use analyzers</p>
                </div>
                <Button variant="glow" size="sm" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
              </div>
            </div>
          )}

          {/* How it works */}
          <div className="border-gradient p-8 rounded-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-accent text-accent-foreground">
                <Terminal className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">How It Works</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">1</span>
                  <h3 className="font-medium text-foreground">Real Login</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your email and password. The system validates credentials and logs every attempt.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">2</span>
                  <h3 className="font-medium text-foreground">Detection Logic</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  3+ failed attempts from the same IP in 5 minutes triggers a suspicious activity alert.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">3</span>
                  <h3 className="font-medium text-foreground">Admin Dashboard</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Admins can view all login attempts, suspicious IPs, and real-time security alerts.
                </p>
              </div>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">Built with</p>
            <div className="flex justify-center gap-6 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/30">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">React</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/30">
                <Activity className="w-4 h-4 text-success" />
                <span className="text-sm font-medium text-foreground">Lovable Cloud</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/30">
                <Activity className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium text-foreground">PostgreSQL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
