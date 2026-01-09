import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PlaceBetData {
  question_id: number;
  prediction: 'yes' | 'no';
  points_wagered: number;
  option_name?: string | null; // For multi-choice questions
}

export function usePlaceBet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlaceBetData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to place a bet");
      }

      // Check user stats to ensure they have enough points
      const { data: userStats, error: statsError } = await supabase
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') {
        throw new Error("Failed to fetch user stats");
      }

      const stats = userStats || {
        user_id: user.id,
        total_points: 1000,
        daily_allowance: 100,
        points_spent_today: 0,
        wins: 0,
        losses: 0,
        last_reset_date: new Date().toISOString().split('T')[0],
      };

      // Check if daily allowance needs reset
      const today = new Date().toISOString().split('T')[0];
      if (stats.last_reset_date !== today) {
        stats.points_spent_today = 0;
        stats.last_reset_date = today;
      }

      const pointsRemaining = stats.daily_allowance - stats.points_spent_today;
      if (data.points_wagered > pointsRemaining) {
        throw new Error(`Not enough points remaining today. You have ${pointsRemaining} points left.`);
      }

      if (data.points_wagered > stats.total_points) {
        throw new Error(`Insufficient total points. You have ${stats.total_points} points.`);
      }

      // Insert the bet
      const { data: vote, error: voteError } = await supabase
        .from("user_votes")
        .insert({
          user_id: user.id,
          question_id: data.question_id,
          prediction: data.prediction,
          points_wagered: data.points_wagered,
          option_name: data.option_name || null,
        })
        .select()
        .single();

      if (voteError) throw voteError;

      // Update user stats
      const newPointsSpent = stats.points_spent_today + data.points_wagered;
      const newTotalPoints = stats.total_points - data.points_wagered;

      const { error: updateError } = await supabase
        .from("user_stats")
        .upsert({
          user_id: user.id,
          total_points: newTotalPoints,
          daily_allowance: stats.daily_allowance,
          points_spent_today: newPointsSpent,
          wins: stats.wins,
          losses: stats.losses,
          last_reset_date: stats.last_reset_date,
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      // Update question's total_votes (you might want to use a database trigger for this)
      // For now, we'll increment it
      const { error: questionError } = await supabase.rpc('increment_question_votes', {
        question_id_param: data.question_id,
        points_param: data.points_wagered
      });

      // If RPC doesn't exist, just increment manually (non-atomic but works)
      if (questionError) {
        const { data: question } = await supabase
          .from("questions")
          .select("total_votes")
          .eq("id", data.question_id)
          .single();

        if (question) {
          await supabase
            .from("questions")
            .update({ total_votes: question.total_votes + data.points_wagered })
            .eq("id", data.question_id);
        }
      }

      return vote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_stats"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to place bet");
    },
  });
}

