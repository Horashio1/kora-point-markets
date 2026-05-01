'use client'

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
import {
  AlertCircle,
  ArrowRightLeft,
  Coins,
  Gauge,
  Minus,
  TrendingUp,
  Zap,
} from "lucide-react";
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

  const {
    data: userStats = {
      total_points: 1000,
      daily_allowance: 100,
      points_spent_today: 0,
      wins: 0,
      losses: 0,
    },
  } = useUserStats();

  const placeBet = usePlaceBet();

  useEffect(() => {
    if (isOpen) {
      setLocalPrediction(prediction);
      setPoints(10);
    }
  }, [isOpen, prediction, question?.id]);

  const pointsRemaining = userStats.daily_allowance - userStats.points_spent_today;
  const maxBet = Math.max(1, Math.min(pointsRemaining, userStats.total_points, 100));
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

  const quickAmounts = useMemo(
    () => [10, 25, 50, maxBet].filter((value, index, arr) => value <= maxBet && arr.indexOf(value) === index),
    [maxBet]
  );

  if (!question) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="glass-modal sm:max-w-md rounded-2xl p-0 overflow-hidden">
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
      // handled in mutation
    }
  };

  const progressPercentage = (pointsRemaining / userStats.daily_allowance) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl rounded-[28px] border border-slate-200 bg-white p-0 overflow-hidden gap-0 shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="font-display text-2xl font-bold tracking-tight text-slate-950">
                Place Bet
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Order Ticket
              </DialogDescription>
            </div>
            <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500">
              {optionName ? "Multi-market" : "Binary"}
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-700">
            {question.title}
          </p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="space-y-6 border-b border-slate-200 px-6 py-6 lg:border-b-0 lg:border-r">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <Gauge className="h-3.5 w-3.5" />
                  Price
                </div>
                <div className="font-display text-2xl font-bold text-slate-950">{odds}¢</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <Coins className="h-3.5 w-3.5" />
                  Buying Power
                </div>
                <div className="font-display text-2xl font-bold text-slate-950">{pointsRemaining}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Payout
                </div>
                <div className="font-display text-2xl font-bold text-slate-950">{potentialWin}</div>
              </div>
            </div>

            {optionName ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Selected Option
                  </div>
                  <div className="mt-1 font-display text-lg font-bold text-slate-950">
                    {optionName}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPrediction("yes")}
                    className={cn(
                      "rounded-2xl border px-4 py-5 text-left transition-all duration-200",
                      effectivePrediction === "yes"
                        ? "border-emerald-600 bg-emerald-50 shadow-[inset_0_0_0_1px_rgba(5,150,105,0.15)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Side</div>
                    <div className={cn("mt-2 font-display text-3xl font-bold", effectivePrediction === "yes" ? "text-emerald-600" : "text-slate-900")}>
                      YES
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      Buy at {question.options?.find((opt) => opt.name === optionName)?.percentage || 0}¢
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrediction("no")}
                    className={cn(
                      "rounded-2xl border px-4 py-5 text-left transition-all duration-200",
                      effectivePrediction === "no"
                        ? "border-rose-600 bg-rose-50 shadow-[inset_0_0_0_1px_rgba(225,29,72,0.12)]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Side</div>
                    <div className={cn("mt-2 font-display text-3xl font-bold", effectivePrediction === "no" ? "text-rose-600" : "text-slate-900")}>
                      NO
                    </div>
                    <div className="mt-3 text-sm text-slate-500">
                      Buy at {100 - (question.options?.find((opt) => opt.name === optionName)?.percentage || 0)}¢
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
                    "rounded-3xl border px-5 py-6 text-left transition-all duration-200",
                    effectivePrediction === "yes"
                      ? "border-emerald-600 bg-emerald-50 shadow-[inset_0_0_0_1px_rgba(5,150,105,0.15)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Buy Side</div>
                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {question.yes_percentage}¢
                    </div>
                  </div>
                  <div className={cn("mt-5 font-display text-4xl font-bold", effectivePrediction === "yes" ? "text-emerald-600" : "text-slate-900")}>
                    YES
                  </div>
                  <div className="mt-3 text-sm text-slate-500">Buy contracts if you think the event happens.</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPrediction("no")}
                  className={cn(
                    "rounded-3xl border px-5 py-6 text-left transition-all duration-200",
                    effectivePrediction === "no"
                      ? "border-rose-600 bg-rose-50 shadow-[inset_0_0_0_1px_rgba(225,29,72,0.12)]"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Buy Side</div>
                    <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {100 - question.yes_percentage}¢
                    </div>
                  </div>
                  <div className={cn("mt-5 font-display text-4xl font-bold", effectivePrediction === "no" ? "text-rose-600" : "text-slate-900")}>
                    NO
                  </div>
                  <div className="mt-3 text-sm text-slate-500">Buy contracts if you think the event does not happen.</div>
                </button>
              </div>
            )}

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-900">Contracts</span>
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <Coins className="h-4 w-4 text-slate-500" />
                  <span className="font-display text-lg font-bold text-slate-950">{points}</span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPoints(value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                      points === value
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {value === maxBet ? `Max ${value}` : `${value} contracts`}
                  </button>
                ))}
              </div>

              <Slider
                value={[points]}
                onValueChange={(value) => setPoints(value[0])}
                max={maxBet}
                min={1}
                step={1}
                className="py-5"
              />

              <div className="flex justify-between text-xs text-slate-500">
                <span>1</span>
                <span>{maxBet}</span>
              </div>
            </div>
          </div>

          <div className="space-y-5 bg-slate-50 px-6 py-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-950">Order Summary</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                    {effectivePrediction ? effectivePrediction.toUpperCase() : "Choose a side"}
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                  Market
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Side</span>
                  <span className="font-semibold text-slate-950">{effectivePrediction ? effectivePrediction.toUpperCase() : "-"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Price</span>
                  <span className="font-semibold text-slate-950">{odds}¢</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Contracts</span>
                  <span className="font-semibold text-slate-950">{points}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Potential payout</span>
                  <span className="font-semibold text-slate-950">{potentialWin}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Remaining daily allowance</span>
                  <span className="font-semibold text-slate-950">{pointsRemaining}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                <span>Allowance</span>
                <span>{pointsRemaining} / {userStats.daily_allowance}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                You’re buying contracts at the current implied price. Higher conviction usually means more size, not more decoration.
              </p>
            </div>

            {points > pointsRemaining && (
              <div className="flex items-start gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-4">
                <div className="rounded-full bg-white p-2">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-rose-700">Insufficient daily allowance</div>
                  <div className="mt-1 text-sm text-rose-600">
                    You only have {pointsRemaining} contracts left today.
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="h-12 flex-1 rounded-2xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "h-12 flex-1 rounded-2xl font-semibold transition-all duration-200",
                  effectivePrediction === "yes"
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : effectivePrediction === "no"
                      ? "bg-rose-600 text-white hover:bg-rose-700"
                      : "bg-slate-900 text-white hover:bg-slate-800"
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
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Buy {effectivePrediction ? effectivePrediction.toUpperCase() : ""}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
