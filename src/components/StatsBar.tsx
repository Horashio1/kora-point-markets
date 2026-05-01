'use client'

import { useUserStats } from "@/hooks/useUserStats";
import { Coins, Target, Trophy, TrendingDown } from "lucide-react";

export function StatsBar() {
  const { data: userStats } = useUserStats();

  const pointsRemaining = userStats.daily_allowance - userStats.points_spent_today;
  const totalGames = userStats.wins + userStats.losses;
  const winRate = totalGames > 0 ? Math.round((userStats.wins / totalGames) * 100) : 0;

  const IconWrap = ({ children }: { children: React.ReactNode }) => (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 border border-primary/30 shadow-[0_0_18px_-8px_hsl(var(--neon-blue)/0.5)]">
      {children}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {/* Total Points */}
      <div className="glass-card flex items-center gap-3 p-4">
        <IconWrap>
          <Coins className="h-5 w-5 text-primary" />
        </IconWrap>
        <div>
          <div className="text-xs text-muted-foreground">Total Points</div>
          <div className="font-display text-lg font-bold text-foreground">
            {userStats.total_points.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Daily Remaining */}
      <div className="glass-card flex items-center gap-3 p-4">
        <IconWrap>
          <Target className="h-5 w-5 text-primary" />
        </IconWrap>
        <div>
          <div className="text-xs text-muted-foreground">Daily Remaining</div>
          <div className="font-display text-lg font-bold text-foreground">
            {pointsRemaining}
          </div>
        </div>
      </div>

      {/* Wins */}
      <div className="glass-card flex items-center gap-3 p-4">
        <IconWrap>
          <Trophy className="h-5 w-5 text-primary" />
        </IconWrap>
        <div>
          <div className="text-xs text-muted-foreground">Wins</div>
          <div className="font-display text-lg font-bold text-foreground">
            {userStats.wins}
          </div>
        </div>
      </div>

      {/* Win Rate */}
      <div className="glass-card flex items-center gap-3 p-4">
        <IconWrap>
          <TrendingDown className="h-5 w-5 text-primary" />
        </IconWrap>
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
