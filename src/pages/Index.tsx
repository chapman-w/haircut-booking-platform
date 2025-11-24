import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Scissors, Calendar, Clock, ImageIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/EmBlendzz.jpg";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    const { data, error } = await supabase
      .from("gallery_images" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setGalleryImages(data);
    }
    setLoadingGallery(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Scissors className="h-8 w-8 text-accent" />
            <span className="text-2xl font-bold">EmBlendz</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Book Your Haircut
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
          </p>
          {!authLoading && (
            <>
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
            </>
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

      {/* Gallery Section */}
      {galleryImages.length > 0 && (
        <section className="container mx-auto px-4 py-12 border-t">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Our Work</h2>
              <p className="text-muted-foreground">Check out our latest cuts</p>
            </div>
            
            {loadingGallery ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
                {galleryImages.map((image) => (
                  <div 
                    key={image.id} 
                    className="aspect-square overflow-hidden bg-muted"
                  >
                    <img
                      src={image.image_url}
                      alt={image.caption || "Gallery image"}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
