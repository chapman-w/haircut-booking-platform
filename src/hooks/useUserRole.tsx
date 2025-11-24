import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useUserRole(userId: string | undefined) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const checkRole = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      // Don't update state if this effect was cancelled (userId changed)
      if (cancelled) {
        return;
      }
      
      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    checkRole();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { isAdmin, loading };
}
