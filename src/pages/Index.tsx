import { useState } from "react";
import { Link } from "react-router-dom";
import { LoginSimulator } from "@/components/LoginSimulator";
import { Button } from "@/components/ui/button";
import { Shield, LayoutDashboard, Terminal, Activity } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />
      
      <div className="container max-w-4xl py-12 relative z-10">
        {/* Header */}
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 glow-primary mb-6">
            <Shield className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-3">
            Security Monitoring System
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A simple intrusion detection system for learning purposes. 
            Simulate login attempts and detect suspicious activity.
          </p>
        </header>

        {/* Navigation */}
        <nav className="flex justify-center gap-4 mb-12 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <Button variant="glow" size="lg" asChild>
            <Link to="/admin">
              <LayoutDashboard className="w-5 h-5" />
              Admin Dashboard
            </Link>
          </Button>
        </nav>

        {/* Main Content */}
        <div className="grid gap-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Login Simulator */}
          <LoginSimulator />

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
                  <h3 className="font-medium text-foreground">Simulate Login</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Click "Login Success" or "Login Failed" to simulate login attempts from random IP addresses.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">2</span>
                  <h3 className="font-medium text-foreground">Detection Logic</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  The system tracks failed attempts. 3+ failures from the same IP in 5 minutes triggers an alert.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">3</span>
                  <h3 className="font-medium text-foreground">View Dashboard</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Check the Admin Dashboard to see all attempts, suspicious IPs, and real-time alerts.
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
