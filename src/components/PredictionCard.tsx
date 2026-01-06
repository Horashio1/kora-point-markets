import { Question, QuestionOption } from "@/types/prediction";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";

interface PredictionCardProps {
  question: Question;
  onBet: (question: Question, prediction: 'yes' | 'no', optionName?: string) => void;
}

function useCountdown(endDate: string) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(endDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endDate));
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  return timeLeft;
}

function calculateTimeLeft(endDate: string) {
  const difference = new Date(endDate).getTime() - new Date().getTime();
  
  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const hours = Math.floor(difference / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return { hours, minutes, seconds, expired: false };
}

function formatCountdown(time: { hours: number; minutes: number; seconds: number; expired: boolean }) {
  if (time.expired) return "Ended";
  return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
}

function calculateWinnings(percentage: number): number {
  // If you bet $100 on an outcome with X% probability, potential winnings = 100 / (percentage/100)
  if (percentage <= 0) return 0;
  return Math.round((100 / percentage) * 100);
}

export function PredictionCard({ question, onBet }: PredictionCardProps) {
  const noPercentage = 100 - question.yes_percentage;
  const timeLeft = useCountdown(question.ends_at);
  const isBinary = question.question_type === 'binary';

  const yesWinnings = calculateWinnings(question.yes_percentage);
  const noWinnings = calculateWinnings(noPercentage);

  return (
    <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50 hover:shadow-md transition-shadow">
      {/* Header with Thumbnail and Title */}
      <div className="mb-4 flex gap-4">
        <img
          src={question.thumbnail_url}
          alt={question.title}
          className="h-14 w-14 rounded-xl object-cover"
        />
        <div className="flex flex-1 flex-col justify-center">
          <h3 className="font-medium text-sm leading-tight text-foreground line-clamp-2">
            {question.title}
          </h3>
        </div>
        {isBinary && (
          <span className="text-2xl font-bold text-foreground self-center">
            {question.yes_percentage}%
          </span>
        )}
      </div>

      {/* Betting Options */}
      <div className="space-y-3">
        {isBinary ? (
          /* Binary Yes/No layout */
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 bg-success/10 border-success/20 text-success hover:bg-success/20 hover:text-success font-medium"
                onClick={() => onBet(question, 'yes')}
              >
                Yes
              </Button>
              <span className="text-xs text-muted-foreground mt-1 text-center">
                $100 → <span className="text-success font-medium">${yesWinnings}</span>
              </span>
            </div>
            <div className="flex-1 flex flex-col">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-10 bg-destructive/10 border-destructive/20 text-destructive hover:bg-destructive/20 hover:text-destructive font-medium"
                onClick={() => onBet(question, 'no')}
              >
                No
              </Button>
              <span className="text-xs text-muted-foreground mt-1 text-center">
                $100 → <span className="text-destructive font-medium">${noWinnings}</span>
              </span>
            </div>
          </div>
        ) : (
          /* Multi-choice layout */
          <div className="space-y-2">
            {question.options?.slice(0, 3).map((option) => (
              <MultiOptionRow
                key={option.name}
                option={option}
                onYes={() => onBet(question, 'yes', option.name)}
                onNo={() => onBet(question, 'no', option.name)}
              />
            ))}
            {question.options && question.options.length > 3 && (
              <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                +{question.options.length - 3} more options
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer with stats and countdown */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">${question.total_votes.toLocaleString()}</span>
          <span>·</span>
          <span>Daily</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-destructive font-medium">{formatCountdown(timeLeft)}</span>
          <button className="p-1 hover:bg-secondary rounded-full transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface MultiOptionRowProps {
  option: QuestionOption;
  onYes: () => void;
  onNo: () => void;
}

function MultiOptionRow({ option, onYes, onNo }: MultiOptionRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-foreground flex-1 min-w-0 truncate">{option.name}</span>
      <span className="text-sm font-semibold text-foreground w-12 text-right">{option.percentage}%</span>
      <div className="flex gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs text-success hover:bg-success/10 hover:text-success"
          onClick={onYes}
        >
          Yes
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={onNo}
        >
          No
        </Button>
      </div>
    </div>
  );
}
