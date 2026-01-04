import { useState } from "react";
import { Header } from "@/components/Header";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PredictionCard } from "@/components/PredictionCard";
import { FeaturedPrediction } from "@/components/FeaturedPrediction";
import { BettingModal } from "@/components/BettingModal";
import { StatsBar } from "@/components/StatsBar";
import { useQuestions, useFeaturedQuestion } from "@/hooks/useQuestions";
import { Question } from "@/types/prediction";
import { TrendingUp, Loader2 } from "lucide-react";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<'yes' | 'no' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: questions = [], isLoading: questionsLoading } = useQuestions();
  const { data: featuredQuestion } = useFeaturedQuestion();
  
  const filteredQuestions = questions.filter((q) => {
    if (selectedCategory === null) return true;
    return q.category_id === selectedCategory;
  });

  const handleBet = (question: Question, prediction: 'yes' | 'no') => {
    setSelectedQuestion(question);
    setSelectedPrediction(prediction);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        
        <div className="container relative mx-auto px-4">
          {/* Hero Text */}
          <div className="mx-auto mb-8 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <TrendingUp className="h-4 w-4" />
              <span>Sri Lanka's #1 Prediction Market</span>
            </div>
            <h1 className="mb-4 font-display text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
              Predict the Future,{" "}
              <span className="gradient-text">Win Big</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Bet on politics, sports, crypto & more using your daily point allowance. 
              Make predictions. Beat the crowd. Climb the leaderboard.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="mb-8">
            <StatsBar />
          </div>

          {/* Featured Prediction */}
          {featuredQuestion && (
            <div className="mb-8 animate-fade-in">
              <FeaturedPrediction question={featuredQuestion} onBet={handleBet} />
            </div>
          )}
        </div>
      </section>

      {/* Markets Section */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Active Markets
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredQuestions.length} markets available
              </p>
            </div>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>

          {/* Loading State */}
          {questionsLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Questions Grid */}
          {!questionsLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <PredictionCard question={question} onBet={handleBet} />
                </div>
              ))}
            </div>
          )}

          {!questionsLoading && filteredQuestions.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-muted-foreground">No markets found in this category</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <span className="font-display font-bold">Kora.lk</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Kora.lk. Prediction markets for Sri Lanka.
            </p>
          </div>
        </div>
      </footer>

      {/* Betting Modal */}
      <BettingModal
        question={selectedQuestion}
        prediction={selectedPrediction}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedQuestion(null);
          setSelectedPrediction(null);
        }}
      />
    </div>
  );
};

export default Index;
