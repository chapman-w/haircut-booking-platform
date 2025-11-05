import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Scissors, Calendar, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/emblendzz.jpg";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden h-[70vh] min-h-[500px]">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-primary/80 z-10" />
        <img 
          src={heroImage} 
          alt="Em Blendzz barbershop interior" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <Scissors className="h-10 w-10 text-accent" />
              <span className="text-2xl font-bold text-accent">Em Blendzz</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Fresh Cuts,<br />Easy Booking
            </h1>
            <p className="text-xl mb-8 text-white/90 max-w-lg">
              Schedule your appointment in seconds. Professional service, convenient times.
            </p>
            {user ? (
              <Link to="/bookings">
                <Button size="lg" variant="hero" className="text-lg h-14 px-8">
                  <Calendar className="h-5 w-5" />
                  Book Now
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button size="lg" variant="hero" className="text-lg h-14 px-8">
                  Get Started
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Simple Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-6">
                <span className="text-3xl font-bold text-accent">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Pick a Time</h3>
              <p className="text-muted-foreground">
                Browse available slots that fit your schedule
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-6">
                <span className="text-3xl font-bold text-accent">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Book Instantly</h3>
              <p className="text-muted-foreground">
                Secure your appointment with one click
              </p>
            </div>
            
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-accent/10 mb-6">
                <span className="text-3xl font-bold text-accent">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Get Fresh</h3>
              <p className="text-muted-foreground">
                Show up and leave looking sharp
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      {!user && (
        <section className="container mx-auto px-4 py-16 mb-20">
          <div className="max-w-3xl mx-auto bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-12 text-center text-white shadow-xl">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Book?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              Create your account and get your first appointment scheduled today.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="hero" className="text-lg h-14 px-8">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
