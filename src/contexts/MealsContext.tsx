import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { Database } from '../lib/database.types';

type Meal = Database['public']['Tables']['meals']['Row'];
type Plant = Database['public']['Tables']['plants']['Row'];

interface MealWithPlants extends Meal {
  plants: Plant[];
  totalPoints: number;
}

interface MealsContextType {
  meals: MealWithPlants[];
  loading: boolean;
  createMeal: (name: string, description: string, emoji: string, plantIds: string[]) => Promise<{ error: string | null; meal?: MealWithPlants }>;
  updateMeal: (mealId: string, name: string, description: string, emoji: string, plantIds: string[]) => Promise<{ error: string | null }>;
  deleteMeal: (mealId: string) => Promise<{ error: string | null }>;
  refreshMeals: () => Promise<void>;
}

const MealsContext = createContext<MealsContextType | undefined>(undefined);

export function MealsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealWithPlants[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMeals();
    }
  }, [user]);

  const fetchMeals = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (mealsError) throw mealsError;

      if (!mealsData || mealsData.length === 0) {
        setMeals([]);
        return;
      }

      const mealIds = mealsData.map(m => m.id);

      const { data: mealPlantsData, error: mealPlantsError } = await supabase
        .from('meal_plants')
        .select(`
          meal_id,
          plants (*)
        `)
        .in('meal_id', mealIds);

      if (mealPlantsError) throw mealPlantsError;

      const mealsWithPlants: MealWithPlants[] = mealsData.map(meal => {
        const mealPlants = mealPlantsData
          ?.filter((mp: any) => mp.meal_id === meal.id)
          .map((mp: any) => mp.plants)
          .filter((p: any) => p !== null) || [];

        const totalPoints = mealPlants.reduce((sum, plant) => sum + (plant.base_points || 0), 0);

        return {
          ...meal,
          plants: mealPlants,
          totalPoints,
        };
      });

      setMeals(mealsWithPlants);
    } catch (err) {
      console.error('Error fetching meals:', err);
    } finally {
      setLoading(false);
    }
  };

  const createMeal = async (name: string, description: string, emoji: string, plantIds: string[]) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: user.id,
          name,
          description,
          emoji,
        })
        .select()
        .single();

      if (mealError) throw mealError;

      if (plantIds.length > 0) {
        const mealPlants = plantIds.map(plantId => ({
          meal_id: meal.id,
          plant_id: plantId,
        }));

        const { error: mealPlantsError } = await supabase
          .from('meal_plants')
          .insert(mealPlants);

        if (mealPlantsError) throw mealPlantsError;
      }

      await fetchMeals();

      const createdMeal = meals.find(m => m.id === meal.id);
      return { error: null, meal: createdMeal };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to create meal' };
    }
  };

  const updateMeal = async (mealId: string, name: string, description: string, emoji: string, plantIds: string[]) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error: updateError } = await supabase
        .from('meals')
        .update({ name, description, emoji })
        .eq('id', mealId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('meal_plants')
        .delete()
        .eq('meal_id', mealId);

      if (deleteError) throw deleteError;

      if (plantIds.length > 0) {
        const mealPlants = plantIds.map(plantId => ({
          meal_id: mealId,
          plant_id: plantId,
        }));

        const { error: insertError } = await supabase
          .from('meal_plants')
          .insert(mealPlants);

        if (insertError) throw insertError;
      }

      await fetchMeals();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update meal' };
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', mealId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchMeals();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to delete meal' };
    }
  };

  return (
    <MealsContext.Provider
      value={{
        meals,
        loading,
        createMeal,
        updateMeal,
        deleteMeal,
        refreshMeals: fetchMeals,
      }}
    >
      {children}
    </MealsContext.Provider>
  );
}

export function useMeals() {
  const context = useContext(MealsContext);
  if (context === undefined) {
    throw new Error('useMeals must be used within a MealsProvider');
  }
  return context;
}
