/*
  # Plant Points Database Schema

  ## Overview
  This migration creates the complete database structure for the Plant Points app,
  which helps users track plant diversity in their diet to reach 30+ unique plants per week.

  ## New Tables

  ### `plants`
  Master list of all available plants to track
  - `id` (uuid, primary key) - unique plant identifier
  - `name` (text) - plant name (e.g., "Red Apple", "Spinach")
  - `category` (text) - type of plant (fruit, vegetable, grain, legume, nut, seed, herb, spice)
  - `base_points` (numeric) - default point value (1, 0.5, or 0.25)
  - `emoji` (text) - visual emoji representation
  - `created_at` (timestamptz) - when plant was added

  ### `user_plants`
  Tracks each instance of a plant eaten by a user
  - `id` (uuid, primary key) - unique log entry
  - `user_id` (uuid, foreign key) - references auth.users
  - `plant_id` (uuid, foreign key) - references plants table
  - `points_earned` (numeric) - actual points for this entry (0.25, 0.5, or 1)
  - `logged_at` (timestamptz) - when the plant was eaten/logged
  - `created_at` (timestamptz) - when entry was created

  ### `saved_meals`
  User-created meal templates for quick logging
  - `id` (uuid, primary key) - unique meal identifier
  - `user_id` (uuid, foreign key) - references auth.users
  - `name` (text) - meal name (e.g., "Veggie Bolognese")
  - `emoji` (text) - visual representation
  - `created_at` (timestamptz) - when meal was saved

  ### `saved_meal_plants`
  Links plants to saved meals
  - `id` (uuid, primary key) - unique link identifier
  - `meal_id` (uuid, foreign key) - references saved_meals
  - `plant_id` (uuid, foreign key) - references plants
  - `points` (numeric) - point value for this plant in the meal

  ### `user_streaks`
  Tracks user achievements and weekly goal streaks
  - `id` (uuid, primary key) - unique streak record
  - `user_id` (uuid, foreign key) - references auth.users
  - `week_start` (date) - start of the week (Monday)
  - `total_points` (numeric) - total plant points for that week
  - `unique_plants` (integer) - count of unique plants
  - `goal_reached` (boolean) - whether 30+ points achieved
  - `created_at` (timestamptz) - when record was created

  ## Security
  - Enable RLS on all tables
  - Users can only read/write their own data
  - Plants table is readable by all authenticated users
  - Comprehensive policies for authenticated user access

  ## Notes
  - Week calculations use Monday as start of week
  - Point values: 1 (full plant), 0.5 (vegetable stock), 0.25 (herbs/spices)
  - Plant diversity is key - same plant eaten multiple times = 1 point per week
*/

-- Create plants master table
CREATE TABLE IF NOT EXISTS plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  base_points numeric NOT NULL DEFAULT 1,
  emoji text NOT NULL DEFAULT '🌱',
  created_at timestamptz DEFAULT now()
);

-- Create user_plants tracking table
CREATE TABLE IF NOT EXISTS user_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  points_earned numeric NOT NULL DEFAULT 1,
  logged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create saved_meals table
CREATE TABLE IF NOT EXISTS saved_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  emoji text NOT NULL DEFAULT '🍽️',
  created_at timestamptz DEFAULT now()
);

-- Create saved_meal_plants junction table
CREATE TABLE IF NOT EXISTS saved_meal_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid NOT NULL REFERENCES saved_meals(id) ON DELETE CASCADE,
  plant_id uuid NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  points numeric NOT NULL DEFAULT 1
);

-- Create user_streaks tracking table
CREATE TABLE IF NOT EXISTS user_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  total_points numeric DEFAULT 0,
  unique_plants integer DEFAULT 0,
  goal_reached boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

-- Enable Row Level Security
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_meal_plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plants (readable by all authenticated users)
CREATE POLICY "Plants are viewable by authenticated users"
  ON plants FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for user_plants
CREATE POLICY "Users can view own plant logs"
  ON user_plants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plant logs"
  ON user_plants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plant logs"
  ON user_plants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own plant logs"
  ON user_plants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for saved_meals
CREATE POLICY "Users can view own saved meals"
  ON saved_meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved meals"
  ON saved_meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved meals"
  ON saved_meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved meals"
  ON saved_meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for saved_meal_plants
CREATE POLICY "Users can view plants in own saved meals"
  ON saved_meal_plants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_meals
      WHERE saved_meals.id = saved_meal_plants.meal_id
      AND saved_meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert plants into own saved meals"
  ON saved_meal_plants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_meals
      WHERE saved_meals.id = saved_meal_plants.meal_id
      AND saved_meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update plants in own saved meals"
  ON saved_meal_plants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_meals
      WHERE saved_meals.id = saved_meal_plants.meal_id
      AND saved_meals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM saved_meals
      WHERE saved_meals.id = saved_meal_plants.meal_id
      AND saved_meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete plants from own saved meals"
  ON saved_meal_plants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM saved_meals
      WHERE saved_meals.id = saved_meal_plants.meal_id
      AND saved_meals.user_id = auth.uid()
    )
  );

-- RLS Policies for user_streaks
CREATE POLICY "Users can view own streaks"
  ON user_streaks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks"
  ON user_streaks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks"
  ON user_streaks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_plants_user_id ON user_plants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plants_logged_at ON user_plants(logged_at);
CREATE INDEX IF NOT EXISTS idx_saved_meals_user_id ON saved_meals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_week_start ON user_streaks(week_start);