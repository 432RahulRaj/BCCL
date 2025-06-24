-- Migration to fix authentication system for demo users
-- This creates a complete authentication setup that works with our demo system

-- First, ensure all tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email LIKE '%@coalindia.in'),
  role text NOT NULL CHECK (role IN ('admin', 'department', 'employee')),
  department text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL CHECK (email LIKE '%@coalindia.in'),
  quarter_number text NOT NULL,
  area text NOT NULL,
  contact_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL CHECK (email LIKE '%@coalindia.in'),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all access to users" ON public.users;
DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;
DROP POLICY IF EXISTS "Allow all access to departments" ON public.departments;

-- Create permissive policies for demo mode
CREATE POLICY "Allow all access to users" ON public.users FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to employees" ON public.employees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to departments" ON public.departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert departments first
INSERT INTO public.departments (name, email) VALUES
  ('Water Department', 'water@coalindia.in'),
  ('Electrical Department', 'electrical@coalindia.in'),
  ('Plumbing Department', 'plumbing@coalindia.in'),
  ('Carpentry Department', 'carpentry@coalindia.in'),
  ('Civil Department', 'civil@coalindia.in')
ON CONFLICT (email) DO NOTHING;

-- Insert demo users
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

-- Insert employee data
INSERT INTO public.employees (name, email, quarter_number, area, contact_number) VALUES
  ('John Employee', 'employee@coalindia.in', 'A-123', 'Sector 5', '9876543210')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  quarter_number = EXCLUDED.quarter_number,
  area = EXCLUDED.area,
  contact_number = EXCLUDED.contact_number;

-- Create a function to authenticate demo users (bypasses Supabase Auth)
CREATE OR REPLACE FUNCTION public.authenticate_demo_user(user_email text, user_otp text)
RETURNS json AS $$
DECLARE
    user_record public.users%ROWTYPE;
    employee_record public.employees%ROWTYPE;
    result json;
BEGIN
    -- Check if OTP is correct (demo OTP is always 123456)
    IF user_otp != '123456' THEN
        RETURN json_build_object('success', false, 'error', 'Invalid OTP');
    END IF;
    
    -- Check if user exists
    SELECT * INTO user_record FROM public.users WHERE email = user_email;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'User not found');
    END IF;
    
    -- Build user object
    result := json_build_object(
        'success', true,
        'user', json_build_object(
            'id', user_record.id,
            'email', user_record.email,
            'role', user_record.role,
            'department', user_record.department,
            'name', COALESCE(
                (SELECT name FROM public.employees WHERE email = user_record.email),
                split_part(user_record.email, '@', 1)
            )
        )
    );
    
    -- Add employee info if user is an employee
    IF user_record.role = 'employee' THEN
        SELECT * INTO employee_record FROM public.employees WHERE email = user_email;
        IF FOUND THEN
            result := jsonb_set(
                result::jsonb,
                '{user,employeeInfo}',
                json_build_object(
                    'quarter', employee_record.quarter_number,
                    'area', employee_record.area,
                    'contactNumber', employee_record.contact_number
                )::jsonb
            )::json;
        END IF;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if email exists for login
CREATE OR REPLACE FUNCTION public.check_demo_user_exists(user_email text)
RETURNS json AS $$
DECLARE
    user_exists boolean;
BEGIN
    -- Check if email ends with @coalindia.in
    IF user_email NOT LIKE '%@coalindia.in' THEN
        RETURN json_build_object('success', false, 'error', 'Please use a valid @coalindia.in email address');
    END IF;
    
    -- Check if user exists
    SELECT EXISTS(SELECT 1 FROM public.users WHERE email = user_email) INTO user_exists;
    
    IF user_exists THEN
        RETURN json_build_object('success', true, 'message', 'OTP sent to your email');
    ELSE
        RETURN json_build_object('success', false, 'error', 'User not found. Please contact administrator.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.employees TO authenticated;
GRANT ALL ON public.departments TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_demo_user(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_demo_user_exists(text) TO authenticated;

-- Also grant to anon for login functionality
GRANT EXECUTE ON FUNCTION public.authenticate_demo_user(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.check_demo_user_exists(text) TO anon;

-- Test the functions
SELECT public.check_demo_user_exists('admin@coalindia.in') as login_check;
SELECT public.authenticate_demo_user('admin@coalindia.in', '123456') as auth_check;

-- Final verification
SELECT 
    'Authentication system setup complete' as status,
    (SELECT count(*) FROM public.users) as total_users,
    (SELECT count(*) FROM public.employees) as total_employees,
    (SELECT count(*) FROM public.departments) as total_departments;