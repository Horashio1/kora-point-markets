import { useEffect, useMemo, useState } from "react";
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
import { Coins, TrendingUp, AlertCircle, Sparkles, Zap, X } from "lucide-react";
import { toast } from "sonner";

interface BettingModalProps {
  question: Question | null;
  prediction: "yes" | "no" | null;
  optionName?: string;
  isOpen: boolean;
  onClose: () => void;
  onPredictionChange?: (p: "yes" | "no" | null) => void;
}

export function BettingModal({
  question,
  prediction,
  optionName,
  isOpen,
  onClose,
  onPredictionChange,
}: BettingModalProps) {
  const [points, setPoints] = useState(10);
  const [localPrediction, setLocalPrediction] = useState<"yes" | "no" | null>(prediction);

  const { data: userStats = {
    total_points: 1000,
    daily_allowance: 100,
    points_spent_today: 0,
    wins: 0,
    losses: 0,
  }} = useUserStats();

  const placeBet = usePlaceBet();

  useEffect(() => {
    if (isOpen) setLocalPrediction(prediction);
  }, [isOpen, prediction, question?.id]);

  const pointsRemaining = userStats.daily_allowance - userStats.points_spent_today;
  const maxBet = Math.min(pointsRemaining, userStats.total_points, 100);

  const effectivePrediction = localPrediction;

  const odds = useMemo(() => {
    if (!effectivePrediction || !question) return 50;

    if (optionName && question.options) {
      const option = question.options.find((opt) => opt.name === optionName);
      const pct = option ? option.percentage : 50;
      return effectivePrediction === "yes" ? pct : 100 - pct;
    }

    return effectivePrediction === "yes"
      ? (question.yes_percentage ?? 50)
      : 100 - (question.yes_percentage ?? 50);
  }, [effectivePrediction, optionName, question]);

  const potentialWin = useMemo(() => {
    const safeOdds = Math.max(1, odds);
    return Math.round(points * (100 / safeOdds));
  }, [points, odds]);

  if (!question) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-gradient-to-b from-background to-background/95 backdrop-blur-xl border border-border/40 shadow-2xl sm:max-w-md rounded-2xl p-0 overflow-hidden">
          <div className="p-6">
            <DialogHeader className="space-y-3">
              <DialogTitle className="font-display text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                Place Your Prediction
              </DialogTitle>
              <DialogDescription className="text-muted-foreground text-base">
                No question selected.
              </DialogDescription>
            </DialogHeader>
            <Button variant="outline" onClick={onClose} className="mt-6 w-full">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const setPrediction = (p: "yes" | "no") => {
    setLocalPrediction(p);
    onPredictionChange?.(p);
  };

  const handlePlaceBet = async () => {
    if (!effectivePrediction) {
      toast.error("Please select YES or NO");
      return;
    }

    if (points > pointsRemaining) {
      toast.error("Not enough points remaining today!");
      return;
    }

    if (points > userStats.total_points) {
      toast.error("Insufficient total points!");
      return;
    }

    try {
      await placeBet.mutateAsync({
        question_id: question.id,
        prediction: effectivePrediction,
        points_wagered: points,
        option_name: optionName || null,
      });

      const betDescription = optionName
        ? `${effectivePrediction.toUpperCase()} on "${optionName}"`
        : effectivePrediction.toUpperCase();

      toast.success(
        `Bet placed! ${points} points on ${betDescription} for "${question.title}"`,
        { description: `Potential win: ${potentialWin} points` }
      );

      onClose();
      setPoints(10);
      setLocalPrediction(null);
      onPredictionChange?.(null);
    } catch {
      // onError handled in mutation
    }
  };

  const progressPercentage = (pointsRemaining / userStats.daily_allowance) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-b from-background via-background to-background/95 backdrop-blur-xl border border-border/40 shadow-2xl sm:max-w-lg rounded-3xl p-0 overflow-hidden gap-0">
        {/* Header with gradient accent */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
          <div className="relative px-6 pt-6 pb-4">
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 hover:bg-muted/80 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="font-display text-xl font-bold tracking-tight">
                Place Your Prediction
              </DialogTitle>
            </div>
            
            <DialogDescription className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {question.title}
            </DialogDescription>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6">
          {/* Prediction Choice */}
          {optionName ? (
            <div className="space-y-4">
              <div className="rounded-2xl p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Selected Option
                </div>
                <div className="font-display text-lg font-bold text-foreground">
                  {optionName}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPrediction("yes")}
                  className={cn(
                    "group relative rounded-2xl p-4 text-center transition-all duration-300 overflow-hidden",
                    effectivePrediction === "yes"
                      ? "bg-emerald-500/15 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                      : "bg-muted/50 border-2 border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5"
                  )}
                >
                  {effectivePrediction === "yes" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                  )}
                  <div className="relative">
                    <div className={cn(
                      "font-display text-xl font-bold transition-colors",
                      effectivePrediction === "yes" ? "text-emerald-500" : "text-emerald-500/60"
                    )}>
                      YES
                    </div>
                    <div className={cn(
                      "text-sm font-medium mt-1 transition-colors",
                      effectivePrediction === "yes" ? "text-emerald-500/80" : "text-muted-foreground"
                    )}>
                      {question.options?.find((opt) => opt.name === optionName)?.percentage || 0}% odds
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPrediction("no")}
                  className={cn(
                    "group relative rounded-2xl p-4 text-center transition-all duration-300 overflow-hidden",
                    effectivePrediction === "no"
                      ? "bg-rose-500/15 border-2 border-rose-500 shadow-lg shadow-rose-500/10"
                      : "bg-muted/50 border-2 border-transparent hover:border-rose-500/30 hover:bg-rose-500/5"
                  )}
                >
                  {effectivePrediction === "no" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent" />
                  )}
                  <div className="relative">
                    <div className={cn(
                      "font-display text-xl font-bold transition-colors",
                      effectivePrediction === "no" ? "text-rose-500" : "text-rose-500/60"
                    )}>
                      NO
                    </div>
                    <div className={cn(
                      "text-sm font-medium mt-1 transition-colors",
                      effectivePrediction === "no" ? "text-rose-500/80" : "text-muted-foreground"
                    )}>
                      {100 - (question.options?.find((opt) => opt.name === optionName)?.percentage || 0)}% odds
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPrediction("yes")}
                className={cn(
                  "group relative rounded-2xl p-5 text-center transition-all duration-300 overflow-hidden",
                  effectivePrediction === "yes"
                    ? "bg-emerald-500/15 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 scale-[1.02]"
                    : "bg-muted/50 border-2 border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5"
                )}
              >
                {effectivePrediction === "yes" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
                )}
                <div className="relative">
                  <div className={cn(
                    "font-display text-3xl font-bold transition-colors",
                    effectivePrediction === "yes" ? "text-emerald-500" : "text-emerald-500/60"
                  )}>
                    YES
                  </div>
                  <div className={cn(
                    "text-sm font-medium mt-2 transition-colors",
                    effectivePrediction === "yes" ? "text-emerald-500/80" : "text-muted-foreground"
                  )}>
                    {question.yes_percentage}% odds
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrediction("no")}
                className={cn(
                  "group relative rounded-2xl p-5 text-center transition-all duration-300 overflow-hidden",
                  effectivePrediction === "no"
                    ? "bg-rose-500/15 border-2 border-rose-500 shadow-lg shadow-rose-500/10 scale-[1.02]"
                    : "bg-muted/50 border-2 border-transparent hover:border-rose-500/30 hover:bg-rose-500/5"
                )}
              >
                {effectivePrediction === "no" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent" />
                )}
                <div className="relative">
                  <div className={cn(
                    "font-display text-3xl font-bold transition-colors",
                    effectivePrediction === "no" ? "text-rose-500" : "text-rose-500/60"
                  )}>
                    NO
                  </div>
                  <div className={cn(
                    "text-sm font-medium mt-2 transition-colors",
                    effectivePrediction === "no" ? "text-rose-500/80" : "text-muted-foreground"
                  )}>
                    {100 - question.yes_percentage}% odds
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Points Slider Section */}
          <div className="space-y-4 rounded-2xl bg-muted/30 p-5 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Wager Amount</span>
              <div className="flex items-center gap-2 bg-background/80 rounded-full px-3 py-1.5 border border-border/50">
                <Coins className="h-4 w-4 text-amber-500" />
                <span className="font-display text-lg font-bold text-foreground">{points}</span>
              </div>
            </div>

            <div className="pt-2 pb-1">
              <Slider
                value={[points]}
                onValueChange={(value) => setPoints(value[0])}
                max={maxBet}
                min={1}
                step={1}
                className="py-2"
              />
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="bg-muted/50 px-2 py-1 rounded-md">Min: 1</span>
              <span className="bg-muted/50 px-2 py-1 rounded-md">Max: {maxBet}</span>
            </div>
          </div>

          {/* Potential Win Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 border border-primary/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Potential Return
                  </div>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    If you win
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-amber-500" />
                <span className="font-display text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  {potentialWin}
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          {points > pointsRemaining && (
            <div className="flex items-center gap-3 rounded-2xl bg-rose-500/10 p-4 border border-rose-500/20">
              <div className="p-2 rounded-xl bg-rose-500/10">
                <AlertCircle className="h-4 w-4 text-rose-500" />
              </div>
              <span className="text-sm font-medium text-rose-500">
                You only have {pointsRemaining} points left today
              </span>
            </div>
          )}

          {/* Daily Allowance Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Daily Allowance</span>
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">{pointsRemaining}</span>
                {" / "}{userStats.daily_allowance} remaining
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              className="flex-1 h-12 rounded-xl border-border/50 hover:bg-muted/50 transition-all" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className={cn(
                "flex-1 h-12 rounded-xl font-semibold transition-all duration-300",
                effectivePrediction === "yes"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : effectivePrediction === "no"
                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25"
                  : "bg-primary hover:bg-primary/90"
              )}
              onClick={handlePlaceBet}
              disabled={
                !effectivePrediction ||
                points > pointsRemaining ||
                points > userStats.total_points ||
                placeBet.isPending
              }
            >
              {placeBet.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Placing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Confirm Bet
                </span>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}