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

  const uniqueDates = Object.keys(groupedSlots).map(dateStr => new Date(dateStr));

  const filteredSlots = selectedDate
    ? availableSlots.filter(slot => 
        isSameDay(new Date(slot.start_time), selectedDate)
      )
    : availableSlots;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Book Your Cut</h1>
          <p className="text-muted-foreground text-lg">Choose a time that works for you</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Available Slots - Takes 2 columns */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <CalendarDays className="h-6 w-6 text-accent" />
                    Available Times
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {filteredSlots.length} slots available
                  </CardDescription>
                </div>
                {selectedDate && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedDate(null)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Filter
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading slots...</p>
                </div>
              ) : uniqueDates.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground text-lg">No available slots at the moment</p>
                  <p className="text-sm text-muted-foreground mt-2">Check back soon!</p>
                </div>
              ) : (
                <div>
                  {/* Date Filter Pills */}
                  {!selectedDate && (
                    <div className="mb-6">
                      <p className="text-sm font-medium mb-3">Filter by date:</p>
                      <div className="flex flex-wrap gap-2">
                        {uniqueDates.map((date) => (
                          <Button
                            key={date.toISOString()}
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDate(date)}
                            className="hover:bg-accent/10 hover:text-accent hover:border-accent"
                          >
                            {format(date, "MMM d")}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Slots Grid */}
                  <div className="grid sm:grid-cols-2 gap-3 max-h-[600px] overflow-y-auto pr-2">
                    {filteredSlots.map((slot) => {
                      const slotDate = new Date(slot.start_time);
                      const isToday = isSameDay(slotDate, new Date());
                      
                      return (
                        <div
                          key={slot.id}
                          className="group relative rounded-xl border-2 bg-card p-4 hover:border-accent/50 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="font-semibold text-lg mb-1">
                                {format(slotDate, "EEEE, MMM d")}
                              </div>
                              {isToday && (
                                <span className="inline-block text-xs font-medium text-accent bg-accent/10 px-2 py-1 rounded-full">
                                  Today
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground mb-4">
                            <Clock className="h-4 w-4 text-accent" />
                            <span className="font-medium">
                              {format(slotDate, "h:mm a")} - {format(new Date(slot.end_time), "h:mm a")}
                            </span>
                          </div>
                          <Button 
                            variant="hero" 
                            className="w-full"
                            onClick={() => handleBookSlot(slot.id)}
                          >
                            <Check className="h-4 w-4" />
                            Book This Time
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Bookings - Takes 1 column */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Check className="h-5 w-5 text-accent" />
                My Appointments
              </CardTitle>
              <CardDescription>
                {myBookings.length} {myBookings.length === 1 ? 'booking' : 'bookings'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
                </div>
              ) : myBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No bookings yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Book your first appointment!</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {myBookings.map((booking) => {
                    const bookingDate = new Date(booking.time_slots.start_time);
                    const isPastBooking = isPast(bookingDate);
                    
                    return (
                      <div
                        key={booking.id}
                        className={`rounded-lg border-2 p-4 ${
                          isPastBooking 
                            ? 'bg-muted/30 border-muted opacity-60' 
                            : 'bg-accent/5 border-accent/30'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-semibold mb-1">
                              {format(bookingDate, "MMM d, yyyy")}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(bookingDate, "h:mm a")}
                            </div>
                          </div>
                          {!isPastBooking && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelBooking(booking.id)}
                              className="hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {isPastBooking && (
                          <span className="inline-block text-xs text-muted-foreground mt-2">
                            Completed
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
