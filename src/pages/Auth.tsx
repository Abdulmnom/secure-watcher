import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  // Log every login attempt
  const logLoginAttempt = async (attemptEmail: string, success: boolean) => {
    try {
      // Get client IP (using a public API for demo - in production use server-side)
      let ip = "127.0.0.1";
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        ip = ipData.ip;
      } catch {
        // Use fallback IP if fetch fails
      }

      await supabase.from("login_attempts").insert({
        email: attemptEmail,
        ip_address: ip,
        status: success ? "success" : "failed",
      });
    } catch (error) {
      console.error("Failed to log login attempt:", error);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        
        if (error) {
          await logLoginAttempt(email, false);
          
          let message = "An error occurred during login";
          if (error.message.includes("Invalid login credentials")) {
            message = "Invalid email or password";
          } else if (error.message.includes("Email not confirmed")) {
            message = "Please confirm your email address";
          }
          
          toast({
            title: "Login Failed",
            description: message,
            variant: "destructive",
          });
        } else {
          await logLoginAttempt(email, true);
          toast({
            title: "Welcome back!",
            description: "Login successful",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password);
        
        if (error) {
          let message = "An error occurred during signup";
          if (error.message.includes("already registered")) {
            message = "This email is already registered";
          }
          
          toast({
            title: "Signup Failed",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Created!",
            description: "You can now log in with your credentials",
          });
          setIsLogin(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Scanlines overlay */}
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 glow-primary mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Sign in to access the security dashboard" : "Sign up to get started"}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="border-gradient p-8 rounded-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="glow"
            size="lg"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Sign Up"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            <strong className="text-warning">Note:</strong> Every login attempt is logged for security monitoring purposes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
