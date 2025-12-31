import { Button } from "@/components/ui/button";
import { Coins, TrendingUp, Menu } from "lucide-react";
import { userStats } from "@/data/mockData";
import { useState } from "react";

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pointsRemaining = userStats.daily_allowance - userStats.points_spent_today;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <span className="font-display text-xl font-bold">
              Kora<span className="text-primary">.lk</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#" className="text-sm font-medium text-foreground transition-colors hover:text-primary">
              Markets
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              Leaderboard
            </a>
            <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              How It Works
            </a>
          </nav>

          {/* Points & Actions */}
          <div className="flex items-center gap-3">
            <div className="glass-card hidden items-center gap-2 px-4 py-2 sm:flex">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-display font-semibold text-foreground">
                {userStats.total_points.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                ({pointsRemaining} left today)
              </span>
            </div>
            
            <Button variant="glow" size="sm" className="hidden sm:flex">
              Sign In
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border/50 py-4 md:hidden">
            <nav className="flex flex-col gap-4">
              <a href="#" className="text-sm font-medium text-foreground">Markets</a>
              <a href="#" className="text-sm font-medium text-muted-foreground">Leaderboard</a>
              <a href="#" className="text-sm font-medium text-muted-foreground">How It Works</a>
              <div className="flex items-center gap-2 pt-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-display font-semibold">{userStats.total_points.toLocaleString()} points</span>
              </div>
              <Button variant="glow" size="sm" className="w-fit">Sign In</Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
