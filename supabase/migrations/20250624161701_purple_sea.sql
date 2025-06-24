-- Add department staff role and related functionality

-- Update users table to support department_staff role
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'department', 'department_staff', 'employee'));

-- Create department_staff table for additional staff information
CREATE TABLE IF NOT EXISTS public.department_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id),
  staff_name text NOT NULL,
  staff_email text UNIQUE NOT NULL CHECK (staff_email LIKE '%@coalindia.in'),
  specialization text, -- e.g., "Electrical Technician", "Plumber", "Carpenter"
  phone_number text,
  is_active boolean DEFAULT true,
  assigned_by uuid REFERENCES public.users(id), -- Department manager who added this staff
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on department_staff table
ALTER TABLE public.department_staff ENABLE ROW LEVEL SECURITY;

-- Create policies for department_staff table
CREATE POLICY "Department managers can manage their staff" 
  ON public.department_staff FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.departments d ON u.department = d.name
      WHERE u.email = (auth.jwt() ->> 'email')
      AND u.role = 'department'
      AND d.id = department_staff.department_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.departments d ON u.department = d.name
      WHERE u.email = (auth.jwt() ->> 'email')
      AND u.role = 'department'
      AND d.id = department_staff.department_id
    )
  );

-- Allow staff to read their own information
CREATE POLICY "Staff can read their own information" 
  ON public.department_staff FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Allow admins to manage all staff
CREATE POLICY "Admin can manage all department staff" 
  ON public.department_staff FOR ALL TO authenticated 
  USING ((auth.jwt() ->> 'email') = 'admin@coalindia.in')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@coalindia.in');

-- Update complaints table to track staff assignments
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS assigned_staff_id uuid REFERENCES public.department_staff(id);
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS staff_started_at timestamptz;
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS staff_notes text;

-- Create index for staff assignments
CREATE INDEX IF NOT EXISTS complaints_assigned_staff_idx ON public.complaints(assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

-- Add trigger for updated_at on department_staff
CREATE TRIGGER update_department_staff_updated_at 
  BEFORE UPDATE ON public.department_staff 
  FOR EACH ROW 
  EXECUTE FUNCTION handle_updated_at();

-- Insert demo department staff for each department
DO $$
DECLARE
    water_dept_id uuid;
    electrical_dept_id uuid;
    plumbing_dept_id uuid;
    carpentry_dept_id uuid;
    civil_dept_id uuid;
    dept_manager_id uuid;
BEGIN
    -- Get department IDs
    SELECT id INTO water_dept_id FROM public.departments WHERE name = 'Water Department';
    SELECT id INTO electrical_dept_id FROM public.departments WHERE name = 'Electrical Department';
    SELECT id INTO plumbing_dept_id FROM public.departments WHERE name = 'Plumbing Department';
    SELECT id INTO carpentry_dept_id FROM public.departments WHERE name = 'Carpentry Department';
    SELECT id INTO civil_dept_id FROM public.departments WHERE name = 'Civil Department';
    
    -- Get a department manager ID for assignment tracking
    SELECT id INTO dept_manager_id FROM public.users WHERE role = 'department' LIMIT 1;

    -- Insert demo staff for Water Department
    INSERT INTO public.users (email, role, department) VALUES
      ('water.tech1@coalindia.in', 'department_staff', 'Water Department'),
      ('water.tech2@coalindia.in', 'department_staff', 'Water Department')
    ON CONFLICT (email) DO UPDATE SET
      role = EXCLUDED.role,
      department = EXCLUDED.department;

    -- Insert staff details for Water Department
    INSERT INTO public.department_staff (user_id, department_id, staff_name, staff_email, specialization, phone_number, assigned_by)
    SELECT u.id, water_dept_id, 'Raj Kumar', u.email, 'Water Supply Technician', '9876543211', dept_manager_id
    FROM public.users u WHERE u.email = 'water.tech1@coalindia.in'
    ON CONFLICT (staff_email) DO UPDATE SET
      staff_name = EXCLUDED.staff_name,
      specialization = EXCLUDED.specialization;

    INSERT INTO public.department_staff (user_id, department_id, staff_name, staff_email, specialization, phone_number, assigned_by)
    SELECT u.id, water_dept_id, 'Suresh Patel', u.email, 'Water Quality Specialist', '9876543212', dept_manager_id
    FROM public.users u WHERE u.email = 'water.tech2@coalindia.in'
    ON CONFLICT (staff_email) DO UPDATE SET
      staff_name = EXCLUDED.staff_name,
      specialization = EXCLUDED.specialization;

    -- Insert demo staff for Electrical Department
    INSERT INTO public.users (email, role, department) VALUES
      ('electrical.tech1@coalindia.in', 'department_staff', 'Electrical Department'),
      ('electrical.tech2@coalindia.in', 'department_staff', 'Electrical Department')
    ON CONFLICT (email) DO UPDATE SET
      role = EXCLUDED.role,
      department = EXCLUDED.department;

    INSERT INTO public.department_staff (user_id, department_id, staff_name, staff_email, specialization, phone_number, assigned_by)
    SELECT u.id, electrical_dept_id, 'Amit Singh', u.email, 'Electrical Technician', '9876543213', dept_manager_id
    FROM public.users u WHERE u.email = 'electrical.tech1@coalindia.in'
    ON CONFLICT (staff_email) DO UPDATE SET
      staff_name = EXCLUDED.staff_name,
      specialization = EXCLUDED.specialization;

    INSERT INTO public.department_staff (user_id, department_id, staff_name, staff_email, specialization, phone_number, assigned_by)
    SELECT u.id, electrical_dept_id, 'Vikash Sharma', u.email, 'Power Systems Specialist', '9876543214', dept_manager_id
    FROM public.users u WHERE u.email = 'electrical.tech2@coalindia.in'
    ON CONFLICT (staff_email) DO UPDATE SET
      staff_name = EXCLUDED.staff_name,
      specialization = EXCLUDED.specialization;

    -- Insert demo staff for Plumbing Department
    INSERT INTO public.users (email, role, department) VALUES
      ('plumbing.tech1@coalindia.in', 'department_staff', 'Plumbing Department')
    ON CONFLICT (email) DO UPDATE SET
      role = EXCLUDED.role,
      department = EXCLUDED.department;

    INSERT INTO public.department_staff (user_id, department_id, staff_name, staff_email, specialization, phone_number, assigned_by)
    SELECT u.id, plumbing_dept_id, 'Ramesh Yadav', u.email, 'Plumbing Specialist', '9876543215', dept_manager_id
    FROM public.users u WHERE u.email = 'plumbing.tech1@coalindia.in'
    ON CONFLICT (staff_email) DO UPDATE SET
      staff_name = EXCLUDED.staff_name,
      specialization = EXCLUDED.specialization;
END $$;

-- Grant permissions on new table
GRANT ALL ON public.department_staff TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update the authentication functions to handle department_staff role
CREATE OR REPLACE FUNCTION public.authenticate_demo_user(user_email text, user_otp text)
RETURNS json AS $$
DECLARE
    user_record public.users%ROWTYPE;
    employee_record public.employees%ROWTYPE;
    staff_record public.department_staff%ROWTYPE;
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
                (SELECT staff_name FROM public.department_staff WHERE staff_email = user_record.email),
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
    
    -- Add staff info if user is department staff
    IF user_record.role = 'department_staff' THEN
        SELECT * INTO staff_record FROM public.department_staff WHERE staff_email = user_email;
        IF FOUND THEN
            result := jsonb_set(
                result::jsonb,
                '{user,staffInfo}',
                json_build_object(
                    'specialization', staff_record.specialization,
                    'phoneNumber', staff_record.phone_number,
                    'departmentId', staff_record.department_id
                )::jsonb
            )::json;
        END IF;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verification
SELECT 'Department staff system added successfully' as status,
       (SELECT count(*) FROM public.department_staff) as staff_count,
       (SELECT count(*) FROM public.users WHERE role = 'department_staff') as staff_users_count;

-- Show staff for reference
SELECT ds.staff_name, ds.staff_email, ds.specialization, d.name as department
FROM public.department_staff ds
JOIN public.departments d ON ds.department_id = d.id
ORDER BY d.name, ds.staff_name;