-- Allow public read access to schools and subjects for teacher registration
-- This is needed so unauthenticated users can see schools and subjects when registering

-- Policy for public to view active schools
CREATE POLICY "Anyone can view active schools for registration"
ON public.schools
FOR SELECT
TO anon
USING (is_active = true);

-- Policy for public to view subjects for registration
CREATE POLICY "Anyone can view subjects for registration"
ON public.subjects
FOR SELECT
TO anon
USING (true);