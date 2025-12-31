import { Question } from "@/types/prediction";
import { Button } from "@/components/ui/button";
import { Users, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface FeaturedPredictionProps {
  question: Question;
  onBet: (question: Question, prediction: 'yes' | 'no') => void;
}

export function FeaturedPrediction({ question, onBet }: FeaturedPredictionProps) {
  const noPercentage = 100 - question.yes_percentage;
  const endsIn = formatDistanceToNow(new Date(question.ends_at), { addSuffix: true });

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-primary/5">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/10" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-medium text-primary">
                <TrendingUp className="h-3 w-3" />
                Featured Market
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                {question.category.icon} {question.category.name}
              </span>
            </div>

            <h2 className="font-display text-2xl font-bold leading-tight text-foreground md:text-3xl lg:text-4xl">
              {question.title}
            </h2>

            <p className="max-w-2xl text-muted-foreground">
              {question.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{question.total_votes.toLocaleString()} predictions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>Ends {endsIn}</span>
              </div>
            </div>
          </div>

          {/* Betting Panel */}
          <div className="w-full space-y-4 lg:w-80">
            {/* Odds Display */}
            <div className="glass-card p-4">
              <div className="mb-3 text-center text-sm text-muted-foreground">Current Odds</div>
              <div className="flex justify-between gap-4">
                <div className="flex-1 rounded-lg bg-success/10 p-3 text-center">
                  <div className="font-display text-3xl font-bold text-success">
                    {question.yes_percentage}%
                  </div>
                  <div className="text-sm text-success/80">Yes</div>
                </div>
                <div className="flex-1 rounded-lg bg-destructive/10 p-3 text-center">
                  <div className="font-display text-3xl font-bold text-destructive">
                    {noPercentage}%
                  </div>
                  <div className="text-sm text-destructive/80">No</div>
                </div>
              </div>
            </div>

            {/* Bet Buttons */}
            <div className="flex gap-3">
              <Button
                variant="yes"
                size="lg"
                className="flex-1"
                onClick={() => onBet(question, 'yes')}
              >
                Bet Yes
              </Button>
              <Button
                variant="no"
                size="lg"
                className="flex-1"
                onClick={() => onBet(question, 'no')}
              >
                Bet No
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
