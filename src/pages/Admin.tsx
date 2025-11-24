import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar as CalendarIcon, Clock, Trash2, Plus, Image as ImageIcon, Upload, ChevronLeft, ChevronRight, List } from "lucide-react";
import { format, startOfDay, addHours, isSameDay, parseISO, isSameMonth, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, getHours, getMinutes } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export default function Admin() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'week' | 'list'>('week');
  const slotDuration = 30; // Fixed 30 minutes
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);

  useEffect(() => {
    // Wait for both auth and role loading to complete before checking
    if (!authLoading && !roleLoading && user) {
      // Use a small timeout to ensure state has updated after roleLoading becomes false
      const timeoutId = setTimeout(() => {
        if (!isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/");
    }
      }, 100); // Small delay to allow state update

      return () => clearTimeout(timeoutId);
    } else if (!authLoading && !roleLoading && !user) {
      navigate("/auth");
    }
  }, [isAdmin, roleLoading, authLoading, navigate, user]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSlots();
      fetchBookings();
      fetchGalleryImages();
    }
  }, [user, isAdmin]);

  const fetchBookings = async () => {
    setLoadingBookings(true);
    
    // Try to select all columns including customer_name, details, and status
    let { data, error } = await supabase
      .from("bookings")
      .select(`
        id,
        created_at,
        user_id,
        customer_name,
        details,
        status,
        time_slots (
          id,
          start_time,
          end_time,
          is_booked
        )
      `)
      .order("created_at", { ascending: false }) as any;

    // If that fails (columns don't exist), try without them
    if (error && (error.message.includes("column") || error.message.includes("does not exist"))) {
      const fallbackResult = await supabase
        .from("bookings")
        .select(`
          id,
          created_at,
          user_id,
          status,
          time_slots (
            id,
            start_time,
            end_time,
            is_booked
          )
        `)
        .order("created_at", { ascending: false });
      
      data = fallbackResult.data as any;
      error = fallbackResult.error;
    }

    if (error) {
      toast.error("Failed to load bookings: " + error.message);
      setLoadingBookings(false);
      return;
    }

    // Get customer names from profiles if customer_name is missing
    const bookingsWithDetails = await Promise.all(
      (data || []).map(async (booking: any) => {
        // Preserve details from the original booking
        let details = booking.details || null;
        let customerName = booking.customer_name || null;

        // Get customer name from profiles if not in booking
        if (!customerName && booking.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", booking.user_id)
            .single();
          
          if (profile) {
            customerName = profile.full_name;
          }
        }

        return {
          ...booking,
          customer_name: customerName,
          details: details, // Explicitly preserve details
        };
      })
    );
    
    setBookings(bookingsWithDetails);
    setLoadingBookings(false);
  };

  const fetchSlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("time_slots")
      .select("*")
      .order("start_time", { ascending: true });

    if (error) {
      toast.error("Failed to load time slots");
    } else {
      setSlots(data || []);
    }
    setLoading(false);
  };

  // Generate time slots for a day (9 AM to 10 PM, 30-minute intervals)
  const generateTimeSlots = (date: Date) => {
    const slots = [];
    const startHour = 9;
    const endHour = 22; // 10 PM
    const baseDate = startOfDay(date);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotTime = addHours(baseDate, hour);
        slotTime.setMinutes(minute);
        slots.push(slotTime);
      }
    }
    return slots;
  };

  const handleToggleTimeSlot = async (slotTime: Date) => {
    const slotStart = slotTime.toISOString();
    const slotEnd = new Date(slotTime.getTime() + slotDuration * 60 * 1000).toISOString();

    // Check if slot already exists
    const existingSlot = slots.find(slot => {
      const slotStartTime = new Date(slot.start_time);
      return isSameDay(slotStartTime, slotTime) && 
             format(slotStartTime, 'HH:mm') === format(slotTime, 'HH:mm');
    });

    if (existingSlot) {
      // Delete existing slot if not booked
      if (existingSlot.is_booked) {
        toast.error("Cannot delete a booked time slot");
      return;
    }
      const { error } = await supabase.from("time_slots").delete().eq("id", existingSlot.id);
      if (error) {
        toast.error("Failed to delete time slot");
      } else {
        toast.success("Time slot removed");
        fetchSlots();
      }
    } else {
      // Create new slot
    const { error } = await supabase.from("time_slots").insert({
        start_time: slotStart,
        end_time: slotEnd,
    });

    if (error) {
      toast.error("Failed to create time slot");
    } else {
        toast.success("Time slot added");
      fetchSlots();
      }
    }
  };

  // Get slots for selected date
  const getSlotsForDate = (date: Date) => {
    return slots.filter(slot => {
      const slotDate = new Date(slot.start_time);
      return isSameDay(slotDate, date);
    });
  };

  // Check if a time slot exists and is booked
  const getSlotStatus = (slotTime: Date) => {
    const slotDate = startOfDay(slotTime);
    const existingSlot = slots.find(slot => {
      const slotStartTime = new Date(slot.start_time);
      return isSameDay(slotStartTime, slotTime) && 
             format(slotStartTime, 'HH:mm') === format(slotTime, 'HH:mm');
    });
    
    if (existingSlot) {
      return existingSlot.is_booked ? 'booked' : 'available';
    }
    return 'none';
  };

  // Get dates that have slots (for calendar highlighting)
  const getDatesWithSlots = () => {
    const dates = new Set<string>();
    slots.forEach(slot => {
      const date = format(new Date(slot.start_time), 'yyyy-MM-dd');
      dates.add(date);
    });
    return Array.from(dates).map(date => parseISO(date));
  };

  const handleDeleteSlot = async (id: string) => {
    const { error } = await supabase.from("time_slots").delete().eq("id", id);

    if (error) {
      toast.error("Failed to delete time slot");
    } else {
      toast.success("Time slot deleted");
      fetchSlots();
    }
  };


  // Get dates that have bookings (for calendar highlighting)
  const getDatesWithBookings = () => {
    const dates = new Set<string>();
    bookings.forEach(booking => {
      const date = format(new Date(booking.time_slots.start_time), 'yyyy-MM-dd');
      dates.add(date);
    });
    return Array.from(dates).map(date => parseISO(date));
  };

  // Get bookings for a specific date
  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      isSameDay(new Date(booking.time_slots.start_time), date)
    );
  };

  // Get bookings for a specific date and hour (bookings that start in this hour)
  const getBookingsForDateAndHour = (date: Date, hour: number) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.time_slots.start_time);
      const bookingHour = getHours(bookingDate);
      return isSameDay(bookingDate, date) && bookingHour === hour;
    });
  };

  // Get week range
  const getWeekRange = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return { weekStart, weekEnd, weekDays: eachDayOfInterval({ start: weekStart, end: weekEnd }) };
  };

  // Generate hours (9 AM to 10 PM)
  const generateHours = () => {
    const hours = [];
    for (let hour = 9; hour <= 22; hour++) {
      hours.push(hour);
    }
    return hours;
  };

  // Navigate weeks
  const goToPreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const goToToday = () => {
    setCurrentWeek(new Date());
  };

  const fetchGalleryImages = async () => {
    const { data, error } = await supabase
      .from("gallery_images" as any)
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Failed to load gallery images");
    } else {
      setGalleryImages(data || []);
    }
  };

  const handleUploadImage = async () => {
    if (!selectedFile || !user || !isAdmin) {
      toast.error("Admin access required");
      return;
    }
    
    setUploading(true);
    
    // Upload to Supabase Storage
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `gallery/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('gallery')
      .upload(filePath, selectedFile);
    
    if (uploadError) {
      toast.error("Failed to upload image: " + uploadError.message);
      setUploading(false);
      return;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('gallery')
      .getPublicUrl(filePath);
    
    // Save to database - try without created_by first if it fails
    let { error: dbError } = await supabase
      .from("gallery_images" as any)
      .insert({
        image_url: publicUrl,
        created_by: user.id
      } as any);
    
    // If that fails, try without created_by
    if (dbError && dbError.message.includes("created_by")) {
      const { error: retryError } = await supabase
        .from("gallery_images" as any)
        .insert({
          image_url: publicUrl
        } as any);
      dbError = retryError;
    }
    
    if (dbError) {
      toast.error("Failed to save image: " + dbError.message);
      // Also try to delete the uploaded file if database insert fails
      await supabase.storage.from('gallery').remove([filePath]);
    } else {
      toast.success("Image uploaded!");
      setSelectedFile(null);
      fetchGalleryImages();
    }
    
    setUploading(false);
  };

  const handleDeleteImage = async (imageId: string) => {
    const { error } = await supabase
      .from("gallery_images" as any)
      .delete()
      .eq("id", imageId);
    
    if (error) {
      toast.error("Failed to delete image");
    } else {
      toast.success("Image deleted");
      fetchGalleryImages();
    }
  };


  // Show loading state while checking auth or role
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent"></div>
        </div>
      </div>
    );
  }

  // Don't render if not admin (will redirect)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage time slots and bookings</p>
        </div>

        <Tabs defaultValue="slots" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="slots" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Time Slots</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>Calendar</span>
            </TabsTrigger>
            {/* Gallery tab temporarily commented out */}
            {/* <TabsTrigger value="gallery" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>Gallery</span>
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="slots" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Calendar */}
              <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-accent" />
                    Select Date
              </CardTitle>
                  <CardDescription>
                    Choose a date to manage availability
                  </CardDescription>
            </CardHeader>
            <CardContent>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    modifiers={{
                      hasSlots: getDatesWithSlots()
                    }}
                    modifiersClassNames={{
                      hasSlots: "bg-accent/20 text-accent-foreground font-semibold rounded-md"
                    }}
                    className="rounded-md border"
                  />
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">Summary</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Total slots: {slots.length}</div>
                      <div>Available: {slots.filter((s) => !s.is_booked).length}</div>
                      <div>Booked: {slots.filter((s) => s.is_booked).length}</div>
                </div>
                </div>
            </CardContent>
          </Card>

              {/* Time Slots Grid */}
              <Card className="md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-accent" />
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </CardTitle>
              <CardDescription>
                    Click time slots to add or remove availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {generateTimeSlots(selectedDate).map((slotTime) => {
                          const status = getSlotStatus(slotTime);
                          const isPast = slotTime < new Date();
                          
                          return (
                            <Button
                              key={slotTime.toISOString()}
                              variant={status === 'booked' ? 'secondary' : status === 'available' ? 'default' : 'outline'}
                              className={`h-12 ${
                                status === 'booked' 
                                  ? 'bg-secondary/50 cursor-not-allowed' 
                                  : status === 'available'
                                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                                  : isPast
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-accent hover:text-accent-foreground'
                              }`}
                              onClick={() => !isPast && status !== 'booked' && handleToggleTimeSlot(slotTime)}
                              disabled={isPast || status === 'booked'}
                            >
                              <div className="text-center">
                                <div className="text-sm font-medium">
                                  {format(slotTime, 'h:mm a')}
                                </div>
                                {status === 'booked' && (
                                  <div className="text-xs opacity-75">Booked</div>
                                )}
                              </div>
                            </Button>
                          );
                        })}
                      </div>
                      
                      {getSlotsForDate(selectedDate).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No time slots for this date</p>
                          <p className="text-sm mt-1">Click on time slots above to add availability</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-accent" />
                      All Bookings
                    </CardTitle>
                    <CardDescription>
                      View and manage all customer appointments
                    </CardDescription>
                  </div>
                  <Button onClick={fetchBookings} variant="outline" size="sm" disabled={loadingBookings}>
                    {loadingBookings ? "Loading..." : "Refresh"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No bookings yet</p>
                        </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking: any) => {
                      const slot = booking.time_slots;
                      const slotDate = new Date(slot.start_time);
                      const isPast = slotDate < new Date();
                      const customerName = booking.customer_name || "Unknown";
                      const details = booking.details;
                      const hasDetails = details && typeof details === 'string' && details.trim().length > 0;
                      const status = booking.status || 'pending';
                      
                      return (
                        <Card 
                          key={booking.id}
                          className={`p-4 ${isPast ? 'opacity-60' : ''}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-accent" />
                                <span className="font-semibold text-sm sm:text-base">
                                  {format(slotDate, "EEEE, MMMM d, yyyy")}
                                </span>
                                {isPast && (
                                  <span className="text-xs bg-muted px-2 py-1 rounded">Past</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {format(slotDate, "h:mm a")} - {format(new Date(slot.end_time), "h:mm a")}
                              </div>
                              <div className="text-sm mb-2">
                                <span className="text-muted-foreground">Customer: </span>
                                <span className="font-medium">{customerName}</span>
                              </div>
                              {hasDetails && (
                                <div className="text-sm mb-2 p-2 bg-muted rounded-md border-l-2 border-accent">
                                  <div className="text-xs font-medium text-muted-foreground mb-1">Customer Notes:</div>
                                  <div className="text-xs">{details}</div>
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-2">
                                Booked on {format(new Date(booking.created_at), "MMM d, yyyy 'at' h:mm a")}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-accent" />
                      Booking Calendar
                    </CardTitle>
                    <CardDescription>
                      Week view with hourly breakdown
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="hidden md:flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex md:hidden items-center gap-2">
                      <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToToday} className="text-xs px-2">
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={goToNextWeek}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingBookings ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Week View */}
                    <div className="hidden lg:block border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 300px)', maxHeight: '800px' }}>
                      <div className="h-full overflow-auto">
                        <div className="min-w-[900px]">
                        {/* Week header - sticky */}
                        <div className="grid grid-cols-8 border-b bg-muted/50 sticky top-0 z-20">
                          <div className="p-3 font-semibold text-sm border-r bg-background">
                            {format(getWeekRange().weekStart, "MMM d")} - {format(getWeekRange().weekEnd, "MMM d, yyyy")}
                          </div>
                          {getWeekRange().weekDays.map((day, idx) => (
                            <div key={idx} className="p-3 text-center border-l bg-background">
                              <div className="text-xs text-muted-foreground mb-1">
                                {format(day, "EEE")}
                              </div>
                              <div className={`text-base font-semibold ${isSameDay(day, new Date()) ? 'text-accent' : ''}`}>
                                {format(day, "d")}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Hours and bookings */}
                        <div className="relative">
                          {generateHours().map((hour) => (
                            <div key={hour} className="grid grid-cols-8 border-b min-h-[80px] hover:bg-muted/20 transition-colors">
                              {/* Time label - sticky */}
                              <div className="p-2 border-r text-xs text-muted-foreground flex items-start justify-end pt-2 bg-background sticky left-0 z-10">
                                {format(new Date().setHours(hour, 0, 0, 0), "h:mm a")}
                              </div>
                              
                              {/* Day columns */}
                              {getWeekRange().weekDays.map((day, dayIdx) => {
                                const dayBookings = getBookingsForDateAndHour(day, hour);
                                const isToday = isSameDay(day, new Date());
                                return (
                                  <div 
                                    key={`${dayIdx}-${hour}`} 
                                    className={`border-l border-r last:border-r-0 p-1 relative min-h-[80px] ${isToday ? 'bg-accent/5' : ''}`}
                                  >
                                    {dayBookings.map((booking: any) => {
                                      const slot = booking.time_slots;
                                      const slotDate = new Date(slot.start_time);
                                      const slotHour = getHours(slotDate);
                                      const slotMinute = getMinutes(slotDate);
                                      const slotEnd = new Date(slot.end_time);
                                      const slotEndHour = getHours(slotEnd);
                                      const slotEndMinute = getMinutes(slotEnd);
                                      const customerName = booking.customer_name || "Unknown";
                                      const status = booking.status || 'pending';
                                      
                                      // Calculate position and height
                                      const startPosition = (slotMinute / 60) * 100;
                                      let heightPercent = 50; // Default 30 min = 50% of hour
                                      
                                      // If booking spans multiple hours, adjust height
                                      if (slotHour === hour && slotEndHour === hour) {
                                        // Booking starts and ends in same hour
                                        const duration = slotEndMinute - slotMinute;
                                        heightPercent = (duration / 60) * 100;
                                      } else if (slotHour === hour) {
                                        // Booking starts in this hour but ends in next
                                        heightPercent = 100 - startPosition;
                                      }
                                      
                                      // Only show if it starts in this hour
                                      if (slotHour === hour) {
                                        return (
                                          <div
                                            key={booking.id}
                                            className={`absolute left-1 right-1 rounded px-2 py-1 text-xs cursor-pointer z-10 overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                                              status === 'confirmed' 
                                                ? 'bg-accent text-accent-foreground' 
                                                : status === 'cancelled'
                                                ? 'bg-destructive/20 text-destructive border border-destructive'
                                                : 'bg-secondary text-secondary-foreground'
                                            }`}
                                            style={{
                                              top: `${startPosition}%`,
                                              height: `${Math.max(heightPercent, 25)}%`, // Minimum 25% height
                                              minHeight: '28px',
                                            }}
                                            title={`${customerName} - ${format(slotDate, "h:mm a")} to ${format(slotEnd, "h:mm a")}${booking.details ? `\nNotes: ${booking.details}` : ''}`}
                                          >
                                            <div className="font-medium truncate">{customerName}</div>
                                            <div className="text-[10px] opacity-75 truncate">
                                              {format(slotDate, "h:mm a")}
                                            </div>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                    {/* Mobile List View */}
                    <div className="lg:hidden space-y-4">
                      {getWeekRange().weekDays.map((day) => {
                        const dayBookings = getBookingsForDate(day);
                        const isToday = isSameDay(day, new Date());
                        return (
                          <Card key={day.toISOString()} className={isToday ? 'border-accent' : ''}>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm text-muted-foreground mb-1">
                                      {format(day, "EEEE")}
                                    </div>
                                    <div className="text-xl font-bold">
                                      {format(day, "MMMM d")}
                                    </div>
                                  </div>
                                  {isToday && (
                                    <Badge variant="default">Today</Badge>
                                  )}
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {dayBookings.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                  No bookings
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {dayBookings.map((booking: any) => {
                                    const slot = booking.time_slots;
                                    const slotDate = new Date(slot.start_time);
                                    const customerName = booking.customer_name || "Unknown";
                                    const status = booking.status || 'pending';
                                    
                                    return (
                                      <div
                                        key={booking.id}
                                        className={`p-3 rounded-lg border ${
                                          status === 'confirmed' 
                                            ? 'bg-accent/10 border-accent' 
                                            : status === 'cancelled'
                                            ? 'bg-destructive/10 border-destructive'
                                            : 'bg-secondary/50'
                                        }`}
                                      >
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="font-medium mb-1">{customerName}</div>
                                            <div className="text-sm text-muted-foreground">
                                              {format(slotDate, "h:mm a")} - {format(new Date(slot.end_time), "h:mm a")}
                                            </div>
                                            {booking.details && (
                                              <div className="text-xs text-muted-foreground mt-2 p-2 bg-background rounded">
                                                {booking.details}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Gallery tab temporarily commented out */}
          {/* <TabsContent value="gallery" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-accent" />
                  Gallery Management
                </CardTitle>
                <CardDescription>
                  Upload and manage gallery images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 border rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="mb-2"
                      />
                      </div>
                      <Button
                      onClick={handleUploadImage}
                      disabled={!selectedFile || uploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploading ? "Uploading..." : "Upload Image"}
                      </Button>
                    </div>
                </div>
                
                {galleryImages.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No gallery images yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {galleryImages.map((image) => (
                      <Card key={image.id} className="overflow-hidden">
                        <div className="aspect-square overflow-hidden bg-muted">
                          <img
                            src={image.image_url}
                            alt="Gallery image"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteImage(image.id)}
                            className="w-full"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          </TabsContent> */}
        </Tabs>
      </main>
    </div>
  );
}
