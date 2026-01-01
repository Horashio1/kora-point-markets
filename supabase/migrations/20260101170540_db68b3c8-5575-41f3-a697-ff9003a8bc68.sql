-- Insert categories
INSERT INTO public.categories (id, name, icon, color) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Politics', '🏛️', 'blue'),
  ('c1000000-0000-0000-0000-000000000002', 'Sports', '⚽', 'green'),
  ('c1000000-0000-0000-0000-000000000003', 'Crypto', '₿', 'orange'),
  ('c1000000-0000-0000-0000-000000000004', 'Entertainment', '🎬', 'purple'),
  ('c1000000-0000-0000-0000-000000000005', 'Technology', '💻', 'cyan'),
  ('c1000000-0000-0000-0000-000000000006', 'Economy', '📈', 'emerald');

-- Insert questions
INSERT INTO public.questions (title, description, category_id, yes_percentage, total_votes, ends_at, thumbnail_url, is_featured) VALUES
  ('Will Sri Lanka win the next Cricket World Cup?', 'Predict if Sri Lanka national cricket team will win the ICC Cricket World Cup 2027', 'c1000000-0000-0000-0000-000000000002', 34, 12450, '2027-10-01', 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=100&h=100&fit=crop', true),
  ('Bitcoin above $150K by end of 2025?', 'Will Bitcoin''s price exceed $150,000 USD before December 31, 2025?', 'c1000000-0000-0000-0000-000000000003', 42, 89320, '2025-12-31', 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=100&h=100&fit=crop', true),
  ('New government formed before April 2025?', 'Will Sri Lanka form a new government before April 1st, 2025?', 'c1000000-0000-0000-0000-000000000001', 67, 45230, '2025-04-01', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=100&h=100&fit=crop', false),
  ('Apple releases foldable iPhone in 2025?', 'Will Apple announce a foldable iPhone model during 2025?', 'c1000000-0000-0000-0000-000000000005', 23, 34560, '2025-12-31', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=100&fit=crop', false),
  ('Inflation drops below 5% by June?', 'Will Sri Lanka''s annual inflation rate fall below 5% by June 2025?', 'c1000000-0000-0000-0000-000000000006', 56, 18900, '2025-06-30', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&h=100&fit=crop', false),
  ('Avatar 3 breaks $2B box office?', 'Will Avatar 3 gross over $2 billion worldwide at the box office?', 'c1000000-0000-0000-0000-000000000004', 71, 67800, '2026-03-01', 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=100&h=100&fit=crop', false),
  ('Ethereum flips Bitcoin in market cap?', 'Will Ethereum''s market capitalization exceed Bitcoin''s before 2026?', 'c1000000-0000-0000-0000-000000000003', 15, 156000, '2026-01-01', 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=100&h=100&fit=crop', false),
  ('Sri Lanka hosts IPL matches in 2025?', 'Will any IPL 2025 matches be held in Sri Lanka?', 'c1000000-0000-0000-0000-000000000002', 28, 23400, '2025-05-31', 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=100&h=100&fit=crop', false);