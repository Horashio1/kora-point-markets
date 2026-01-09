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
    <div className="relative w-full rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            {question.thumbnail_url ? (
              <img src={question.thumbnail_url} alt={question.title} className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg">{question.category?.icon || "📊"}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-[12px] text-gray-600 leading-none">{question.category?.name || "Prediction"}</div>
            <div className="mt-1 text-[15px] font-semibold leading-snug text-gray-900 line-clamp-2">
              {question.title}
            </div>
          </div>

          <div className="text-[12px] text-gray-500 whitespace-nowrap">{formatCountdown(timeLeft)}</div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pt-4 pb-3">
        {isBinary ? (
          <BinarySoftKalshi
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
        <div className="text-[12px] text-gray-400">
          <span className="text-gray-400">$</span>
          <span className="font-medium text-gray-400">{marketVolume}</span>
        </div>

        <button
          type="button"
          className="h-9 w-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center transition hover:bg-gray-50"
          aria-label="Add"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>
    </div>
  );
}

/* ------------------ Binary: SUPREME COURT (soft pill buttons) ------------------ */
/**
 * Matches the screenshot:
 * - Two soft pills (light blue, light purple)
 * - Text is inline: "Yes 26¢" and "No 77¢"
 * - Under each pill: "$100 → $366" and "$100 → $128" with green payout
 */
function BinarySoftKalshi(props: {
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
        {/* YES pill */}
        <button
          type="button"
          onClick={onYes}
          className={[
            "h-10 rounded-lg",
            "bg-blue-50 hover:bg-blue-100",
            "text-blue-700",
            "flex items-center justify-center",
            "transition",
          ].join(" ")}
        >
          <span className="text-[13px] font-semibold">Yes</span>
          <span className="ml-2 text-[14px] font-extrabold">{yesPrice}¢</span>
        </button>

        {/* NO pill */}
        <button
          type="button"
          onClick={onNo}
          className={[
            "h-10 rounded-lg",
            "bg-purple-50 hover:bg-purple-100",
            "text-purple-700",
            "flex items-center justify-center",
            "transition",
          ].join(" ")}
        >
          <span className="text-[13px] font-semibold">No</span>
          <span className="ml-2 text-[14px] font-extrabold">{noPrice}¢</span>
        </button>
      </div>

      {/* $100 -> $X row (aligned under each pill) */}
      <div className="mt-3 grid grid-cols-2 gap-4 text-[12px]">
        <div className="text-center text-gray-400">
          <span>$100 </span>
          <span className="text-gray-300">→ </span>
          <span className="font-semibold text-emerald-500">${yesReturn}</span>
        </div>
        <div className="text-center text-gray-400">
          <span>$100 </span>
          <span className="text-gray-300">→ </span>
          <span className="font-semibold text-emerald-500">${noReturn}</span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------- Multi: FED DECISION style rows ----------------------- */
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
        <div className="truncate text-[14px] font-medium text-gray-900">{option.name}</div>
      </div>

      <div className="w-12 text-right text-[14px] font-semibold text-gray-900">{option.percentage}%</div>

      {/* Kalshi-like purple gradient Yes/No pill */}
      <div className="inline-flex overflow-hidden rounded-full border border-purple-100 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 shadow-sm">
        <button
          type="button"
          onClick={onYes}
          className="px-3 py-1 text-[12px] font-medium text-indigo-700 hover:bg-white/70 transition"
        >
          Yes
        </button>
        <div className="w-px bg-purple-100" />
        <button
          type="button"
          onClick={onNo}
          className="px-3 py-1 text-[12px] font-medium text-purple-700 hover:bg-white/70 transition"
        >
          No
        </button>
      </div>
    </div>
  );
}
