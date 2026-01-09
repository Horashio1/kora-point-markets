import { useState } from "react";
import { Question } from "@/types/prediction";
import { Button } from "@/components/ui/button";
import { useUserStats } from "@/hooks/useUserStats";
import { usePlaceBet } from "@/hooks/usePlaceBet";
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
  optionName?: string; // For multi-choice questions
  isOpen: boolean;
  onClose: () => void;
}

export function BettingModal({ question, prediction, optionName, isOpen, onClose }: BettingModalProps) {
  const [points, setPoints] = useState(10);
  const { data: userStats = {
    total_points: 1000,
    daily_allowance: 100,
    points_spent_today: 0,
    wins: 0,
    losses: 0,
  }, isLoading: isLoadingStats } = useUserStats();
  const placeBet = usePlaceBet();
  
  const pointsRemaining = userStats.daily_allowance - userStats.points_spent_today;
  const maxBet = Math.min(pointsRemaining, userStats.total_points, 100);

  if (!question || !prediction) return null;

  // For multi-choice questions, get the option's percentage
  let odds: number;
  if (optionName && question.options) {
    const option = question.options.find(opt => opt.name === optionName);
    odds = option ? (prediction === 'yes' ? option.percentage : 100 - option.percentage) : 50;
  } else {
    // Binary question
    odds = prediction === 'yes' ? question.yes_percentage : (100 - question.yes_percentage);
  }
  
  const potentialWin = Math.round(points * (100 / odds));

  const handlePlaceBet = async () => {
    if (points > pointsRemaining) {
      toast.error("Not enough points remaining today!");
      return;
    }

    if (points > userStats.total_points) {
      toast.error("Insufficient total points!");
      return;
    }

    if (!question) return;

    try {
      await placeBet.mutateAsync({
        question_id: question.id,
        prediction: prediction!,
        points_wagered: points,
        option_name: optionName || null,
      });

      const betDescription = optionName 
        ? `${prediction!.toUpperCase()} on "${optionName}"`
        : prediction!.toUpperCase();
      
      toast.success(
        `Bet placed! ${points} points on ${betDescription} for "${question.title}"`,
        {
          description: `Potential win: ${potentialWin} points`,
        }
      );
      onClose();
      setPoints(10);
    } catch (error) {
      // Error is already handled by the mutation's onError
    }
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
          {optionName ? (
            <div className="rounded-xl p-4 bg-blue-50/50 border-2 border-blue-200 text-center">
              <div className="text-sm text-gray-600 mb-1">Option</div>
              <div className="font-display text-lg font-bold text-gray-900 mb-2">{optionName}</div>
              <div className="flex justify-center gap-4 mt-3">
                <div
                  className={cn(
                    "flex-1 rounded-lg p-3 text-center transition-all",
                    prediction === 'yes'
                      ? "bg-blue-50 border-2 border-blue-200"
                      : "bg-gray-100 opacity-50"
                  )}
                >
                  <div className="font-semibold text-blue-700">YES</div>
                  <div className="text-xs text-blue-600">
                    {question.options?.find(opt => opt.name === optionName)?.percentage || 0}%
                  </div>
                </div>
                <div
                  className={cn(
                    "flex-1 rounded-lg p-3 text-center transition-all",
                    prediction === 'no'
                      ? "bg-purple-50 border-2 border-purple-200"
                      : "bg-gray-100 opacity-50"
                  )}
                >
                  <div className="font-semibold text-purple-700">NO</div>
                  <div className="text-xs text-purple-600">
                    {100 - (question.options?.find(opt => opt.name === optionName)?.percentage || 0)}%
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center gap-4">
              <div
                className={cn(
                  "flex-1 rounded-xl p-4 text-center transition-all",
                  prediction === 'yes'
                    ? "bg-blue-50 border-2 border-blue-200"
                    : "bg-gray-100 opacity-50"
                )}
              >
                <div className="font-display text-2xl font-bold text-blue-700">YES</div>
                <div className="text-sm text-blue-600">{question.yes_percentage}%</div>
              </div>
              <div
                className={cn(
                  "flex-1 rounded-xl p-4 text-center transition-all",
                  prediction === 'no'
                    ? "bg-purple-50 border-2 border-purple-200"
                    : "bg-gray-100 opacity-50"
                )}
              >
                <div className="font-display text-2xl font-bold text-purple-700">NO</div>
                <div className="text-sm text-purple-600">{100 - question.yes_percentage}%</div>
              </div>
            </div>
          )}

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
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 border border-purple-200 p-3 text-sm text-purple-700">
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
          <button
            className={cn(
              "flex-1 rounded-lg px-4 py-2 font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed",
              prediction === 'yes' 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-purple-600 hover:bg-purple-700"
            )}
            onClick={handlePlaceBet}
            disabled={points > pointsRemaining || points > userStats.total_points || placeBet.isPending}
          >
            {placeBet.isPending ? "Placing Bet..." : "Confirm Bet"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
