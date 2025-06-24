-- Simple migration to ensure demo users exist without complex PL/pgSQL

-- Ensure all demo users exist with proper data
INSERT INTO public.users (email, role, department) VALUES
  ('admin@coalindia.in', 'admin', NULL),
  ('employee@coalindia.in', 'employee', NULL),
  ('water@coalindia.in', 'department', 'Water Department'),
  ('electrical@coalindia.in', 'department', 'Electrical Department'),
  ('plumbing@coalindia.in', 'department', 'Plumbing Department'),
  ('carpentry@coalindia.in', 'department', 'Carpentry Department'),
  ('civil@coalindia.in', 'department', 'Civil Department')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  department = EXCLUDED.department;

-- Ensure employee data exists and is properly linked
INSERT INTO public.employees (name, email, quarter_number, area, contact_number) VALUES
  ('John Employee', 'employee@coalindia.in', 'A-123', 'Sector 5', '9876543210')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  quarter_number = EXCLUDED.quarter_number,
  area = EXCLUDED.area,
  contact_number = EXCLUDED.contact_number;

-- Create a simple function to verify user authentication works
CREATE OR REPLACE FUNCTION public.verify_demo_users()
RETURNS TABLE(email text, role text, exists_in_users boolean, exists_in_employees boolean) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.email,
        u.role,
        true as exists_in_users,
        EXISTS(SELECT 1 FROM public.employees e WHERE e.email = u.email) as exists_in_employees
    FROM public.users u
    WHERE u.email IN (
        'admin@coalindia.in',
        'employee@coalindia.in', 
        'water@coalindia.in',
        'electrical@coalindia.in',
        'plumbing@coalindia.in'
    )
    ORDER BY u.email;
END;
$$ LANGUAGE plpgsql;

-- Grant comprehensive permissions to ensure the authenticated role can access the data
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_status_history TO authenticated;

-- Grant permissions on sequences (needed for INSERT operations)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Simple verification query (no loops)
SELECT 
    'Demo users setup verification:' as status,
    (SELECT count(*) FROM public.users) as total_users,
    (SELECT count(*) FROM public.users WHERE email LIKE '%@coalindia.in') as coalindia_users,
    (SELECT count(*) FROM public.employees) as total_employees;

-- Show current users (simple query)
SELECT email, role, department FROM public.users ORDER BY email;

-- Show employee data
SELECT name, email, quarter_number, area FROM public.employees;