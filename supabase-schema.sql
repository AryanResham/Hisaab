-- =============================================
-- Hisaab: Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('member', 'reviewer')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Settings table (pocket money)
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pocket_money INTEGER NOT NULL DEFAULT 12000,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings row
INSERT INTO settings (pocket_money) VALUES (12000);

-- 3. Expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  description TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('expense', 'cash_in')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  month_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Auto-create profile on signup (trigger)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Settings: Anyone authenticated can read, anyone can update/insert
CREATE POLICY "Anyone can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Expenses: All authenticated users can read all expenses
CREATE POLICY "Anyone can read expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

-- Members can insert expenses
CREATE POLICY "Members can insert expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Members can delete their own pending expenses
CREATE POLICY "Members can delete own pending expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Anyone authenticated can update expenses (for approve/reject)
CREATE POLICY "Authenticated can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (true);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_expenses_month_year ON expenses(month_year);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);

-- Enable realtime for expenses
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
