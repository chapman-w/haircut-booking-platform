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
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Scissors className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold">Em Blendzz</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Book Your Haircut
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Simple online booking for your next appointment
          </p>
          {user ? (
            <Link to="/bookings">
              <Button size="lg">
                <Calendar className="h-5 w-5" />
                Book Now
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button size="lg">
                Get Started
              </Button>
            </Link>
          )}
        </div>
      </section>

      {/* Simple Steps */}
      <section className="container mx-auto px-4 py-12 border-t">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-accent mb-2">1</div>
              <h3 className="font-semibold mb-1">Pick a Time</h3>
              <p className="text-sm text-muted-foreground">
                Choose from available slots
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent mb-2">2</div>
              <h3 className="font-semibold mb-1">Book</h3>
              <p className="text-sm text-muted-foreground">
                Confirm your appointment
              </p>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent mb-2">3</div>
              <h3 className="font-semibold mb-1">Done</h3>
              <p className="text-sm text-muted-foreground">
                Show up and get your cut
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
