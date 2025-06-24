/*
  # Fix RLS policies for complaints table
  
  The current RLS policies expect Supabase's built-in auth system,
  but this application uses a custom demo authentication system.
  This migration creates permissive policies for the demo system.
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin can access all complaints" ON public.complaints;
DROP POLICY IF EXISTS "Employees can access their own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Department can access assigned complaints" ON public.complaints;

-- Create permissive policies for demo mode
CREATE POLICY "Allow all access to complaints" 
  ON public.complaints FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Also apply the same fix to complaint_comments and complaint_status_history
DROP POLICY IF EXISTS "Users can access comments for their accessible complaints" ON public.complaint_comments;
CREATE POLICY "Allow all access to complaint comments" 
  ON public.complaint_comments FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can access status history for their accessible complaints" ON public.complaint_status_history;
CREATE POLICY "Allow all access to complaint status history" 
  ON public.complaint_status_history FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- Ensure all necessary permissions are granted
GRANT ALL ON public.complaints TO authenticated;
GRANT ALL ON public.complaint_comments TO authenticated;
GRANT ALL ON public.complaint_status_history TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final verification
SELECT 'RLS policies updated for demo authentication system' as status;