-- Temporarily disable RLS for complaints table to allow demo authentication to work
-- This is necessary because the demo authentication system doesn't integrate with Supabase Auth

-- Disable RLS on complaints table for demo mode
ALTER TABLE public.complaints DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on related tables to prevent cascade issues
ALTER TABLE public.complaint_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history DISABLE ROW LEVEL SECURITY;

-- Keep RLS enabled on users table but make it permissive for demo
DROP POLICY IF EXISTS "Allow all access to users" ON public.users;
CREATE POLICY "Allow all access to users" 
  ON public.users FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

-- Keep RLS enabled on employees table but make it permissive for demo  
DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;
CREATE POLICY "Allow all access to employees" 
  ON public.employees FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

-- Keep RLS enabled on departments table but make it permissive for demo
DROP POLICY IF EXISTS "Allow all access to departments" ON public.departments;
CREATE POLICY "Allow all access to departments" 
  ON public.departments FOR ALL TO authenticated 
  USING (true) WITH CHECK (true);

-- Ensure all permissions are granted for the authenticated role
GRANT ALL PRIVILEGES ON public.complaints TO authenticated;
GRANT ALL PRIVILEGES ON public.complaint_comments TO authenticated;
GRANT ALL PRIVILEGES ON public.complaint_status_history TO authenticated;
GRANT ALL PRIVILEGES ON public.users TO authenticated;
GRANT ALL PRIVILEGES ON public.employees TO authenticated;
GRANT ALL PRIVILEGES ON public.departments TO authenticated;

-- Grant permissions on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Also grant to anon role for the demo authentication functions
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.employees TO anon;
GRANT SELECT ON public.departments TO anon;

-- Status message
SELECT 'RLS disabled for complaints table - demo authentication should now work' as status;