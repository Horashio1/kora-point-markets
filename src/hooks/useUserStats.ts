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
  // For now, return default stats since auth is not implemented yet
  // Once auth is added, this will fetch from supabase
  return {
    data: defaultStats,
    isLoading: false,
    error: null,
  };
}
