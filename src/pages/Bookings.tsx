import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Clock, X, Check, CalendarDays, Scissors } from "lucide-react";
import { format, isPast, isSameDay } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [bookingDetails, setBookingDetails] = useState("");
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
    } else {
      setMyBookings(bookingsData || []);
    }

    setLoading(false);
  };

  const handleBookSlotClick = (slotId: string) => {
    setSelectedSlotId(slotId);
    setBookingDialogOpen(true);
    // Pre-fill with user's profile name if available
    if (user) {
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setCustomerName(data.full_name);
          }
        });
    }
  };

  const handleBookSlot = async () => {
    if (!user || !selectedSlotId) return;

    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    // Build insert object - always include customer_name and details if provided
    const insertData: any = {
      time_slot_id: selectedSlotId,
      user_id: user.id,
      status: 'confirmed' as any, // Bookings are confirmed by default
    };

    // Always try to add customer_name and details
    if (customerName.trim()) {
      insertData.customer_name = customerName.trim();
    }
    if (bookingDetails.trim()) {
      insertData.details = bookingDetails.trim();
    }

    const { error } = await supabase.from("bookings").insert(insertData);

    if (error) {
      // If columns don't exist, show a helpful message
      if (error.message.includes("column") || error.message.includes("does not exist")) {
        toast.error("Please run the database migration to enable booking notes. Booking created without notes.");
        // Try again without the optional fields
        const { error: retryError } = await supabase.from("bookings").insert({
          time_slot_id: selectedSlotId,
          user_id: user.id,
          status: 'confirmed',
        });
        if (retryError) {
          toast.error("Failed to book appointment: " + retryError.message);
        } else {
          toast.success("Appointment booked!");
          setBookingDialogOpen(false);
          setCustomerName("");
          setBookingDetails("");
          setSelectedSlotId(null);
          fetchData();
        }
      } else {
        toast.error("Failed to book appointment: " + error.message);
      }
    } else {
      toast.success("Appointment booked!");
      setBookingDialogOpen(false);
      setCustomerName("");
      setBookingDetails("");
      setSelectedSlotId(null);
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
            <Scissors className="h-6 w-6 text-accent" />
            <h1 className="text-3xl md:text-4xl font-bold">Book Your Appointment</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Choose from available time slots and manage your bookings
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Available Slots */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Available Time Slots
                </CardTitle>
                <CardDescription>
                  Select a time that works best for you
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Date Filter */}
                {Object.keys(groupedSlots).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b overflow-x-auto">
                    <Button
                      variant={selectedDate === null ? "default" : "outline"}
                      onClick={() => setSelectedDate(null)}
                      size="sm"
                    >
                      All Dates
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
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <Card className="p-8 border-dashed">
                    <div className="text-center">
                      <CalendarDays className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground font-medium">No slots available</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Check back later for new appointment times
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {uniqueDates.map((date) => (
                      <div key={date} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-accent" />
                          <h3 className="font-semibold text-lg">
                            {format(new Date(date), "EEEE, MMMM d")}
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {groupedSlots[date].map((slot) => (
                            <Button
                              key={slot.id}
                              onClick={() => handleBookSlotClick(slot.id)}
                              disabled={loading}
                              variant="hero"
                              className="h-12 text-base font-medium"
                            >
                              <Clock className="h-4 w-4" />
                              {format(new Date(slot.start_time), "h:mm a")}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Your Bookings */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-accent" />
                  Your Bookings
                </CardTitle>
                <CardDescription>
                  {myBookings.length > 0 
                    ? `${myBookings.length} ${myBookings.length === 1 ? 'appointment' : 'appointments'}`
                    : 'No upcoming appointments'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                ) : myBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">No bookings yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Book your first appointment to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myBookings.map((booking) => {
                      const isPastBooking = isPast(new Date(booking.time_slots.end_time));
                      const bookingDate = new Date(booking.time_slots.start_time);
                      return (
                        <Card 
                          key={booking.id} 
                          className={`p-4 transition-all ${
                            isPastBooking ? 'opacity-60' : 'hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={isPastBooking ? "secondary" : "default"}>
                                  {isPastBooking ? "Past" : "Upcoming"}
                                </Badge>
                              </div>
                              <div className="text-base font-semibold mb-1">
                                {format(bookingDate, "MMM d, yyyy")}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {format(bookingDate, "h:mm a")}
                              </div>
                            </div>
                          </div>
                          {!isPastBooking && (
                            <Button
                              onClick={() => handleCancelBooking(booking.id)}
                              variant="outline"
                              size="sm"
                              className="w-full mt-3"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel Booking
                            </Button>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Please provide your name and any additional details for this appointment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Your Name *</Label>
              <Input
                id="customer-name"
                placeholder="Enter your name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-details">Additional Details (Optional)</Label>
              <Textarea
                id="booking-details"
                placeholder="Any special requests or notes for the barber..."
                value={bookingDetails}
                onChange={(e) => setBookingDetails(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBookSlot} variant="hero" disabled={!customerName.trim()}>
              Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
