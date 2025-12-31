import { Question } from "@/types/prediction";
import { Button } from "@/components/ui/button";
import { Users, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PredictionCardProps {
  question: Question;
  onBet: (question: Question, prediction: 'yes' | 'no') => void;
}

export function PredictionCard({ question, onBet }: PredictionCardProps) {
  const noPercentage = 100 - question.yes_percentage;
  const endsIn = formatDistanceToNow(new Date(question.ends_at), { addSuffix: true });

  return (
    <div className="glass-card-hover group flex flex-col p-5">
      {/* Category Badge */}
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {question.category.icon} {question.category.name}
        </span>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Ends {endsIn}</span>
        </div>
      </div>

      {/* Question */}
      <h3 className="mb-4 flex-1 font-display text-lg font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
        {question.title}
      </h3>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="progress-bar">
          <div
            className="progress-bar-fill bg-success"
            style={{ width: `${question.yes_percentage}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-sm">
          <span className="font-medium text-success">{question.yes_percentage}% Yes</span>
          <span className="font-medium text-destructive">{noPercentage}% No</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{question.total_votes.toLocaleString()} predictions</span>
        </div>
      </div>

      {/* Bet Buttons */}
      <div className="flex gap-2">
        <Button
          variant="yes"
          className="flex-1"
          onClick={() => onBet(question, 'yes')}
        >
          Yes {question.yes_percentage}¢
        </Button>
        <Button
          variant="no"
          className="flex-1"
          onClick={() => onBet(question, 'no')}
        >
          No {noPercentage}¢
        </Button>
      </div>
    </div>
  );
}
