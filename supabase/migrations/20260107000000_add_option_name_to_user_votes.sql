-- Add option_name column to user_votes for multi-choice questions
-- For binary questions, this will be NULL
-- For multi-choice questions, this will store the option name that the user voted on
ALTER TABLE public.user_votes 
ADD COLUMN option_name TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.user_votes.option_name IS 'For multi-choice questions, stores the option name that was voted on. NULL for binary yes/no questions.';

-- Update the prediction check constraint to allow more flexibility
-- (Keeping existing constraint, but option_name provides additional context for multi-choice)

