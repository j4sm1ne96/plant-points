import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Plant = Database['public']['Tables']['plants']['Row'];

export function usePlants() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setPlants(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plants');
    } finally {
      setLoading(false);
    }
  };

  const getPlantsByCategory = () => {
    const categories: Record<string, Plant[]> = {};
    plants.forEach((plant) => {
      if (!categories[plant.category]) {
        categories[plant.category] = [];
      }
      categories[plant.category].push(plant);
    });
    return categories;
  };

  return { plants, loading, error, getPlantsByCategory };
}
