/*
  # Fix demo users and ensure proper authentication

  1. Insert/update all demo users with correct roles
  2. Ensure employee data exists and is linked properly  
  3. Verify data integrity
  4. Grant proper permissions for authentication
*/

-- First, let's check what users currently exist
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Current users in database:';
    FOR rec IN SELECT email, role FROM public.users LOOP
        RAISE NOTICE 'User: % (Role: %)', rec.email, rec.role;
    END LOOP;
END $$;

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

-- Verify the users were inserted correctly
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE 'Users after insertion:';
    FOR rec IN SELECT email, role, department FROM public.users ORDER BY email LOOP
        RAISE NOTICE 'User: % (Role: %, Dept: %)', rec.email, rec.role, COALESCE(rec.department, 'NULL');
    END LOOP;
    
    RAISE NOTICE 'Employee data:';
    FOR rec IN SELECT name, email, quarter_number, area FROM public.employees LOOP
        RAISE NOTICE 'Employee: % (Email: %, Quarter: %, Area: %)', rec.name, rec.email, rec.quarter_number, rec.area;
    END LOOP;
END $$;

-- Create a function to verify user authentication works
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

-- Run the verification
SELECT * FROM public.verify_demo_users();

-- Grant permissions to ensure the authenticated role can access the data
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.employees TO authenticated;
GRANT SELECT ON public.departments TO authenticated;
GRANT INSERT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.employees TO authenticated;
GRANT UPDATE ON public.employees TO authenticated;

-- Also grant permissions on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final status check
SELECT 
    'Demo users setup verification:' as status,
    (SELECT count(*) FROM public.users) as total_users,
    (SELECT count(*) FROM public.users WHERE email LIKE '%@coalindia.in') as coalindia_users,
    (SELECT count(*) FROM public.employees) as total_employees;