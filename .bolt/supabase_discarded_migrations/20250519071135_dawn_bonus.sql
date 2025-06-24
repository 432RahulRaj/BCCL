/*
  # Create employees and departments tables

  1. New Tables
    - `departments`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `email` (text, unique)
      - `created_at` (timestamp)
    
    - `employees`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, unique)
      - `quarter_number` (text)
      - `area` (text)
      - `contact_number` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Only admin can manage departments
    - Employees can read their own data
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL CHECK (email LIKE '%@coalindia.in'),
  created_at timestamptz DEFAULT now()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL CHECK (email LIKE '%@coalindia.in'),
  quarter_number text NOT NULL,
  area text NOT NULL,
  contact_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Policies for departments
CREATE POLICY "Allow read access to all authenticated users for departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all access to admin for departments"
  ON departments
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@coalindia.in');

-- Policies for employees
CREATE POLICY "Allow read access to admin for employees"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in');

CREATE POLICY "Allow all access to admin for employees"
  ON employees
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@coalindia.in')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@coalindia.in');

CREATE POLICY "Allow users to read their own data"
  ON employees
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Insert initial departments
INSERT INTO departments (name, email) VALUES
  ('Water Department', 'water@coalindia.in'),
  ('Electrical Department', 'electrical@coalindia.in'),
  ('Plumbing Department', 'plumbing@coalindia.in'),
  ('Carpentry Department', 'carpentry@coalindia.in'),
  ('Civil Department', 'civil@coalindia.in')
ON CONFLICT (email) DO NOTHING;

-- Insert demo employee
INSERT INTO employees (name, email, quarter_number, area, contact_number) VALUES
  ('John Employee', 'employee@coalindia.in', 'A-123', 'Sector 5', '9876543210')
ON CONFLICT (email) DO NOTHING;