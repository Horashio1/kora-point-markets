import { useUserStats } from "@/hooks/useUserStats";
import { Coins, Target, Trophy, TrendingDown } from "lucide-react";

export function StatsBar() {
  const { data: userStats } = useUserStats();
  
  const pointsRemaining = userStats.daily_allowance - userStats.points_spent_today;
  const totalGames = userStats.wins + userStats.losses;
  const winRate = totalGames > 0 ? Math.round((userStats.wins / totalGames) * 100) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
          <Coins className="h-5 w-5 text-primary" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Total Points</div>
          <div className="font-display text-lg font-bold text-foreground">
            {userStats.total_points.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20">
          <Target className="h-5 w-5 text-success" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Daily Remaining</div>
          <div className="font-display text-lg font-bold text-success">
            {pointsRemaining}
          </div>
        </div>
      </div>

      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-yes/20">
          <Trophy className="h-5 w-5 text-success" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Wins</div>
          <div className="font-display text-lg font-bold text-foreground">
            {userStats.wins}
          </div>
        </div>
      </div>

      <div className="glass-card flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
          <TrendingDown className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Win Rate</div>
          <div className="font-display text-lg font-bold text-foreground">
            {winRate}%
          </div>
        </div>
      </div>
    </div>
  );
}
