export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  category_id: string;
  category: Category;
  yes_percentage: number;
  total_votes: number;
  ends_at: string;
  image_url?: string;
  is_featured?: boolean;
}

export interface UserVote {
  id: string;
  user_id: string;
  question_id: string;
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
