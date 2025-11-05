import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Calendar, Clock, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

export default function Admin() {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole(user?.id);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      toast.error("Access denied. Admin only.");
      navigate("/");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchSlots();
    }
  }, [user, isAdmin]);

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

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startTime || !endTime) {
      toast.error("Please select both start and end times");
      return;
    }

    const { error } = await supabase.from("time_slots").insert({
      start_time: startTime,
      end_time: endTime,
    });

    if (error) {
      toast.error("Failed to create time slot");
    } else {
      toast.success("Time slot created successfully");
      setStartTime("");
      setEndTime("");
      fetchSlots();
    }
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

  if (roleLoading || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Manage Time Slots</h1>
          <p className="text-muted-foreground">Create and manage your available appointment times</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-accent" />
                Create New Time Slot
              </CardTitle>
              <CardDescription>Add a new available appointment slot</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSlot} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" variant="hero">
                  <Plus className="h-4 w-4" />
                  Create Slot
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent" />
                Available Time Slots
              </CardTitle>
              <CardDescription>
                {slots.length} total slots ({slots.filter((s) => !s.is_booked).length} available)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">Loading...</p>
              ) : slots.length === 0 ? (
                <p className="text-muted-foreground">No time slots created yet</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {slots.map((slot) => (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        slot.is_booked ? "bg-secondary/30 border-secondary" : "bg-card"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Clock className="h-4 w-4 text-accent" />
                          {format(new Date(slot.start_time), "MMM d, yyyy")}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(slot.start_time), "h:mm a")} -{" "}
                          {format(new Date(slot.end_time), "h:mm a")}
                        </div>
                        {slot.is_booked && (
                          <span className="inline-block mt-1 text-xs font-medium text-accent">
                            Booked
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSlot(slot.id)}
                        disabled={slot.is_booked}
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
