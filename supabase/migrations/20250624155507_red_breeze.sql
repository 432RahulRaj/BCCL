/*
  # Fix Complaint Insert RLS Policy

  1. Policy Changes
    - Drop the existing complex INSERT policy that's causing issues
    - Create a simple, direct INSERT policy that allows authenticated users to insert complaints where employee_id matches their auth.uid()
    - Ensure the policy works correctly with the current authentication system

  2. Security
    - Maintains security by ensuring users can only create complaints for themselves
    - Uses auth.uid() directly to match against employee_id field
*/

-- Drop the existing problematic INSERT policy
DROP POLICY IF EXISTS "Allow users to insert their own complaints" ON complaints;

-- Create a new, simpler INSERT policy
CREATE POLICY "Allow authenticated users to insert their own complaints"
  ON complaints
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = employee_id);

-- Also ensure there's a proper SELECT policy for users to read their own complaints
DROP POLICY IF EXISTS "Allow users to read their own complaints" ON complaints;

CREATE POLICY "Allow users to read their own complaints"
  ON complaints
  FOR SELECT
  TO authenticated
  USING (auth.uid() = employee_id OR auth.uid() IN (
    SELECT id FROM users WHERE role IN ('admin', 'department')
  ));