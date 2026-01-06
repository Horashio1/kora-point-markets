export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export interface QuestionOption {
  name: string;
  percentage: number;
}

export interface Question {
  id: number;
  title: string;
  description: string;
  category_id: number;
  category: Category;
  yes_percentage: number;
  total_votes: number;
  ends_at: string;
  thumbnail_url: string;
  image_url?: string;
  is_featured?: boolean;
  question_type: 'binary' | 'multi';
  options?: QuestionOption[];
}

export interface UserVote {
  id: string;
  user_id: string;
  question_id: number;
  prediction: 'yes' | 'no';
  points_wagered: number;
  created_at: string;
}

export interface UserStats {
  total_points: number;
  daily_allowance: number;
  points_spent_today: number;
  wins: number;
  losses: number;
}
