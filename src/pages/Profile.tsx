import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, X, User, Scissors } from "lucide-react";
import { format, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

interface Booking {
  id: string;
  time_slot_id: string;
  time_slots: TimeSlot;
  customer_name?: string;
  details?: string;
}

export default function Profile() {
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for auth to finish loading before checking user
    if (authLoading) {
      return;
    }
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Get user profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user?.id)
      .single();
    
    if (profileData) {
      setProfile(profileData);
    }

    // Get user bookings (only confirmed)
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        time_slot_id,
        status,
        time_slots (
          id,
          start_time,
          end_time,
          is_booked
        )
      `)
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (bookingsError) {
      toast.error("Failed to load your bookings");
      setMyBookings([]);
    } else {
      // Try to get customer_name and details if columns exist
      const bookingsWithDetails = await Promise.all(
        (bookingsData || []).map(async (booking: any) => {
          let customerName = null;
          let details = null;

          try {
            const response = await supabase
              .from("bookings")
              .select("*")
              .eq("id", booking.id)
              .single();
            
            if (response.data) {
              const bookingData = response.data as any;
              customerName = bookingData.customer_name || null;
              details = bookingData.details || null;
            }
          } catch (e) {
            // Columns don't exist yet, continue without them
          }

          return {
            ...booking,
            customer_name: customerName,
            details: details,
          };
        })
      );
      setMyBookings(bookingsWithDetails);
    }

    setLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    const { error } = await supabase.from("bookings").delete().eq("id", bookingId);

    if (error) {
      toast.error("Failed to cancel booking");
    } else {
      toast.success("Booking cancelled");
      fetchData();
    }
  };

  // Filter to only show upcoming bookings
  const upcomingBookings = myBookings.filter(booking => {
    return !isPast(new Date(booking.time_slots.end_time));
  });

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <User className="h-6 w-6 text-accent" />
            <h1 className="text-3xl md:text-4xl font-bold">My Profile</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            View your profile and upcoming appointments
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-accent" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Name</div>
                    <div className="text-base font-medium">{profile.full_name}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Email</div>
                    <div className="text-base font-medium">{user.email}</div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">Loading profile...</div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Booking Summary
              </CardTitle>
              <CardDescription>
                Your appointment statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Upcoming Appointments</span>
                    <span className="text-lg font-semibold">{upcomingBookings.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Bookings</span>
                    <span className="text-lg font-semibold">{myBookings.length}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Bookings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              Upcoming Appointments
            </CardTitle>
            <CardDescription>
              Your scheduled appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground font-medium mb-2">No upcoming appointments</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Book your first appointment to get started
                </p>
                <Button onClick={() => navigate("/bookings")} variant="hero">
                  <Scissors className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => {
                  const bookingDate = new Date(booking.time_slots.start_time);
                  return (
                    <Card 
                      key={booking.id} 
                      className="p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="default">Upcoming</Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(bookingDate, "EEEE, MMMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-base font-semibold mb-2">
                            <Clock className="h-4 w-4 text-accent" />
                            {format(bookingDate, "h:mm a")} - {format(new Date(booking.time_slots.end_time), "h:mm a")}
                          </div>
                          {booking.details && (
                            <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded-md">
                              <span className="font-medium">Notes: </span>
                              {booking.details}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={() => handleCancelBooking(booking.id)}
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

