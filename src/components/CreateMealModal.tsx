import { useState, useMemo } from 'react';
import { X, Search, Check, Plus } from 'lucide-react';
import { usePlants } from '../hooks/usePlants';
import { useMeals } from '../contexts/MealsContext';

interface CreateMealModalProps {
  onClose: () => void;
}

const MEAL_EMOJIS = ['🍽️', '🥗', '🥙', '🍜', '🍲', '🥘', '🍱', '🥣', '🍛', '🥡', '🍝', '🥪'];

export function CreateMealModal({ onClose }: CreateMealModalProps) {
  const { plants, getPlantsByCategory } = usePlants();
  const { createMeal } = useMeals();
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🍽️');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlants, setSelectedPlants] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const categories = ['all', ...Object.keys(getPlantsByCategory())];

  const filteredPlants = useMemo(() => {
    let filtered = plants;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [plants, selectedCategory, searchQuery]);

  const togglePlantSelection = (plantId: string) => {
    const newSelection = new Set(selectedPlants);
    if (newSelection.has(plantId)) {
      newSelection.delete(plantId);
    } else {
      newSelection.add(plantId);
    }
    setSelectedPlants(newSelection);
  };

  const totalPoints = useMemo(() => {
    let total = 0;
    selectedPlants.forEach(plantId => {
      const plant = plants.find(p => p.id === plantId);
      if (plant) total += plant.base_points;
    });
    return total;
  }, [selectedPlants, plants]);

  const handleCreate = async () => {
    if (!name.trim() || selectedPlants.size === 0) return;

    setIsCreating(true);

    const { error } = await createMeal(
      name.trim(),
      '',
      selectedEmoji,
      Array.from(selectedPlants)
    );

    if (!error) {
      onClose();
    }

    setIsCreating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Create Meal</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Meal Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Buddha Bowl, Green Smoothie"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
              <div className="flex gap-2 flex-wrap">
                {MEAL_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`text-2xl p-3 rounded-xl border-2 transition-all ${
                      selectedEmoji === emoji
                        ? 'border-emerald-500 bg-emerald-50 scale-110'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plants ({selectedPlants.size} selected, {totalPoints.toFixed(2)} pts)
              </label>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plants..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filteredPlants.map((plant) => (
              <button
                key={plant.id}
                onClick={() => togglePlantSelection(plant.id)}
                disabled={isCreating}
                className={`p-3 rounded-xl border transition-all text-left relative ${
                  selectedPlants.has(plant.id)
                    ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-400 ring-2 ring-emerald-400'
                    : 'bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200'
                }`}
              >
                {selectedPlants.has(plant.id) && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <div className="text-2xl mb-1">{plant.emoji}</div>
                <div className="font-medium text-gray-800 text-sm">{plant.name}</div>
                <div className="text-xs text-emerald-600">
                  {plant.base_points} {plant.base_points === 1 ? 'pt' : 'pts'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedPlants.size > 0 && name.trim() && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Meal</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
