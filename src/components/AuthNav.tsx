import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, LogIn, LogOut, User } from "lucide-react";

export function AuthNav() {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <div className="flex items-center gap-3">
      {user ? (
        <>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground truncate max-w-[150px]">{user.email}</span>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary">
                Admin
              </span>
            )}
          </div>
          
          {isAdmin && (
            <Button variant="glow" size="sm" asChild>
              <Link to="/admin">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            </Button>
          )}
          
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </>
      ) : (
        <Button variant="glow" size="sm" asChild>
          <Link to="/auth">
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        </Button>
      )}
    </div>
  );
}
