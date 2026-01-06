import { Question, QuestionOption } from "@/types/prediction";
import { Button } from "@/components/ui/button";
import { Clock, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PredictionCardProps {
  question: Question;
  onBet: (question: Question, prediction: 'yes' | 'no', optionName?: string) => void;
}

export function PredictionCard({ question, onBet }: PredictionCardProps) {
  const noPercentage = 100 - question.yes_percentage;
  const endsIn = formatDistanceToNow(new Date(question.ends_at), { addSuffix: true });
  const isBinary = question.question_type === 'binary';

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
          {isBinary && (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-foreground">{question.yes_percentage}%</span>
            </div>
          )}
        </div>
      </div>

      {/* Betting Options */}
      <div className="space-y-2">
        {isBinary ? (
          /* Binary Yes/No layout */
          <div className="flex gap-2">
            <Button
              variant="yes"
              size="sm"
              className="flex-1 h-9"
              onClick={() => onBet(question, 'yes')}
            >
              Yes
            </Button>
            <Button
              variant="no"
              size="sm"
              className="flex-1 h-9"
              onClick={() => onBet(question, 'no')}
            >
              No
            </Button>
          </div>
        ) : (
          /* Multi-choice layout - show options with Yes/No for each */
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

      {/* Footer with stats and time */}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">
          ${question.total_votes.toLocaleString()}
        </span>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3" />
          <span>{endsIn}</span>
          <button className="p-1 hover:bg-secondary rounded-full transition-colors">
            <Plus className="h-3 w-3" />
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
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <span className="text-sm text-foreground truncate">{option.name}</span>
        <span className="text-sm font-semibold text-foreground">{option.percentage}%</span>
      </div>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs text-success border-success/30 hover:bg-success/10 hover:text-success"
          onClick={onYes}
        >
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-6 px-2 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
          onClick={onNo}
        >
          No
        </Button>
      </div>
    </div>
  );
}