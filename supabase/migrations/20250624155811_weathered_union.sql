/*
  # Fix RLS policy for complaint insertion

  1. Security Changes
    - Drop existing conflicting INSERT policy
    - Create new INSERT policy that allows users to insert complaints for themselves
    - The policy checks if the employee_id being inserted corresponds to a user record
      where the email matches the authenticated user's email from JWT

  2. Changes Made
    - Remove generic INSERT policy that was too permissive
    - Add specific policy for employees to create complaints for themselves
    - Policy validates that the employee_id matches a user with the same email as the JWT
*/

-- Drop the existing generic INSERT policy that might be causing conflicts
DROP POLICY IF EXISTS "Allow all access to employees" ON complaints;
DROP POLICY IF EXISTS "Authenticated users can insert complaints" ON complaints;

-- Create a proper INSERT policy for employees to submit their own complaints
CREATE POLICY "Employees can create complaints for themselves"
  ON complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = employee_id 
      AND users.email = (auth.jwt() ->> 'email')
    )
  );

-- Ensure the SELECT policies are also properly configured
DROP POLICY IF EXISTS "Allow authenticated users to read complaints" ON complaints;

-- Create a comprehensive SELECT policy
CREATE POLICY "Users can read complaints based on access rights"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (
    -- Admin can see all complaints
    (auth.jwt() ->> 'email') = 'admin@coalindia.in'
    OR
    -- Users can see their own complaints (matching employee_id)
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = complaints.employee_id 
      AND users.email = (auth.jwt() ->> 'email')
    )
    OR
    -- Department users can see complaints assigned to their department
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = (auth.jwt() ->> 'email')
      AND users.role = 'department'
      AND users.department = complaints.department_name
    )
  );