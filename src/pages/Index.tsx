import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Scissors, Calendar, Clock, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/barber-hero.jpg";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-secondary/10">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 z-10" />
        <img 
          src={heroImage} 
          alt="Premium barbershop interior" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 container mx-auto px-4 py-24 md:py-32">
          <div className="max-w-2xl text-white">
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="h-8 w-8 text-accent" />
              <span className="text-accent font-semibold">Premium Cuts</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Where Style Meets Excellence
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Book your next haircut with ease. Professional service, convenient scheduling, 
              and a look that turns heads.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {user ? (
                <Link to="/bookings">
                  <Button size="lg" variant="hero" className="text-lg">
                    <Calendar className="h-5 w-5" />
                    Book Appointment
                  </Button>
                </Link>
              ) : (
                <Link to="/auth">
                  <Button size="lg" variant="hero" className="text-lg">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why Choose Premium Cuts?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <Calendar className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
            <p className="text-muted-foreground">
              View available slots and book your appointment in seconds. No phone calls needed.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <Scissors className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Expert Service</h3>
            <p className="text-muted-foreground">
              Professional haircuts tailored to your style with years of experience.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-xl bg-card border border-border hover:shadow-lg transition-shadow">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
              <Clock className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Flexible Hours</h3>
            <p className="text-muted-foreground">
              Choose from a variety of time slots that fit your busy schedule.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="container mx-auto px-4 py-16">
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready for Your Best Look?
            </h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Create your account today and book your first appointment. 
              Join our community of satisfied clients.
            </p>
            <Link to="/auth">
              <Button size="lg" variant="hero" className="text-lg">
                Sign Up Now
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
