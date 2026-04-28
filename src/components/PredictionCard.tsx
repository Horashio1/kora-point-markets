// PredictionCard.tsx
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Question, QuestionOption } from "@/types/prediction";

interface PredictionCardProps {
  question: Question;
  onBet: (question: Question, prediction: "yes" | "no", optionName?: string) => void;
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

/* -------------------------------- component -------------------------------- */
export function PredictionCard({ question, onBet }: PredictionCardProps) {
  const timeLeft = useCountdown(question.ends_at);
  const isBinary = question.question_type === "binary";

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
        "hover:border-primary/40 hover:shadow-[0_0_40px_-16px_hsl(var(--neon-blue)/0.35)]",
      ].join(" ")}
    >
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl bg-accent flex items-center justify-center flex-shrink-0 border border-border/60">
            {question.thumbnail_url ? (
              <img src={question.thumbnail_url} alt={question.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg">{question.category?.icon || "📊"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-muted-foreground leading-none">
              {question.category?.name || "Prediction"}
            </div>
            <div className="mt-1 text-[15px] font-semibold leading-snug text-foreground line-clamp-2">
              {question.title}
            </div>
          </div>

          <div className="text-[12px] text-muted-foreground/80 whitespace-nowrap">{formatCountdown(timeLeft)}</div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-3">
        {isBinary ? (
          <BinarySoftTron
            yesPrice={yesPrice}
            noPrice={noPrice}
            yesReturn={yesReturn}
            noReturn={noReturn}
            onYes={() => onBet(question, "yes")}
            onNo={() => onBet(question, "no")}
          />
        ) : (
          <MultiChoiceList
            options={question.options || []}
            onYes={(name) => onBet(question, "yes", name)}
            onNo={(name) => onBet(question, "no", name)}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="text-[12px] text-muted-foreground">
          <span className="text-muted-foreground/70">$</span>
          <span className="font-medium text-muted-foreground">{marketVolume}</span>
        </div>

        <button
          type="button"
          className={[
            "h-9 w-9 rounded-full border",
            "border-border bg-card/80 shadow-sm",
            "flex items-center justify-center transition",
            "hover:bg-accent hover:border-primary/30",
          ].join(" ")}
          aria-label="Add"
        >
          <Plus className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

/* ------------------ Binary: dark Tron soft pills (blue / purple) ------------------ */
function BinarySoftTron(props: {
  yesPrice: number;
  noPrice: number;
  yesReturn: number;
  noReturn: number;
  onYes: () => void;
  onNo: () => void;
}) {
  const { yesPrice, noPrice, yesReturn, noReturn, onYes, onNo } = props;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        {/* YES pill (blue) */}
        <button
          type="button"
          onClick={onYes}
          className={[
            "h-10 rounded-lg border",
            "border-[hsl(var(--neon-blue)/0.25)]",
            "bg-[hsl(var(--neon-blue)/0.10)] hover:bg-[hsl(var(--neon-blue)/0.16)]",
            "text-[hsl(var(--neon-blue))]",
            "flex items-center justify-center",
            "transition",
            "shadow-[0_0_30px_-18px_hsl(var(--neon-blue)/0.55)]",
          ].join(" ")}
        >
          <span className="text-[13px] font-semibold">Yes</span>
          <span className="ml-2 text-[14px] font-extrabold">{yesPrice}¢</span>
        </button>

        {/* NO pill (purple but subdued) */}
        <button
          type="button"
          onClick={onNo}
          className={[
            "h-10 rounded-lg border",
            "border-[hsl(var(--neon-purple)/0.22)]",
            "bg-[hsl(var(--neon-purple)/0.10)] hover:bg-[hsl(var(--neon-purple)/0.14)]",
            "text-[hsl(var(--neon-purple))]",
            "flex items-center justify-center",
            "transition",
            "shadow-[0_0_30px_-18px_hsl(var(--neon-purple)/0.35)]",
          ].join(" ")}
        >
          <span className="text-[13px] font-semibold">No</span>
          <span className="ml-2 text-[14px] font-extrabold">{noPrice}¢</span>
        </button>
      </div>

      {/* $100 -> $X row (aligned under each pill) */}
      <div className="mt-3 grid grid-cols-2 gap-4 text-[12px]">
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
    </div>
  );
}

/* ----------------------- Multi: dark Tron rows ----------------------- */
function MultiChoiceList(props: {
  options: QuestionOption[];
  onYes: (name: string) => void;
  onNo: (name: string) => void;
}) {
  const { options, onYes, onNo } = props;

  return (
    <div className="space-y-4">
      {options.map((opt) => (
        <MultiOptionRow key={opt.name} option={opt} onYes={() => onYes(opt.name)} onNo={() => onNo(opt.name)} />
      ))}
    </div>
  );
}

function MultiOptionRow(props: { option: QuestionOption; onYes: () => void; onNo: () => void }) {
  const { option, onYes, onNo } = props;

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-foreground">{option.name}</div>
      </div>

      <div className="w-12 text-right text-[14px] font-semibold text-foreground">{option.percentage}%</div>

      {/* Neon pill group (blue/purple, dark-mode friendly) */}
      <div
        className={[
          "inline-flex overflow-hidden rounded-full border",
          "border-border/70",
          "bg-gradient-to-r",
          "from-[hsl(var(--neon-blue)/0.12)]",
          "via-[hsl(var(--neon-indigo)/0.10)]",
          "to-[hsl(var(--neon-purple)/0.08)]",
          "shadow-[0_0_26px_-18px_hsl(var(--neon-blue)/0.35)]",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={onYes}
          className={[
            "px-3 py-1 text-[12px] font-medium",
            "text-[hsl(var(--neon-blue))]",
            "hover:bg-white/10 transition",
          ].join(" ")}
        >
          Yes
        </button>
        <div className="w-px bg-border/70" />
        <button
          type="button"
          onClick={onNo}
          className={[
            "px-3 py-1 text-[12px] font-medium",
            "text-[hsl(var(--neon-purple))]",
            "hover:bg-white/10 transition",
          ].join(" ")}
        >
          No
        </button>
      </div>
    </div>
  );
}
