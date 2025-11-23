import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, X, Check, CalendarDays } from "lucide-react";
import { format, isPast, isSameDay } from "date-fns";

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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
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
      toast.error("Failed to book appointment");
    } else {
      toast.success("Appointment booked! 💇");
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

  // Group slots by date
  const groupedSlots = availableSlots.reduce((acc, slot) => {
    const date = new Date(slot.start_time);
    const dateKey = format(date, "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(slot);
    return acc;
  }, {} as Record<string, TimeSlot[]>);

  const uniqueDates = Object.keys(groupedSlots).filter(dateStr => {
    if (!selectedDate) return true;
    return isSameDay(new Date(dateStr), selectedDate);
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Book Appointment</h1>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Available Slots */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Available Times</h2>
            
            {/* Date Filter */}
            {Object.keys(groupedSlots).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={selectedDate === null ? "default" : "outline"}
                  onClick={() => setSelectedDate(null)}
                  size="sm"
                >
                  All
                </Button>
                {Object.keys(groupedSlots).map((date) => (
                  <Button
                    key={date}
                    variant={selectedDate && isSameDay(new Date(date), selectedDate) ? "default" : "outline"}
                    onClick={() => setSelectedDate(new Date(date))}
                    size="sm"
                  >
                    {format(new Date(date), "MMM d")}
                  </Button>
                ))}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : availableSlots.length === 0 ? (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No slots available</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {uniqueDates.map((date) => (
                  <div key={date}>
                    <h3 className="font-medium mb-2">
                      {format(new Date(date), "EEE, MMM d")}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {groupedSlots[date].map((slot) => (
                        <Button
                          key={slot.id}
                          onClick={() => handleBookSlot(slot.id)}
                          disabled={loading}
                          variant="outline"
                          className="justify-start"
                        >
                          {format(new Date(slot.start_time), "h:mm a")}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Your Bookings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Bookings</h2>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : myBookings.length === 0 ? (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground text-center">No bookings</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {myBookings.map((booking) => {
                  const isPastBooking = isPast(new Date(booking.time_slots.end_time));
                  return (
                    <Card key={booking.id} className="p-3">
                      <div className="text-sm font-medium">
                        {format(new Date(booking.time_slots.start_time), "MMM d")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(booking.time_slots.start_time), "h:mm a")}
                      </div>
                      {!isPastBooking && (
                        <Button
                          onClick={() => handleCancelBooking(booking.id)}
                          variant="outline"
                          size="sm"
                          className="w-full mt-2"
                        >
                          Cancel
                        </Button>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
