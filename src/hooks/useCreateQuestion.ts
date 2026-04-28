import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateQuestionData {
  title: string;
  description?: string;
  category_id: number | null;
  ends_at: string;
  yes_percentage: number;
  question_type: 'binary' | 'multi';
  options?: { name: string; percentage: number }[];
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateQuestionData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You must be logged in to create a question");
      }

      const { data: question, error } = await supabase
        .from("questions")
        .insert({
          title: data.title,
          description: data.description || null,
          category_id: data.category_id,
          ends_at: data.ends_at,
          yes_percentage: data.yes_percentage,
          user_id: user.id,
          total_votes: 0,
          is_featured: false,
          approval_status: "pending",
          question_type: data.question_type,
          options: data.options || null,
        })
        .select()
        .single();

      if (error) throw error;
      return question;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      toast.success("Prediction submitted for approval!", {
        description: "An approver can review it before it goes live to everyone.",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create question");
    },
  });
}
