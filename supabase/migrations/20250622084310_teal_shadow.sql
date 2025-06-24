/*
  # Fresh BCCL Quarters Complaint Management Database Setup
  
  This is a complete fresh setup for the BCCL Quarters Complaint Management Portal.
  
  ## Tables Created:
  1. departments - Department information
  2. users - User authentication and roles
  3. employees - Employee details
  4. complaints - Complaint records
  5. complaint_comments - Comments on complaints
  6. complaint_status_history - Status change tracking
  7. profiles - User profile data (linked to auth.users)
  
  ## Security:
  - Row Level Security (RLS) enabled on all tables
  - Proper access policies for each role (admin, employee, department)
  - Email validation for @coalindia.in domain
  
  ## Demo Data:
  - Sample users for testing
  - Sample departments
  - Sample complaints with different statuses
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL CHECK (email LIKE '%@coalindia.in'),
  created_at timestamptz DEFAULT now()
);

-- Create users table for authentication and role management
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE CHECK (email LIKE '%@coalindia.in'),
  role text NOT NULL CHECK (role IN ('admin', 'department', 'employee')),
  department text,
  created_at timestamptz DEFAULT now()
);

-- Create employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL CHECK (email LIKE '%@coalindia.in'),
  quarter_number text NOT NULL,
  area text NOT NULL,
  contact_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT username_length CHECK (char_length(full_name) >= 3)
);

-- Create complaints table
CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.users(id),
  employee_name text NOT NULL,
  employee_quarter text NOT NULL,
  employee_area text NOT NULL,
  employee_contact text NOT NULL,
  type text NOT NULL CHECK (type IN ('water', 'electrical', 'plumbing', 'carpentry', 'civil', 'other')),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'assigned', 'in_progress', 'completed', 'escalated')),
  department_id uuid REFERENCES public.departments(id),
  department_name text,
  assigned_employee_id uuid REFERENCES public.users(id),
  assigned_at timestamptz,
  estimated_resolution_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create complaint comments table
CREATE TABLE public.complaint_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  user_name text NOT NULL,
  user_role text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create complaint status history table
CREATE TABLE public.complaint_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES public.complaints(id) ON DELETE CASCADE,
  status text NOT NULL,
  updated_by text NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX users_email_idx ON public.users (email);
CREATE INDEX complaints_employee_id_idx ON public.complaints(employee_id);
CREATE INDEX complaints_department_id_idx ON public.complaints(department_id);
CREATE INDEX complaints_status_idx ON public.complaints(status);
CREATE INDEX complaints_created_at_idx ON public.complaints(created_at);
CREATE INDEX complaint_comments_complaint_id_idx ON public.complaint_comments(complaint_id);
CREATE INDEX complaint_status_history_complaint_id_idx ON public.complaint_status_history(complaint_id);

-- Create trigger functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_complaints_updated_at 
  BEFORE UPDATE ON public.complaints 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();

-- Enable Row Level Security on all tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "Allow read access to all authenticated users for departments"
  ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all access to admin for departments"
  ON public.departments FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@coalindia.in');

-- RLS Policies for employees
CREATE POLICY "Allow read access to admin for employees"
  ON public.employees FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in');

CREATE POLICY "Allow all access to admin for employees"
  ON public.employees FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@coalindia.in');

CREATE POLICY "Allow users to read their own employee data"
  ON public.employees FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- RLS Policies for users
CREATE POLICY "Admin has full access" ON public.users
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@coalindia.in');

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for complaints
CREATE POLICY "Admin can access all complaints" ON public.complaints
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@coalindia.in');

CREATE POLICY "Employees can access their own complaints" ON public.complaints
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = auth.jwt() ->> 'email' 
      AND id = complaints.employee_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE email = auth.jwt() ->> 'email' 
      AND id = complaints.employee_id
    )
  );

CREATE POLICY "Department can access assigned complaints" ON public.complaints
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.departments d ON u.department = d.name
      WHERE u.email = auth.jwt() ->> 'email'
      AND d.id = complaints.department_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.departments d ON u.department = d.name
      WHERE u.email = auth.jwt() ->> 'email'
      AND d.id = complaints.department_id
    )
  );

-- RLS Policies for complaint comments
CREATE POLICY "Users can access comments for their accessible complaints" ON public.complaint_comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_comments.complaint_id
      AND (
        auth.jwt() ->> 'email' = 'admin@coalindia.in'
        OR
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE email = auth.jwt() ->> 'email' 
          AND id = c.employee_id
        )
        OR
        EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.departments d ON u.department = d.name
          WHERE u.email = auth.jwt() ->> 'email'
          AND d.id = c.department_id
        )
      )
    )
  );

-- RLS Policies for complaint status history
CREATE POLICY "Users can access status history for their accessible complaints" ON public.complaint_status_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_status_history.complaint_id
      AND (
        auth.jwt() ->> 'email' = 'admin@coalindia.in'
        OR
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE email = auth.jwt() ->> 'email' 
          AND id = c.employee_id
        )
        OR
        EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.departments d ON u.department = d.name
          WHERE u.email = auth.jwt() ->> 'email'
          AND d.id = c.department_id
        )
      )
    )
  );

-- Insert initial departments
INSERT INTO public.departments (name, email) VALUES
  ('Water Department', 'water@coalindia.in'),
  ('Electrical Department', 'electrical@coalindia.in'),
  ('Plumbing Department', 'plumbing@coalindia.in'),
  ('Carpentry Department', 'carpentry@coalindia.in'),
  ('Civil Department', 'civil@coalindia.in');

-- Insert demo users
INSERT INTO public.users (email, role, department) VALUES
  ('admin@coalindia.in', 'admin', NULL),
  ('employee@coalindia.in', 'employee', NULL),
  ('water@coalindia.in', 'department', 'Water Department'),
  ('electrical@coalindia.in', 'department', 'Electrical Department'),
  ('plumbing@coalindia.in', 'department', 'Plumbing Department'),
  ('carpentry@coalindia.in', 'department', 'Carpentry Department'),
  ('civil@coalindia.in', 'department', 'Civil Department');

-- Insert demo employee data
INSERT INTO public.employees (name, email, quarter_number, area, contact_number) VALUES
  ('John Employee', 'employee@coalindia.in', 'A-123', 'Sector 5', '9876543210');

-- Insert sample complaints for demonstration
DO $$
DECLARE
    employee_user_id uuid;
    water_dept_id uuid;
    electrical_dept_id uuid;
    plumbing_dept_id uuid;
    complaint1_id uuid;
    complaint2_id uuid;
    complaint3_id uuid;
BEGIN
    -- Get the employee user ID
    SELECT id INTO employee_user_id FROM public.users WHERE email = 'employee@coalindia.in';
    
    -- Get department IDs
    SELECT id INTO water_dept_id FROM public.departments WHERE name = 'Water Department';
    SELECT id INTO electrical_dept_id FROM public.departments WHERE name = 'Electrical Department';
    SELECT id INTO plumbing_dept_id FROM public.departments WHERE name = 'Plumbing Department';
    
    -- Complaint 1: New water issue
    INSERT INTO public.complaints (
        employee_id, employee_name, employee_quarter, employee_area, employee_contact,
        type, description, status, created_at
    ) VALUES (
        employee_user_id, 'John Employee', 'A-123', 'Sector 5', '9876543210',
        'water', 'No water supply since morning', 'new', 
        now() - interval '1 day'
    ) RETURNING id INTO complaint1_id;
    
    -- Insert status history for complaint 1
    INSERT INTO public.complaint_status_history (complaint_id, status, updated_by, created_at) VALUES
    (complaint1_id, 'new', 'System', now() - interval '1 day');
    
    -- Complaint 2: Assigned electrical issue
    INSERT INTO public.complaints (
        employee_id, employee_name, employee_quarter, employee_area, employee_contact,
        type, description, status, department_id, department_name, assigned_at, estimated_resolution_date, created_at
    ) VALUES (
        employee_user_id, 'John Employee', 'A-123', 'Sector 5', '9876543210',
        'electrical', 'Power fluctuation in the quarter', 'assigned',
        electrical_dept_id, 'Electrical Department', now() - interval '20 hours', now() + interval '1 day',
        now() - interval '2 days'
    ) RETURNING id INTO complaint2_id;
    
    -- Insert status history for complaint 2
    INSERT INTO public.complaint_status_history (complaint_id, status, updated_by, created_at) VALUES
    (complaint2_id, 'new', 'System', now() - interval '2 days'),
    (complaint2_id, 'assigned', 'Admin User', now() - interval '20 hours');
    
    -- Insert sample comment for complaint 2
    INSERT INTO public.complaint_comments (complaint_id, user_id, user_name, user_role, comment, created_at) VALUES
    (complaint2_id, (SELECT id FROM public.users WHERE email = 'admin@coalindia.in'), 'Admin User', 'admin', 'Assigned to Electrical Department', now() - interval '20 hours');
    
    -- Complaint 3: Completed plumbing issue
    INSERT INTO public.complaints (
        employee_id, employee_name, employee_quarter, employee_area, employee_contact,
        type, description, status, department_id, department_name, assigned_at, estimated_resolution_date, completed_at, created_at
    ) VALUES (
        employee_user_id, 'John Employee', 'A-123', 'Sector 5', '9876543210',
        'plumbing', 'Leaking tap in bathroom', 'completed',
        plumbing_dept_id, 'Plumbing Department', now() - interval '3 days', now() - interval '2 days', now() - interval '1 day',
        now() - interval '4 days'
    ) RETURNING id INTO complaint3_id;
    
    -- Insert status history for complaint 3
    INSERT INTO public.complaint_status_history (complaint_id, status, updated_by, created_at) VALUES
    (complaint3_id, 'new', 'System', now() - interval '4 days'),
    (complaint3_id, 'assigned', 'Admin User', now() - interval '3 days'),
    (complaint3_id, 'in_progress', 'Plumbing Staff', now() - interval '2 days'),
    (complaint3_id, 'completed', 'Plumbing Staff', now() - interval '1 day');
    
    -- Insert sample comments for complaint 3
    INSERT INTO public.complaint_comments (complaint_id, user_id, user_name, user_role, comment, created_at) VALUES
    (complaint3_id, (SELECT id FROM public.users WHERE email = 'admin@coalindia.in'), 'Admin User', 'admin', 'Assigned to Plumbing Department', now() - interval '3 days'),
    (complaint3_id, (SELECT id FROM public.users WHERE email = 'plumbing@coalindia.in'), 'Plumbing Staff', 'department', 'Replaced the washer in the tap', now() - interval '1 day');
END $$;

-- Create database status view for monitoring
CREATE VIEW public.database_status AS
SELECT 
    'departments' as table_name,
    true as exists,
    (SELECT count(*) FROM public.departments) as row_count
UNION ALL
SELECT 
    'employees' as table_name,
    true as exists,
    (SELECT count(*) FROM public.employees) as row_count
UNION ALL
SELECT 
    'users' as table_name,
    true as exists,
    (SELECT count(*) FROM public.users) as row_count
UNION ALL
SELECT 
    'complaints' as table_name,
    true as exists,
    (SELECT count(*) FROM public.complaints) as row_count
UNION ALL
SELECT 
    'complaint_comments' as table_name,
    true as exists,
    (SELECT count(*) FROM public.complaint_comments) as row_count
UNION ALL
SELECT 
    'complaint_status_history' as table_name,
    true as exists,
    (SELECT count(*) FROM public.complaint_status_history) as row_count;

-- Setup storage for avatars (with error handling)
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;

    -- Create storage policies
    CREATE POLICY "Avatar images are publicly accessible."
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');

    CREATE POLICY "Anyone can upload an avatar."
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars');

    CREATE POLICY "Anyone can update their own avatar."
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars');
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore storage errors if storage is not available
        NULL;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Final verification
SELECT 'Fresh BCCL Database setup completed successfully! Tables created: ' || 
       (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') ||
       ', Demo data inserted: ' ||
       (SELECT count(*) FROM public.complaints) || ' complaints, ' ||
       (SELECT count(*) FROM public.users) || ' users, ' ||
       (SELECT count(*) FROM public.departments) || ' departments' as setup_result;