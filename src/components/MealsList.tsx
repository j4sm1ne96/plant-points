import { Utensils, Plus, Trash2 } from 'lucide-react';
import { useMeals } from '../contexts/MealsContext';
import { useWeeklyProgress } from '../contexts/WeeklyProgressContext';

interface MealsListProps {
  onCreateMeal: () => void;
}

export function MealsList({ onCreateMeal }: MealsListProps) {
  const { meals, loading, deleteMeal } = useMeals();
  const { logPlant, progress } = useWeeklyProgress();

  const loggedPlantIds = new Set(progress.loggedPlants.map(p => p.plant_id));

  const handleLogMeal = async (mealId: string) => {
    const meal = meals.find(m => m.id === mealId);
    if (!meal) return;

    for (const plant of meal.plants) {
      if (!loggedPlantIds.has(plant.id)) {
        await logPlant(plant.id, plant.base_points);
      }
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (confirm('Are you sure you want to delete this meal?')) {
      await deleteMeal(mealId);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Saved Meals</h3>
        </div>
        <div className="text-center text-gray-500 py-8">Loading meals...</div>
      </div>
    );
  }

  if (meals.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">Saved Meals</h3>
          <button
            onClick={onCreateMeal}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Create Meal</span>
          </button>
        </div>
        <div className="text-center py-12">
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">No saved meals yet</p>
          <p className="text-sm text-gray-500 mt-2">Create meals to quickly log multiple plants at once</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800">Saved Meals</h3>
        <button
          onClick={onCreateMeal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meals.map((meal) => {
          const newPlantsCount = meal.plants.filter(p => !loggedPlantIds.has(p.id)).length;
          const allPlantsLogged = newPlantsCount === 0;

          return (
            <div
              key={meal.id}
              className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{meal.emoji}</span>
                  <h4 className="font-semibold text-gray-800">{meal.name}</h4>
                </div>
                <button
                  onClick={() => handleDeleteMeal(meal.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                  title="Delete meal"
                >
                  <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {meal.plants.slice(0, 6).map(plant => (
                    <span
                      key={plant.id}
                      className="text-lg"
                      title={plant.name}
                    >
                      {plant.emoji}
                    </span>
                  ))}
                  {meal.plants.length > 6 && (
                    <span className="text-sm text-gray-500 self-center">
                      +{meal.plants.length - 6} more
                    </span>
                  )}
                </div>
                <p className="text-sm text-emerald-600 font-medium mt-2">
                  {meal.plants.length} {meal.plants.length === 1 ? 'plant' : 'plants'} • {meal.totalPoints.toFixed(2)} points
                </p>
              </div>

              <button
                onClick={() => handleLogMeal(meal.id)}
                disabled={allPlantsLogged}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  allPlantsLogged
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg'
                }`}
              >
                {allPlantsLogged
                  ? 'All plants logged this week'
                  : newPlantsCount === meal.plants.length
                  ? 'Log Meal'
                  : `Log ${newPlantsCount} new ${newPlantsCount === 1 ? 'plant' : 'plants'}`
                }
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
