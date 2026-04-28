import { useEffect, useMemo, useState } from "react";
import { Question } from "@/types/prediction";
import { Users, Clock } from "lucide-react";

interface FeaturedPredictionProps {
  question: Question;
  onBet: (question: Question, prediction: "yes" | "no") => void;
}

/* ----------------------------- countdown utils ----------------------------- */
function calculateTimeLeft(endDate: string) {
  const difference = new Date(endDate).getTime() - new Date().getTime();
  if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };

  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  return { hours, minutes, seconds, expired: false };
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endDate));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);
  return timeLeft;
}

function formatCountdown(time: { hours: number; minutes: number; seconds: number; expired: boolean }) {
  if (time.expired) return "Ended";
  if (time.hours > 24) {
    const days = Math.floor(time.hours / 24);
    return `${days}d ${time.hours % 24}h`;
  }
  if (time.hours > 0) return `${time.hours}h ${time.minutes}m`;
  return `${time.minutes}m ${time.seconds}s`;
}

/* ------------------------------ pricing utils ------------------------------ */
function percentageToPrice(percentage: number): number {
  return Math.round(percentage);
}

function calculatePotentialReturn(priceInCents: number): number {
  if (priceInCents <= 0 || priceInCents >= 100) return 0;
  return Math.round(10000 / priceInCents);
}

export function FeaturedPrediction({ question, onBet }: FeaturedPredictionProps) {
  const timeLeft = useCountdown(question.ends_at);

  const yesPrice = useMemo(() => percentageToPrice(question.yes_percentage), [question.yes_percentage]);
  const noPrice = useMemo(() => percentageToPrice(100 - question.yes_percentage), [question.yes_percentage]);

  const yesReturn = useMemo(() => calculatePotentialReturn(yesPrice), [yesPrice]);
  const noReturn = useMemo(() => calculatePotentialReturn(noPrice), [noPrice]);

  const marketVolume = useMemo(() => question.total_votes.toLocaleString(), [question.total_votes]);

  return (
    <div
      className={[
        "relative w-full rounded-2xl border",
        "border-border bg-card text-card-foreground",
        "shadow-sm transition",
        "hover:border-primary/40 hover:shadow-[0_0_60px_-18px_hsl(var(--neon-blue)/0.35)]",
      ].join(" ")}
    >
      <div className="p-6 md:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          {/* Left side */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 overflow-hidden rounded-xl bg-accent border border-border flex items-center justify-center flex-shrink-0">
                {question.thumbnail_url ? (
                  <img src={question.thumbnail_url} alt={question.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xl">{question.category?.icon || "📊"}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-muted-foreground mb-1">
                  {question.category?.name || "Prediction"}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight text-foreground mb-2">
                  {question.title}
                </h2>
                {question.description && (
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    {question.description}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 opacity-80" />
                    <span>{marketVolume} predictions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 opacity-80" />
                    <span>{formatCountdown(timeLeft)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side betting panel */}
          <div className="w-full space-y-5 lg:w-80">
            <div className="grid grid-cols-2 gap-4">
              {/* YES */}
              <button
                type="button"
                onClick={() => onBet(question, "yes")}
                className={[
                  "h-14 rounded-lg border",
                  "border-primary/25",
                  "bg-primary/10 hover:bg-primary/18",
                  "text-primary",
                  "flex items-center justify-center",
                  "transition",
                  "shadow-[0_0_36px_-18px_hsl(var(--neon-blue)/0.55)]",
                ].join(" ")}
              >
                <span className="text-[15px] font-semibold">Yes</span>
                <span className="ml-2 text-[16px] font-extrabold">{yesPrice}¢</span>
              </button>

              {/* NO */}
              <button
                type="button"
                onClick={() => onBet(question, "no")}
                className={[
                  "h-14 rounded-lg border",
                  "border-[hsl(var(--neon-purple)/0.22)]",
                  "bg-[hsl(var(--neon-purple)/0.10)] hover:bg-[hsl(var(--neon-purple)/0.16)]",
                  "text-[hsl(var(--neon-purple))]",
                  "flex items-center justify-center",
                  "transition",
                  "shadow-[0_0_36px_-18px_hsl(var(--neon-purple)/0.35)]",
                ].join(" ")}
              >
                <span className="text-[15px] font-semibold">No</span>
                <span className="ml-2 text-[16px] font-extrabold">{noPrice}¢</span>
              </button>
            </div>

            {/* $100 → returns */}
            <div className="grid grid-cols-2 gap-4 text-[13px]">
              <div className="text-center text-muted-foreground">
                <span>$100 </span>
                <span className="text-muted-foreground/60">→ </span>
                <span className="font-semibold text-emerald-400">${yesReturn}</span>
              </div>
              <div className="text-center text-muted-foreground">
                <span>$100 </span>
                <span className="text-muted-foreground/60">→ </span>
                <span className="font-semibold text-emerald-400">${noReturn}</span>
              </div>
            </div>

            {/* Market volume */}
            <div className="pt-4 border-t border-border/70">
              <div className="text-[12px] text-muted-foreground text-center">
                <span className="text-muted-foreground/70">$</span>
                <span className="font-medium text-muted-foreground">{marketVolume}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
