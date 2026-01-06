-- Add question_type column to support binary (yes/no) and multi-choice questions
ALTER TABLE public.questions 
ADD COLUMN question_type text NOT NULL DEFAULT 'binary';

-- Add options column for multi-choice questions (stores JSON array of options)
ALTER TABLE public.questions
ADD COLUMN options jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.questions.question_type IS 'binary for yes/no questions, multi for multiple choice';
COMMENT ON COLUMN public.questions.options IS 'JSON array of options for multi-choice questions, e.g. [{"name": "Option A", "percentage": 50}, {"name": "Option B", "percentage": 50}]';