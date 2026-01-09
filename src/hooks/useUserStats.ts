import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserStats } from "@/types/prediction";

// Default stats for unauthenticated users or before data loads
const defaultStats: UserStats = {
  total_points: 1000,
  daily_allowance: 100,
  points_spent_today: 0,
  wins: 0,
  losses: 0,
};

export function useUserStats() {
  return useQuery({
    queryKey: ["user_stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return defaultStats;
      }

      const { data, error } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If user stats don't exist, return default
        if (error.code === 'PGRST116') {
          return defaultStats;
        }
        throw error;
      }

      // Check if daily allowance needs reset
      const today = new Date().toISOString().split('T')[0];
      if (data.last_reset_date !== today) {
        // Reset daily spending (you might want to do this in a trigger or separate mutation)
        return {
          ...data,
          points_spent_today: 0,
        };
      }

      return {
        total_points: data.total_points,
        daily_allowance: data.daily_allowance,
        points_spent_today: data.points_spent_today,
        wins: data.wins,
        losses: data.losses,
      };
    },
    retry: false,
    staleTime: 30000, // Cache for 30 seconds
    // Ensure components have safe defaults even before the first query resolves
    initialData: defaultStats,
  });
}
