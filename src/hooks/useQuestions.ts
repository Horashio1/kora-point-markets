import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Question, Category, QuestionOption } from "@/types/prediction";

export function useQuestions() {
  return useQuery({
    queryKey: ["questions"],
    queryFn: async (): Promise<Question[]> => {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("approval_status", "approved")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((q) => ({
        id: q.id,
        title: q.title,
        description: q.description || "",
        category_id: q.category_id || 0,
        category: q.category as Category,
        yes_percentage: q.yes_percentage,
        total_votes: q.total_votes,
        ends_at: q.ends_at,
        thumbnail_url: q.thumbnail_url || "",
        image_url: q.image_url || undefined,
        is_featured: q.is_featured || false,
        approval_status: q.approval_status,
        question_type: (q.question_type as 'binary' | 'multi') || 'binary',
        options: (q.options as unknown as QuestionOption[]) || undefined,
      }));
    },
  });
}

export function useFeaturedQuestion() {
  return useQuery({
    queryKey: ["featured-question"],
    queryFn: async (): Promise<Question | null> => {
      const { data, error } = await supabase
        .from("questions")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("is_featured", true)
        .eq("approval_status", "approved")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        description: data.description || "",
        category_id: data.category_id || 0,
        category: data.category as Category,
        yes_percentage: data.yes_percentage,
        total_votes: data.total_votes,
        ends_at: data.ends_at,
        thumbnail_url: data.thumbnail_url || "",
        image_url: data.image_url || undefined,
        is_featured: data.is_featured || false,
        approval_status: data.approval_status,
        question_type: (data.question_type as 'binary' | 'multi') || 'binary',
        options: (data.options as unknown as QuestionOption[]) || undefined,
      };
    },
  });
}
