import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, LogOut, Calendar, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  return (
    <nav className="border-b bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Scissors className="h-6 w-6 text-accent" />
            <span>Em Blendzz</span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/">
                  <Button variant="ghost" size="sm">
                    <Home className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                {isAdmin ? (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <Calendar className="h-4 w-4" />
                      Manage Slots
                    </Button>
                  </Link>
                ) : (
                  <Link to="/bookings">
                    <Button variant="ghost" size="sm">
                      <Calendar className="h-4 w-4" />
                      My Bookings
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="hero" size="sm">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
