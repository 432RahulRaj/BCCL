/*
  # Create users table for user management

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique, not null)
      - `role` (text, not null)
      - `department` (text)
      - `created_at` (timestamptz, default: now())

  2. Security
    - Enable RLS on `users` table
    - Add policies for:
      - Admin can perform all operations
      - Users can read their own data
      - Users can update their own data

  3. Constraints
    - Email must end with @coalindia.in
    - Role must be one of: admin, department, employee
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  role text NOT NULL,
  department text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT users_email_check CHECK (email LIKE '%@coalindia.in'),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'department', 'employee'))
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admin has full access" ON public.users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@coalindia.in');

CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = email)
  WITH CHECK (auth.jwt() ->> 'email' = email);

-- Create index on email for faster lookups
CREATE INDEX users_email_idx ON public.users (email);