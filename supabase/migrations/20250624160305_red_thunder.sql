-- Ensure departments table has the expected data and proper permissions

-- First, let's check if departments exist and insert them if they don't
INSERT INTO public.departments (name, email) VALUES
  ('Water Department', 'water@coalindia.in'),
  ('Electrical Department', 'electrical@coalindia.in'),
  ('Plumbing Department', 'plumbing@coalindia.in'),
  ('Carpentry Department', 'carpentry@coalindia.in'),
  ('Civil Department', 'civil@coalindia.in')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name;

-- Ensure the departments table has proper permissions
GRANT SELECT ON public.departments TO authenticated;
GRANT SELECT ON public.departments TO anon;

-- Also ensure the departments table policy allows reading
DROP POLICY IF EXISTS "Allow all access to departments" ON public.departments;
CREATE POLICY "Allow read access to departments" 
  ON public.departments FOR SELECT TO authenticated 
  USING (true);

-- Allow anon access for login functions
CREATE POLICY "Allow anon read access to departments" 
  ON public.departments FOR SELECT TO anon 
  USING (true);

-- Verify departments exist
SELECT 'Departments verification:' as status, count(*) as department_count FROM public.departments;

-- Show all departments for debugging
SELECT id, name, email FROM public.departments ORDER BY name;