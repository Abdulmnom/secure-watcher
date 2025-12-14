import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Shield, Mail, Lock, Loader2, ArrowRight, User } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).max(100),
});

const signupSchema = z.object({
  username: z.string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username must be less than 30 characters" })
    .regex(/^\S+$/, { message: "Username cannot contain spaces" }),
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  // Log security event for login attempts
  const logSecurityEvent = async (attemptEmail: string, success: boolean, attemptUsername?: string) => {
    try {
      let ip = "127.0.0.1";
      try {
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        ip = ipData.ip;
      } catch {
        // Use fallback IP
      }

      await supabase.from("security_events").insert({
        username: attemptUsername || null,
        event_type: success ? "login_success" : "login_failed",
        input_value: attemptEmail,
        verdict: success ? "safe" : null,
        ip_address: ip,
      });
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const isFormValid = () => {
    if (isLogin) {
      return email.trim() !== "" && password.trim() !== "";
    }
    return (
      username.trim().length >= 3 &&
      !username.includes(" ") &&
      email.trim() !== "" &&
      password.length >= 8 &&
      password === confirmPassword
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isLogin) {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const fieldErrors: typeof errors = {};
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof typeof errors;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    } else {
      const result = signupSchema.safeParse({ username, email, password, confirmPassword });
      if (!result.success) {
        const fieldErrors: typeof errors = {};
        result.error.errors.forEach((err) => {
          const field = err.path[0] as keyof typeof errors;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        
        if (error) {
          await logSecurityEvent(email, false);
          
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
          await logSecurityEvent(email, true);
          toast({
            title: "Welcome back!",
            description: "Login successful",
          });
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, username);
        
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
          setUsername("");
          setPassword("");
          setConfirmPassword("");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="fixed inset-0 pointer-events-none scanlines opacity-30" />

      <div className="w-full max-w-md p-8 relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-primary/10 glow-primary mb-6">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin ? "Sign in to access the security dashboard" : "Sign up to start analyzing URLs and emails"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="border-gradient p-8 rounded-xl space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="username" className="text-foreground">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="johndoe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-destructive">{errors.username}</p>
              )}
              <p className="text-xs text-muted-foreground">Min 3 characters, no spaces</p>
            </div>
          )}

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
            {!isLogin && (
              <p className="text-xs text-muted-foreground">Min 8 characters</p>
            )}
          </div>

          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            variant="success"
            size="lg"
            className="w-full"
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
          <p className="text-xs text-muted-foreground text-center">
            <strong className="text-warning">Note:</strong> All login attempts are logged for security monitoring.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;