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
      {/* Header with Thumbnail and Title */}
      <div className="mb-4 flex gap-4">
        <img
          src={question.thumbnail_url}
          alt={question.title}
          className="h-14 w-14 rounded-xl object-cover ring-2 ring-border/50"
        />
        <div className="flex flex-1 flex-col">
          <h3 className="font-display text-base font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {question.title}
          </h3>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">
              {question.category.icon} {question.category.name}
            </span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{endsIn}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Betting Options */}
      <div className="space-y-3">
        {/* Yes Option */}
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Yes</span>
            <span className="font-semibold text-success">{question.yes_percentage}%</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="yes"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onBet(question, 'yes')}
            >
              Yes
            </Button>
            <Button
              variant="no"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onBet(question, 'no')}
            >
              No
            </Button>
          </div>
        </div>

        {/* No Option */}
        <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">No</span>
            <span className="font-semibold text-destructive">{noPercentage}%</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="yes"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onBet(question, 'yes')}
            >
              Yes
            </Button>
            <Button
              variant="no"
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onBet(question, 'no')}
            >
              No
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{question.total_votes.toLocaleString()} predictions</span>
        </div>
      </div>
    </div>
  );
}
