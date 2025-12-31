import { useState } from "react";
import { Question } from "@/types/prediction";
import { Button } from "@/components/ui/button";
import { userStats } from "@/data/mockData";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { Coins, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface BettingModalProps {
  question: Question | null;
  prediction: 'yes' | 'no' | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BettingModal({ question, prediction, isOpen, onClose }: BettingModalProps) {
  const [points, setPoints] = useState(10);
  const pointsRemaining = userStats.daily_allowance - userStats.points_spent_today;
  const maxBet = Math.min(pointsRemaining, 100);

  if (!question || !prediction) return null;

  const odds = prediction === 'yes' ? question.yes_percentage : (100 - question.yes_percentage);
  const potentialWin = Math.round(points * (100 / odds));

  const handlePlaceBet = () => {
    if (points > pointsRemaining) {
      toast.error("Not enough points remaining today!");
      return;
    }
    
    toast.success(
      `Bet placed! ${points} points on ${prediction.toUpperCase()} for "${question.title}"`,
      {
        description: `Potential win: ${potentialWin} points`,
      }
    );
    onClose();
    setPoints(10);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Place Your Prediction</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {question.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Prediction Choice */}
          <div className="flex justify-center gap-4">
            <div
              className={cn(
                "flex-1 rounded-xl p-4 text-center transition-all",
                prediction === 'yes'
                  ? "bg-success/20 border-2 border-success"
                  : "bg-secondary opacity-50"
              )}
            >
              <div className="font-display text-2xl font-bold text-success">YES</div>
              <div className="text-sm text-success/80">{question.yes_percentage}%</div>
            </div>
            <div
              className={cn(
                "flex-1 rounded-xl p-4 text-center transition-all",
                prediction === 'no'
                  ? "bg-destructive/20 border-2 border-destructive"
                  : "bg-secondary opacity-50"
              )}
            >
              <div className="font-display text-2xl font-bold text-destructive">NO</div>
              <div className="text-sm text-destructive/80">{100 - question.yes_percentage}%</div>
            </div>
          </div>

          {/* Points Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Points to bet</span>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                <span className="font-display text-xl font-bold text-foreground">{points}</span>
              </div>
            </div>
            
            <Slider
              value={[points]}
              onValueChange={(value) => setPoints(value[0])}
              max={maxBet}
              min={1}
              step={1}
              className="py-2"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 point</span>
              <span>{maxBet} points (max)</span>
            </div>
          </div>

          {/* Potential Win */}
          <div className="glass-card flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">Potential Win</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins className="h-4 w-4 text-primary" />
              <span className="font-display text-xl font-bold text-primary">
                {potentialWin}
              </span>
            </div>
          </div>

          {/* Warning */}
          {points > pointsRemaining && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>You only have {pointsRemaining} points left today</span>
            </div>
          )}

          {/* Daily Allowance Info */}
          <div className="text-center text-xs text-muted-foreground">
            Daily allowance: {pointsRemaining} of {userStats.daily_allowance} points remaining
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={prediction === 'yes' ? 'success' : 'destructive'}
            className="flex-1"
            onClick={handlePlaceBet}
            disabled={points > pointsRemaining}
          >
            Confirm Bet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
