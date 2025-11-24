import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, LogOut, Calendar, Home, User, Settings, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { user, signOut, loading: authLoading } = useAuth();
  const userId = useMemo(() => user?.id, [user?.id]);
  const { isAdmin, loading: roleLoading } = useUserRole(userId);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show admin button until role is loaded to prevent flickering
  const showAdminButton = !roleLoading && isAdmin;

  const navLinks = !authLoading && user ? (
    <>
      <Link to="/bookings" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <Calendar className="h-4 w-4 mr-2" />
          Book
        </Button>
      </Link>
      <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
        <Button variant="ghost" size="sm" className="w-full justify-start">
          <User className="h-4 w-4 mr-2" />
          Profile
        </Button>
      </Link>
      {showAdminButton && (
        <Link to="/admin" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </Link>
      )}
      <Button onClick={() => { signOut(); setMobileMenuOpen(false); }} variant="outline" size="sm" className="w-full justify-start">
        <LogOut className="h-4 w-4 mr-2" />
        Sign Out
      </Button>
    </>
  ) : !authLoading ? (
    <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
      <Button size="sm" className="w-full">Sign In</Button>
    </Link>
  ) : null;

  return (
    <nav className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <Scissors className="h-5 w-5" />
            <span className="hidden sm:inline">EmBlendz</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {!authLoading && user ? (
              <>
                <Link to="/bookings">
                  <Button variant="ghost" size="sm">
                    <Calendar className="h-4 w-4 mr-1" />
                    Book
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-1" />
                    Profile
                  </Button>
                </Link>
                {showAdminButton && (
                  <Link to="/admin">
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Admin
                    </Button>
                  </Link>
                )}
                <Button onClick={signOut} variant="outline" size="sm">
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : !authLoading ? (
              <Link to="/auth">
                <Button size="sm">Sign In</Button>
              </Link>
            ) : null}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-2 mt-6">
                  {navLinks}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
