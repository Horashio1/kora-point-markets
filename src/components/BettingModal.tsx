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
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    setIsDesktop(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

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
  const isDesktop = useIsDesktop();

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

  const yesOdds = useMemo(() => {
    if (!question) return 50;
    if (optionName && question.options) {
      return question.options.find((opt) => opt.name === optionName)?.percentage ?? 50;
    }
    return question.yes_percentage ?? 50;
  }, [optionName, question]);

  const noOdds = 100 - yesOdds;

  const odds = useMemo(() => {
    if (!effectivePrediction) return 50;
    return effectivePrediction === "yes" ? yesOdds : noOdds;
  }, [effectivePrediction, yesOdds, noOdds]);

  const potentialWin = useMemo(() => {
    const safeOdds = Math.max(1, odds);
    return Math.round(points * (100 / safeOdds));
  }, [points, odds]);

  const quickAmounts = useMemo(
    () => [10, 25, 50, maxBet].filter((v, i, arr) => v <= maxBet && arr.indexOf(v) === i),
    [maxBet]
  );

  const progressPercentage = Math.min(100, (pointsRemaining / userStats.daily_allowance) * 100);

  const setPrediction = (p: "yes" | "no") => {
    setLocalPrediction(p);
    onPredictionChange?.(p);
  };

  const handlePlaceBet = async () => {
    if (!effectivePrediction) { toast.error("Pick YES or NO first"); return; }
    if (points > pointsRemaining) { toast.error("Not enough points available today!"); return; }
    if (points > userStats.total_points) { toast.error("Not enough points!"); return; }
    try {
      await placeBet.mutateAsync({
        question_id: question!.id,
        prediction: effectivePrediction,
        points_wagered: points,
        option_name: optionName || null,
      });
      const betDescription = optionName
        ? `${effectivePrediction.toUpperCase()} on "${optionName}"`
        : effectivePrediction.toUpperCase();
      toast.success(
        `Bet placed! ${points} pts on ${betDescription}`,
        { description: `If you're right: ${potentialWin} pts` }
      );
      onClose();
      setPoints(10);
      setLocalPrediction(null);
      onPredictionChange?.(null);
    } catch {
      // handled in mutation
    }
  };

  // ── Shared: YES / NO selector ──────────────────────────────────────────────

  const predictionSelector = (
    <div className="grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => setPrediction("yes")}
        className={cn(
          "relative rounded-xl border px-4 py-4 text-left transition-all duration-200 outline-none",
          effectivePrediction === "yes"
            ? "border-[hsl(var(--neon-blue)/0.5)] bg-[hsl(var(--neon-blue)/0.1)]"
            : "border-border bg-background/40 hover:border-[hsl(var(--neon-blue)/0.3)] hover:bg-[hsl(var(--neon-blue)/0.05)]"
        )}
        style={effectivePrediction === "yes" ? {
          boxShadow: "0 0 36px -12px hsl(var(--neon-blue)/0.55), inset 0 0 0 1px hsl(var(--neon-blue)/0.15)"
        } : undefined}
      >
        <div className={cn("font-display text-3xl font-bold tracking-tight",
          effectivePrediction === "yes" ? "text-[hsl(var(--neon-blue))]" : "text-foreground")}>YES</div>
        <div className="mt-1 text-sm font-semibold text-muted-foreground">{yesOdds}% chance</div>
        <div className="mt-0.5 text-xs text-muted-foreground/60">It happens</div>
      </button>

      <button
        type="button"
        onClick={() => setPrediction("no")}
        className={cn(
          "relative rounded-xl border px-4 py-4 text-left transition-all duration-200 outline-none",
          effectivePrediction === "no"
            ? "border-[hsl(var(--neon-purple)/0.5)] bg-[hsl(var(--neon-purple)/0.1)]"
            : "border-border bg-background/40 hover:border-[hsl(var(--neon-purple)/0.3)] hover:bg-[hsl(var(--neon-purple)/0.05)]"
        )}
        style={effectivePrediction === "no" ? {
          boxShadow: "0 0 36px -12px hsl(var(--neon-purple)/0.55), inset 0 0 0 1px hsl(var(--neon-purple)/0.15)"
        } : undefined}
      >
        <div className={cn("font-display text-3xl font-bold tracking-tight",
          effectivePrediction === "no" ? "text-[hsl(var(--neon-purple))]" : "text-foreground")}>NO</div>
        <div className="mt-1 text-sm font-semibold text-muted-foreground">{noOdds}% chance</div>
        <div className="mt-0.5 text-xs text-muted-foreground/60">It doesn&apos;t</div>
      </button>
    </div>
  );

  // ── Shared: points picker ──────────────────────────────────────────────────

  const pointsPicker = (
    <div className="rounded-xl border border-border bg-background/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Points to bet</span>
        <span className="font-display text-2xl font-bold text-foreground">{points}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {quickAmounts.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPoints(value)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-150 outline-none",
              points === value
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
            )}
          >
            {value === maxBet ? `Max ${value}` : value}
          </button>
        ))}
      </div>
      <Slider value={[points]} onValueChange={(v) => setPoints(v[0])} max={maxBet} min={1} step={1} className="py-1" />
      <div className="flex justify-between text-[11px] text-muted-foreground/50">
        <span>1</span><span>{maxBet}</span>
      </div>
    </div>
  );

  // ── Shared: footer buttons ─────────────────────────────────────────────────

  const footerButtons = (
    <div className="flex gap-3">
      <Button
        variant="outline"
        className="h-11 flex-1 rounded-xl border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={onClose}
      >
        Cancel
      </Button>
      <button
        type="button"
        onClick={handlePlaceBet}
        disabled={!effectivePrediction || points > pointsRemaining || points > userStats.total_points || placeBet.isPending}
        className={cn(
          "h-11 flex-[2] rounded-xl text-sm font-semibold text-white transition-all duration-200",
          "disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        )}
        style={effectivePrediction ? {
          background: effectivePrediction === "yes"
            ? "linear-gradient(135deg, hsl(var(--neon-blue)), hsl(var(--neon-indigo)))"
            : "linear-gradient(135deg, hsl(var(--neon-purple)), hsl(var(--neon-indigo)))",
          boxShadow: effectivePrediction === "yes"
            ? "0 0 24px -8px hsl(var(--neon-blue)/0.6)"
            : "0 0 24px -8px hsl(var(--neon-purple)/0.6)",
        } : { background: "hsl(var(--secondary))" }}
      >
        {placeBet.isPending ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Placing...</>
        ) : (
          <><Zap className="h-4 w-4" />Confirm {effectivePrediction ? effectivePrediction.toUpperCase() : "—"}</>
        )}
      </button>
    </div>
  );

  // ── Mobile: simplified bottom sheet ───────────────────────────────────────
  if (!isDesktop) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DrawerContent className="bg-card border-border flex flex-col max-h-[90dvh]">
          <DrawerTitle className="sr-only">Place Bet</DrawerTitle>
          <DrawerDescription className="sr-only">
            Place a bet on &quot;{question?.title ?? ""}&quot;
          </DrawerDescription>

          {/* Question title */}
          <div className="px-5 pt-5 pb-4 flex-shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1.5">Place a Bet</p>
            {question && (
              <p className="text-sm leading-relaxed text-foreground line-clamp-2">{question.title}</p>
            )}
            {optionName && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--neon-blue)/0.3)] bg-[hsl(var(--neon-blue)/0.1)] px-3 py-1 text-xs font-medium text-[hsl(var(--neon-blue))]">
                {optionName}
              </div>
            )}
          </div>

          <div className="overflow-y-auto flex-1 px-5 space-y-4 pb-4">
            {!question ? (
              <p className="text-sm text-muted-foreground">No question selected.</p>
            ) : (
              <>
                {/* YES / NO */}
                {predictionSelector}

                {/* Points picker */}
                {pointsPicker}

                {/* Win indicator */}
                {effectivePrediction && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background/20 px-4 py-3">
                    <span className="text-sm text-muted-foreground">If you&apos;re right</span>
                    <span
                      className="font-display text-xl font-bold"
                      style={{ color: effectivePrediction === "yes" ? "hsl(var(--neon-blue))" : "hsl(var(--neon-purple))" }}
                    >
                      {potentialWin} pts
                    </span>
                  </div>
                )}

                {/* Insufficient points warning */}
                {points > pointsRemaining && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-sm font-semibold text-destructive">
                      Only {pointsRemaining} pts available today
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 border-t border-border px-5 pb-8 pt-4">
            {/* Available points bar */}
            <div className="mb-3">
              <div className="flex justify-between text-[11px] text-muted-foreground/50 mb-1.5">
                <span>Available today</span>
                <span>{pointsRemaining} pts</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-border/60">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                    background: "linear-gradient(90deg, hsl(var(--neon-blue)), hsl(var(--neon-purple)))",
                  }}
                />
              </div>
            </div>
            {footerButtons}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Desktop: centered dialog ─────────────────────────────────────────────────
  const desktopSummary = (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-muted-foreground/70">Your prediction</div>
        <div className={cn("font-display text-xl font-bold",
          effectivePrediction === "yes" ? "text-[hsl(var(--neon-blue))]"
            : effectivePrediction === "no" ? "text-[hsl(var(--neon-purple))]"
            : "text-muted-foreground")}>
          {effectivePrediction ? `${effectivePrediction.toUpperCase()} — ${effectivePrediction === "yes" ? "It happens" : "It doesn't"}` : "Pick a side"}
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        {[
          { label: "Your bet", value: `${points} pts` },
          { label: "If you're right", value: `${potentialWin} pts` },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div>
        <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
          <span>Available today</span>
          <span>{pointsRemaining} / {userStats.daily_allowance} pts</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPercentage}%`,
              background: "linear-gradient(90deg, hsl(var(--neon-blue)), hsl(var(--neon-purple)))",
            }}
          />
        </div>
      </div>

      {points > pointsRemaining && (
        <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
          <div>
            <div className="text-sm font-semibold text-destructive">Not enough points</div>
            <div className="mt-0.5 text-xs text-destructive/80">Only {pointsRemaining} pts left today.</div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl rounded-2xl border border-border bg-card p-0 overflow-hidden gap-0 shadow-[0_32px_80px_rgba(0,0,0,0.7),0_0_60px_-30px_hsl(var(--neon-blue)/0.18)]">
        <DialogTitle className="sr-only">Place Bet</DialogTitle>
        <DialogDescription className="sr-only">
          Place a bet on &quot;{question?.title ?? ""}&quot;
        </DialogDescription>

        {/* Header */}
        <div className="border-b border-border bg-accent px-5 py-4 flex-shrink-0">
          <div className="font-display text-2xl font-bold text-foreground">Place a Bet</div>
          {question && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">{question.title}</p>
          )}
          {optionName && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--neon-blue)/0.3)] bg-[hsl(var(--neon-blue)/0.1)] px-3 py-1 text-xs font-medium text-[hsl(var(--neon-blue))]">
              {optionName}
            </div>
          )}
        </div>

        {!question ? (
          <div className="p-6">
            <p className="text-sm text-muted-foreground mb-4">No question selected.</p>
            <Button variant="outline" onClick={onClose} className="w-full border-border bg-accent text-foreground hover:bg-border">
              Close
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1.4fr_1fr]">
            {/* Left: controls */}
            <div className="px-6 py-6 space-y-5 border-b border-border lg:border-b-0 lg:border-r">
              {predictionSelector}
              {pointsPicker}
            </div>

            {/* Right: summary + footer (lg+) */}
            <div className="hidden lg:flex flex-col gap-5 bg-background/20 px-6 py-6">
              {desktopSummary}
              <div className="mt-auto pt-1">{footerButtons}</div>
            </div>

            {/* Footer for < lg */}
            <div className="lg:hidden px-6 pb-6 pt-4 border-t border-border col-span-full">
              {footerButtons}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
