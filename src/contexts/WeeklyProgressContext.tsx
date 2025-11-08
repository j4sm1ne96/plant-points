import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface WeeklyProgress {
  totalPoints: number;
  todayPoints: number;
  uniquePlants: number;
  loggedPlants: Array<{
    plant_id: string;
    plant_name: string;
    emoji: string;
    points: number;
    logged_at: string;
  }>;
}

interface WeeklyProgressContextType {
  progress: WeeklyProgress;
  loading: boolean;
  logPlant: (plantId: string, pointsEarned: number) => Promise<{ error: string | null }>;
  removePlant: (plantId: string) => Promise<{ error: string | null }>;
  refreshProgress: () => Promise<void>;
}

const WeeklyProgressContext = createContext<WeeklyProgressContextType | undefined>(undefined);

export function WeeklyProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<WeeklyProgress>({
    totalPoints: 0,
    todayPoints: 0,
    uniquePlants: 0,
    loggedPlants: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWeeklyProgress();
    }
  }, [user]);

  const getWeekStart = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  };

  const getTodayStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
  };

  const fetchWeeklyProgress = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const weekStart = getWeekStart();

      const { data, error } = await supabase
        .from('user_plants')
        .select(`
          id,
          plant_id,
          points_earned,
          logged_at,
          plants (
            name,
            emoji
          )
        `)
        .eq('user_id', user.id)
        .gte('logged_at', weekStart);

      if (error) throw error;

      const plantMap = new Map<string, {
        plant_id: string;
        plant_name: string;
        emoji: string;
        points: number;
        logged_at: string;
      }>();

      data?.forEach((entry: any) => {
        if (!plantMap.has(entry.plant_id)) {
          plantMap.set(entry.plant_id, {
            plant_id: entry.plant_id,
            plant_name: entry.plants.name,
            emoji: entry.plants.emoji,
            points: entry.points_earned,
            logged_at: entry.logged_at,
          });
        }
      });

      const uniquePlantsArray = Array.from(plantMap.values());
      const totalPoints = uniquePlantsArray.reduce((sum, p) => sum + p.points, 0);

      const todayStart = getTodayStart();
      const todayPlants = uniquePlantsArray.filter(
        (p) => new Date(p.logged_at).getTime() >= new Date(todayStart).getTime()
      );
      const todayPoints = todayPlants.reduce((sum, p) => sum + p.points, 0);

      setProgress({
        totalPoints,
        todayPoints,
        uniquePlants: uniquePlantsArray.length,
        loggedPlants: uniquePlantsArray.sort((a, b) =>
          new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
        ),
      });
    } catch (err) {
      console.error('Error fetching weekly progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const logPlant = async (plantId: string, pointsEarned: number) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('user_plants')
        .insert({
          user_id: user.id,
          plant_id: plantId,
          points_earned: pointsEarned,
          logged_at: new Date().toISOString(),
        });

      if (error) throw error;

      await fetchWeeklyProgress();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to log plant' };
    }
  };

  const removePlant = async (plantId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const weekStart = getWeekStart();

      const { error } = await supabase
        .from('user_plants')
        .delete()
        .eq('user_id', user.id)
        .eq('plant_id', plantId)
        .gte('logged_at', weekStart);

      if (error) throw error;

      await fetchWeeklyProgress();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to remove plant' };
    }
  };

  return (
    <WeeklyProgressContext.Provider
      value={{
        progress,
        loading,
        logPlant,
        removePlant,
        refreshProgress: fetchWeeklyProgress,
      }}
    >
      {children}
    </WeeklyProgressContext.Provider>
  );
}

export function useWeeklyProgress() {
  const context = useContext(WeeklyProgressContext);
  if (context === undefined) {
    throw new Error('useWeeklyProgress must be used within a WeeklyProgressProvider');
  }
  return context;
}
