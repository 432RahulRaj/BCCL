/*
  # Create complaints table and related functionality

  1. New Tables
    - `complaints`
      - `id` (uuid, primary key)
      - `employee_id` (uuid, references users)
      - `employee_name` (text)
      - `employee_quarter` (text)
      - `employee_area` (text)
      - `employee_contact` (text)
      - `type` (text)
      - `description` (text)
      - `status` (text)
      - `department_id` (uuid, references departments)
      - `department_name` (text)
      - `assigned_employee_id` (uuid, references users)
      - `assigned_at` (timestamptz)
      - `estimated_resolution_date` (timestamptz)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `complaint_comments`
      - `id` (uuid, primary key)
      - `complaint_id` (uuid, references complaints)
      - `user_id` (uuid, references users)
      - `user_name` (text)
      - `user_role` (text)
      - `comment` (text)
      - `created_at` (timestamptz)

    - `complaint_status_history`
      - `id` (uuid, primary key)
      - `complaint_id` (uuid, references complaints)
      - `status` (text)
      - `updated_by` (text)
      - `comments` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each role
*/

-- Create complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
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
CREATE TABLE IF NOT EXISTS public.complaint_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES public.complaints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  user_name text NOT NULL,
  user_role text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create complaint status history table
CREATE TABLE IF NOT EXISTS public.complaint_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid REFERENCES public.complaints(id) ON DELETE CASCADE,
  status text NOT NULL,
  updated_by text NOT NULL,
  comments text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_status_history ENABLE ROW LEVEL SECURITY;

-- Policies for complaints
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

-- Policies for complaint comments
CREATE POLICY "Users can access comments for their accessible complaints" ON public.complaint_comments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_comments.complaint_id
      AND (
        -- Admin can see all
        auth.jwt() ->> 'email' = 'admin@coalindia.in'
        OR
        -- Employee can see their own complaint comments
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE email = auth.jwt() ->> 'email' 
          AND id = c.employee_id
        )
        OR
        -- Department can see assigned complaint comments
        EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.departments d ON u.department = d.name
          WHERE u.email = auth.jwt() ->> 'email'
          AND d.id = c.department_id
        )
      )
    )
  );

-- Policies for complaint status history
CREATE POLICY "Users can access status history for their accessible complaints" ON public.complaint_status_history
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_status_history.complaint_id
      AND (
        -- Admin can see all
        auth.jwt() ->> 'email' = 'admin@coalindia.in'
        OR
        -- Employee can see their own complaint history
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE email = auth.jwt() ->> 'email' 
          AND id = c.employee_id
        )
        OR
        -- Department can see assigned complaint history
        EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.departments d ON u.department = d.name
          WHERE u.email = auth.jwt() ->> 'email'
          AND d.id = c.department_id
        )
      )
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS complaints_employee_id_idx ON public.complaints(employee_id);
CREATE INDEX IF NOT EXISTS complaints_department_id_idx ON public.complaints(department_id);
CREATE INDEX IF NOT EXISTS complaints_status_idx ON public.complaints(status);
CREATE INDEX IF NOT EXISTS complaints_created_at_idx ON public.complaints(created_at);
CREATE INDEX IF NOT EXISTS complaint_comments_complaint_id_idx ON public.complaint_comments(complaint_id);
CREATE INDEX IF NOT EXISTS complaint_status_history_complaint_id_idx ON public.complaint_status_history(complaint_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_complaints_updated_at 
    BEFORE UPDATE ON public.complaints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO public.users (email, role, department) VALUES
  ('admin@coalindia.in', 'admin', NULL),
  ('employee@coalindia.in', 'employee', NULL),
  ('water@coalindia.in', 'department', 'Water Department'),
  ('electrical@coalindia.in', 'department', 'Electrical Department'),
  ('plumbing@coalindia.in', 'department', 'Plumbing Department'),
  ('carpentry@coalindia.in', 'department', 'Carpentry Department'),
  ('civil@coalindia.in', 'department', 'Civil Department')
ON CONFLICT (email) DO NOTHING;