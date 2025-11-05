import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, Trash2, CheckCircle } from "lucide-react";
import { format } from "date-fns";

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
}

export default function Bookings() {
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch available slots
    const { data: slotsData, error: slotsError } = await supabase
      .from("time_slots")
      .select("*")
      .eq("is_booked", false)
      .gte("start_time", new Date().toISOString())
      .order("start_time", { ascending: true });

    if (slotsError) {
      toast.error("Failed to load available slots");
    } else {
      setAvailableSlots(slotsData || []);
    }

    // Fetch user's bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id,
        time_slot_id,
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
    } else {
      setMyBookings(bookingsData || []);
    }

    setLoading(false);
  };

  const handleBookSlot = async (slotId: string) => {
    if (!user) return;

    const { error } = await supabase.from("bookings").insert({
      time_slot_id: slotId,
      user_id: user.id,
    });

    if (error) {
      toast.error("Failed to book slot");
    } else {
      toast.success("Appointment booked successfully!");
      fetchData();
    }
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Book Your Appointment</h1>
          <p className="text-muted-foreground">Choose from available time slots or manage your bookings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Available Time Slots
              </CardTitle>
              <CardDescription>
                {availableSlots.length} slots available
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : availableSlots.length === 0 ? (
                <p className="text-muted-foreground">No available slots at the moment</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 hover:bg-secondary/20 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-accent" />
                          {format(new Date(slot.start_time), "EEEE, MMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(slot.start_time), "h:mm a")} -{" "}
                          {format(new Date(slot.end_time), "h:mm a")}
                        </div>
                      </div>
                      <Button variant="hero" size="sm" onClick={() => handleBookSlot(slot.id)}>
                        Book
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-accent" />
                My Bookings
              </CardTitle>
              <CardDescription>
                {myBookings.length} upcoming appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : myBookings.length === 0 ? (
                <p className="text-muted-foreground">No bookings yet</p>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {myBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center justify-between rounded-lg border bg-accent/5 border-accent/20 p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-accent" />
                          {format(new Date(booking.time_slots.start_time), "EEEE, MMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(booking.time_slots.start_time), "h:mm a")} -{" "}
                          {format(new Date(booking.time_slots.end_time), "h:mm a")}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
