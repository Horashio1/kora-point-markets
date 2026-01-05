-- Add user_id column to questions table to track who created the question
ALTER TABLE public.questions 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add RLS policy for users to create their own questions
CREATE POLICY "Users can create their own questions" 
ON public.questions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add RLS policy for users to update their own questions
CREATE POLICY "Users can update their own questions" 
ON public.questions 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add RLS policy for users to delete their own questions
CREATE POLICY "Users can delete their own questions" 
ON public.questions 
FOR DELETE 
USING (auth.uid() = user_id);