import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Link2, 
  Mail, 
  User, 
  History, 
  LayoutDashboard, 
  LogIn, 
  LogOut,
  Home,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { path: "/", label: "Home", icon: Home, requireAuth: false },
    { path: "/url-analyzer", label: "URL Analyzer", icon: Link2, requireAuth: true },
    { path: "/email-analyzer", label: "Email Analyzer", icon: Mail, requireAuth: true },
    { path: "/history", label: "History", icon: History, requireAuth: true },
    { path: "/profile", label: "Profile", icon: User, requireAuth: true },
  ];

  const adminLinks = [
    { path: "/admin", label: "Admin Dashboard", icon: LayoutDashboard },
  ];

  const visibleLinks = navLinks.filter(link => !link.requireAuth || user);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
          <Shield className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">IDS Security</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {visibleLinks.map((link) => (
            <Button
              key={link.path}
              variant={isActive(link.path) ? "secondary" : "ghost"}
              size="sm"
              asChild
            >
              <Link to={link.path} className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}

          {/* Admin Links */}
          {isAdmin && adminLinks.map((link) => (
            <Button
              key={link.path}
              variant={isActive(link.path) ? "default" : "outline"}
              size="sm"
              asChild
              className="ml-2"
            >
              <Link to={link.path} className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                {user.email}
              </span>
              {isAdmin && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                  Admin
                </span>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button variant="glow" size="sm" asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Link>
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background p-4 space-y-2">
          {visibleLinks.map((link) => (
            <Button
              key={link.path}
              variant={isActive(link.path) ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start"
              asChild
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link to={link.path} className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}

          {isAdmin && adminLinks.map((link) => (
            <Button
              key={link.path}
              variant={isActive(link.path) ? "default" : "outline"}
              size="sm"
              className="w-full justify-start"
              asChild
              onClick={() => setMobileMenuOpen(false)}
            >
              <Link to={link.path} className="flex items-center gap-2">
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            </Button>
          ))}

          <div className="pt-2 border-t border-border/40">
            {user ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground px-2">{user.email}</p>
                <Button variant="outline" size="sm" className="w-full" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button variant="glow" size="sm" className="w-full" asChild>
                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
