-- Add new columns to complaints table for escalation authority tracking
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS escalated_to_authority text;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS escalated_authority_at timestamptz;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS authority_resolution_date timestamptz;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS authority_comments text;

-- Update the status check constraint to include new authority statuses
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE public.complaints ADD CONSTRAINT complaints_status_check 
  CHECK (status IN ('new', 'assigned', 'in_progress', 'completed', 'escalated', 'authority_assigned', 'authority_resolved'));

-- Create an index for escalated complaints
CREATE INDEX IF NOT EXISTS complaints_escalated_authority_idx ON public.complaints(escalated_to_authority) 
  WHERE escalated_to_authority IS NOT NULL;

-- Create higher authorities table
CREATE TABLE IF NOT EXISTS public.higher_authorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  title text NOT NULL,
  email text UNIQUE NOT NULL,
  department text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on higher authorities table
ALTER TABLE public.higher_authorities ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists, then create new one
DROP POLICY IF EXISTS "Allow read access to higher authorities" ON public.higher_authorities;
CREATE POLICY "Allow read access to higher authorities" 
  ON public.higher_authorities FOR SELECT TO authenticated 
  USING (true);

-- Also allow anon access for the policy
DROP POLICY IF EXISTS "Allow anon read access to higher authorities" ON public.higher_authorities;
CREATE POLICY "Allow anon read access to higher authorities" 
  ON public.higher_authorities FOR SELECT TO anon 
  USING (true);

-- Insert sample higher authorities
INSERT INTO public.higher_authorities (name, title, email, department) VALUES
  ('Regional Manager', 'Regional Operations Manager', 'regional.manager@coalindia.in', 'Operations'),
  ('Chief Engineer', 'Chief Engineering Officer', 'chief.engineer@coalindia.in', 'Engineering'),
  ('General Manager', 'General Manager - Quarters', 'general.manager@coalindia.in', 'Administration'),
  ('Director Operations', 'Director of Operations', 'director.ops@coalindia.in', 'Executive'),
  ('Managing Director', 'Managing Director', 'md@coalindia.in', 'Executive')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  title = EXCLUDED.title,
  department = EXCLUDED.department;

-- Grant permissions on the new table
GRANT SELECT ON public.higher_authorities TO authenticated;
GRANT SELECT ON public.higher_authorities TO anon;

-- Verification
SELECT 'Higher authority assignment system added' as status,
       (SELECT count(*) FROM public.higher_authorities) as authorities_count;

-- Show the authorities for reference
SELECT name, title, email, department FROM public.higher_authorities ORDER BY department, name;