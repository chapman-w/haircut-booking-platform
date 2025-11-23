import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, LogOut, Calendar, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

export function Navbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole(user?.id);

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <Scissors className="h-5 w-5" />
            Em Blendzz
          </Link>
          
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Link to="/bookings">
                  <Button variant="ghost" size="sm">Book</Button>
                </Link>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">Admin</Button>
                  </Link>
                )}
                <Button onClick={signOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
