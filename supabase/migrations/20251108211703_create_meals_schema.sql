/*
  # Create Meals Schema

  1. New Tables
    - `meals`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - Name of the meal
      - `description` (text, optional) - Description of the meal
      - `emoji` (text, optional) - Emoji icon for the meal
      - `created_at` (timestamptz) - When the meal was created
      - `updated_at` (timestamptz) - When the meal was last updated
    
    - `meal_plants`
      - `id` (uuid, primary key)
      - `meal_id` (uuid, references meals)
      - `plant_id` (uuid, references plants)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Users can only view and manage their own meals
    - Meal plants are accessible based on meal ownership

  3. Important Notes
    - Meals allow users to create reusable groups of plants
    - When a meal is logged, all its plants are added to user_plants
    - This enables quick logging of common food combinations
*/

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  emoji text DEFAULT '🍽️',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create meal_plants junction table
CREATE TABLE IF NOT EXISTS meal_plants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id uuid REFERENCES meals(id) ON DELETE CASCADE NOT NULL,
  plant_id uuid REFERENCES plants(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(meal_id, plant_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_plants_meal_id ON meal_plants(meal_id);
CREATE INDEX IF NOT EXISTS idx_meal_plants_plant_id ON meal_plants(plant_id);

-- Enable Row Level Security
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plants ENABLE ROW LEVEL SECURITY;

-- Meals policies
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own meals"
  ON meals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON meals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON meals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Meal plants policies
CREATE POLICY "Users can view meal plants for own meals"
  ON meal_plants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_plants.meal_id
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add plants to own meals"
  ON meal_plants FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_plants.meal_id
      AND meals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove plants from own meals"
  ON meal_plants FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_plants.meal_id
      AND meals.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();