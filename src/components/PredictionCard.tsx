'use client'

import { useEffect, useState } from "react";
import { Question, QuestionOption } from "@/types/prediction";
import { cn } from "@/lib/utils";
import { URGENT_HOURS } from "@/lib/config";

interface PredictionCardProps {
  question: Question;
  onBet: (question: Question, prediction: "yes" | "no", optionName?: string) => void;
}

/* --------------------------------- utils ---------------------------------- */

function calculateTimeLeft(endDate: string) {
  const difference = new Date(endDate).getTime() - new Date().getTime();
  if (difference <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true, totalMs: 0 };
  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);
  return { hours, minutes, seconds, expired: false, totalMs: difference };
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endDate));
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);
  return timeLeft;
}

function formatCountdown(time: ReturnType<typeof calculateTimeLeft>) {
  if (time.expired) return "Ended";
  if (time.hours > 48) {
    const days = Math.floor(time.hours / 24);
    return `${days}d left`;
  }
  if (time.hours > 0) return `${time.hours}h ${time.minutes}m`;
  return `${time.minutes}m ${time.seconds}s`;
}

function formatVolume(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

/* -------------------------------- card ------------------------------------ */

export function PredictionCard({ question, onBet }: PredictionCardProps) {
  const timeLeft = useCountdown(question.ends_at);
  const isBinary = question.question_type === "binary";
  const isUrgent = !timeLeft.expired && timeLeft.hours < URGENT_HOURS;

  const yesPrice = question.yes_percentage;
  const noPrice = 100 - question.yes_percentage;

  const yesPayout = Math.round(10000 / Math.max(1, yesPrice));
  const noPayout = Math.round(10000 / Math.max(1, noPrice));

  return (
    <div className={cn(
      "group relative flex w-full flex-col rounded-2xl border bg-card transition-all duration-300",
      isUrgent
        ? "border-destructive/35 hover:border-destructive/55 hover:shadow-[0_0_40px_-16px_hsl(var(--destructive)/0.3)]"
        : "border-border hover:border-[hsl(var(--neon-blue)/0.35)] hover:shadow-[0_0_40px_-16px_hsl(var(--neon-blue)/0.3)]"
    )}>

      {/* Urgency strip */}
      {isUrgent && (
        <div className="flex items-center justify-between rounded-t-2xl border-b border-destructive/20 bg-destructive/10 px-4 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-destructive/80">
              Closing soon
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold tabular-nums text-destructive/90">
            {formatCountdown(timeLeft)}
          </span>
        </div>
      )}

      {/* Top: icon + meta + timer */}
      <div className="flex items-start gap-3 px-4 pt-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-accent">
          {question.thumbnail_url ? (
            <img src={question.thumbnail_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg leading-none">{question.category?.icon ?? "📊"}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-medium text-muted-foreground/70">
            {question.category?.name ?? "Prediction"}
          </div>
          <div className="mt-0.5 text-[14px] font-semibold leading-snug text-foreground line-clamp-2">
            {question.title}
          </div>
        </div>

        {/* Timer chip — only shown when NOT urgent (urgent has the strip above) */}
        {!isUrgent && (
          <div className={cn(
            "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            timeLeft.expired
              ? "border border-border text-muted-foreground/40"
              : "border border-border/50 text-muted-foreground/60"
          )}>
            {formatCountdown(timeLeft)}
          </div>
        )}
      </div>

      {/* Probability bar */}
      <div className="mt-3 px-4">
        <div className="relative h-1 overflow-hidden rounded-full bg-border/50">
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
            style={{
              width: `${yesPrice}%`,
              background: "linear-gradient(90deg, hsl(var(--neon-blue)), hsl(var(--neon-indigo)))",
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground/60">
          <span className="font-medium text-[hsl(var(--neon-blue)/0.9)]">YES {yesPrice}%</span>
          <span className="font-medium text-[hsl(var(--neon-purple)/0.9)]">{noPrice}% NO</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 pt-3">
        {isBinary ? (
          <BinaryButtons
            yesPrice={yesPrice}
            noPrice={noPrice}
            yesPayout={yesPayout}
            noPayout={noPayout}
            onYes={() => onBet(question, "yes")}
            onNo={() => onBet(question, "no")}
          />
        ) : (
          <MultiChoiceList
            options={question.options ?? []}
            onYes={(name) => onBet(question, "yes", name)}
            onNo={(name) => onBet(question, "no", name)}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/40 px-4 py-2.5">
        <div className="text-[11px] text-muted-foreground/60">
          <span className="font-medium text-muted-foreground/80">{formatVolume(question.total_votes)}</span>
          {" "}bets placed
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
          {isBinary ? "Yes / No" : `${question.options?.length ?? 0} options`}
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Binary yes / no buttons -------------------------- */

function BinaryButtons(props: {
  yesPrice: number;
  noPrice: number;
  yesPayout: number;
  noPayout: number;
  onYes: () => void;
  onNo: () => void;
}) {
  const { yesPrice, noPrice, onYes, onNo } = props;

  return (
    <div className="grid grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={onYes}
        className={[
          "flex flex-col items-center justify-center rounded-xl border py-3 transition-all duration-200",
          "border-[hsl(var(--neon-blue)/0.25)] bg-[hsl(var(--neon-blue)/0.08)]",
          "hover:border-[hsl(var(--neon-blue)/0.5)] hover:bg-[hsl(var(--neon-blue)/0.14)]",
          "hover:shadow-[0_0_24px_-10px_hsl(var(--neon-blue)/0.5)]",
        ].join(" ")}
      >
        <span className="font-display text-[22px] font-bold leading-tight text-[hsl(var(--neon-blue))]">YES</span>
        <span className="text-[11px] font-medium text-[hsl(var(--neon-blue)/0.7)]">{yesPrice}% likely</span>
      </button>

      <button
        type="button"
        onClick={onNo}
        className={[
          "flex flex-col items-center justify-center rounded-xl border py-3 transition-all duration-200",
          "border-[hsl(var(--neon-purple)/0.22)] bg-[hsl(var(--neon-purple)/0.08)]",
          "hover:border-[hsl(var(--neon-purple)/0.45)] hover:bg-[hsl(var(--neon-purple)/0.13)]",
          "hover:shadow-[0_0_24px_-10px_hsl(var(--neon-purple)/0.45)]",
        ].join(" ")}
      >
        <span className="font-display text-[22px] font-bold leading-tight text-[hsl(var(--neon-purple))]">NO</span>
        <span className="text-[11px] font-medium text-[hsl(var(--neon-purple)/0.7)]">{noPrice}% likely</span>
      </button>
    </div>
  );
}

/* ----------------------- Multi-choice option rows ------------------------- */

function MultiChoiceList(props: {
  options: QuestionOption[];
  onYes: (name: string) => void;
  onNo: (name: string) => void;
}) {
  const { options, onYes, onNo } = props;

  return (
    <div className="space-y-2">
      {options.map((opt, i) => (
        <MultiOptionRow
          key={`${i}-${opt.name}`}
          option={opt}
          onYes={() => onYes(opt.name)}
          onNo={() => onNo(opt.name)}
        />
      ))}
    </div>
  );
}

function MultiOptionRow(props: { option: QuestionOption; onYes: () => void; onNo: () => void }) {
  const { option, onYes, onNo } = props;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-background/30 px-3 py-2 transition-colors hover:border-border">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground">{option.name}</div>
      </div>

      <div className="w-10 flex-shrink-0 text-right text-[12px] font-semibold text-muted-foreground">
        {option.percentage}%
      </div>

      <div className="flex flex-shrink-0 overflow-hidden rounded-lg border border-border/60">
        <button
          type="button"
          onClick={onYes}
          className="px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--neon-blue))] transition-colors hover:bg-[hsl(var(--neon-blue)/0.12)]"
        >
          Yes
        </button>
        <div className="w-px bg-border/60" />
        <button
          type="button"
          onClick={onNo}
          className="px-3 py-1.5 text-[11px] font-semibold text-[hsl(var(--neon-purple))] transition-colors hover:bg-[hsl(var(--neon-purple)/0.1)]"
        >
          No
        </button>
      </div>
    </div>
  );
}
