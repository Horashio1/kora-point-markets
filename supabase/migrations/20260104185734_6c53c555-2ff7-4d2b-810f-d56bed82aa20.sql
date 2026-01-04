-- Drop dependent tables first
DROP TABLE IF EXISTS user_votes;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS categories;

-- Recreate categories with integer ID
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recreate questions with integer ID
CREATE TABLE public.questions (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category_id INTEGER REFERENCES public.categories(id),
  yes_percentage INTEGER NOT NULL DEFAULT 50,
  total_votes INTEGER NOT NULL DEFAULT 0,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  thumbnail_url TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Recreate user_votes with integer question reference
CREATE TABLE public.user_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id INTEGER NOT NULL REFERENCES public.questions(id),
  prediction TEXT NOT NULL,
  points_wagered INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

-- Categories policies
CREATE POLICY "Categories are publicly readable" ON public.categories FOR SELECT USING (true);

-- Questions policies
CREATE POLICY "Questions are publicly readable" ON public.questions FOR SELECT USING (true);

-- User votes policies
CREATE POLICY "Users can view their own votes" ON public.user_votes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own votes" ON public.user_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert seed data for categories
INSERT INTO public.categories (id, name, icon, color) VALUES
  (1, 'Politics', '🏛️', 'blue'),
  (2, 'Sports', '⚽', 'green'),
  (3, 'Crypto', '₿', 'orange'),
  (4, 'Entertainment', '🎬', 'purple'),
  (5, 'Technology', '💻', 'cyan'),
  (6, 'Economy', '📈', 'emerald');

-- Reset sequence to continue after seed data
SELECT setval('categories_id_seq', 6);

-- Insert seed data for questions
INSERT INTO public.questions (id, title, description, category_id, yes_percentage, total_votes, ends_at, thumbnail_url, is_featured) VALUES
  (1, 'Will Sri Lanka win the next Cricket World Cup?', 'Predict if Sri Lanka national cricket team will win the ICC Cricket World Cup 2027', 2, 34, 12450, '2027-10-01', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=100&h=100&fit=crop', true),
  (2, 'Bitcoin above $150K by end of 2025?', 'Will Bitcoin''s price exceed $150,000 USD before December 31, 2025?', 3, 42, 89320, '2025-12-31', 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=100&h=100&fit=crop', true),
  (3, 'New government formed before April 2025?', 'Will Sri Lanka form a new government before April 1st, 2025?', 1, 67, 45230, '2025-04-01', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=100&h=100&fit=crop', false),
  (4, 'Apple releases foldable iPhone in 2025?', 'Will Apple announce a foldable iPhone model during 2025?', 5, 23, 34560, '2025-12-31', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop', false),
  (5, 'Inflation drops below 5% by June?', 'Will Sri Lanka''s annual inflation rate fall below 5% by June 2025?', 6, 56, 18900, '2025-06-30', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop', false),
  (6, 'Avatar 3 breaks $2B box office?', 'Will Avatar 3 gross over $2 billion worldwide at the box office?', 4, 71, 67800, '2026-03-01', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100&h=100&fit=crop', false),
  (7, 'Ethereum flips Bitcoin in market cap?', 'Will Ethereum''s market capitalization exceed Bitcoin''s before 2026?', 3, 15, 156000, '2026-01-01', 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&h=100&fit=crop', false),
  (8, 'Sri Lanka hosts IPL matches in 2025?', 'Will any IPL 2025 matches be held in Sri Lanka?', 2, 28, 23400, '2025-05-31', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100&h=100&fit=crop', false);

-- Reset sequence to continue after seed data
SELECT setval('questions_id_seq', 8);