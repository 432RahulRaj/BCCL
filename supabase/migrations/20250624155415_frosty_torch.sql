/*
  # Fix RLS policy for complaint insertion

  1. Problem
    - Users cannot insert new complaints due to RLS policy violations
    - The existing "Allow all access to complaints" policy is not working properly for INSERT operations

  2. Solution
    - Drop the overly broad "Allow all access to complaints" policy 
    - Add specific policies for different operations (SELECT, INSERT, UPDATE)
    - Ensure INSERT policy allows authenticated users to create complaints with their own employee_id

  3. Security
    - Users can only insert complaints with their own employee_id
    - All authenticated users can read complaints
    - Users can update complaints (for status changes by departments/admin)
*/

-- Drop the existing overly broad policy that's causing issues
DROP POLICY IF EXISTS "Allow all access to complaints" ON public.complaints;

-- Create specific policies for different operations

-- Allow all authenticated users to read complaints
CREATE POLICY "Allow authenticated users to read complaints"
  ON public.complaints
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert their own complaints
CREATE POLICY "Allow users to insert their own complaints"
  ON public.complaints
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid()::text IN (
      SELECT id::text FROM public.users WHERE id = employee_id
    )
  );

-- Allow all authenticated users to update complaints (for status changes, assignments, etc.)
CREATE POLICY "Allow authenticated users to update complaints"
  ON public.complaints
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Keep admin access policy if it exists
-- (This ensures admin@coalindia.in has full access)