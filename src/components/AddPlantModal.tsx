import { useState, useMemo } from 'react';
import { X, Search, Sparkles, Check } from 'lucide-react';
import { usePlants } from '../hooks/usePlants';
import { useWeeklyProgress } from '../contexts/WeeklyProgressContext';

interface AddPlantModalProps {
  onClose: () => void;
}

export function AddPlantModal({ onClose }: AddPlantModalProps) {
  const { plants, getPlantsByCategory } = usePlants();
  const { logPlant, progress } = useWeeklyProgress();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlants, setSelectedPlants] = useState<Set<string>>(new Set());
  const [isLogging, setIsLogging] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const categories = ['all', ...Object.keys(getPlantsByCategory())];

  const loggedPlantIds = useMemo(
    () => new Set(progress.loggedPlants.map((p) => p.plant_id)),
    [progress.loggedPlants]
  );

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

    return filtered.sort((a, b) => {
      const aLogged = loggedPlantIds.has(a.id);
      const bLogged = loggedPlantIds.has(b.id);
      if (aLogged === bLogged) return 0;
      return aLogged ? 1 : -1;
    });
  }, [plants, selectedCategory, searchQuery, loggedPlantIds]);

  const suggestedPlants = useMemo(() => {
    const unloggedPlants = plants.filter((p) => !loggedPlantIds.has(p.id));
    const categoryCount: Record<string, number> = {};

    progress.loggedPlants.forEach((p) => {
      const plant = plants.find((pl) => pl.id === p.plant_id);
      if (plant) {
        categoryCount[plant.category] = (categoryCount[plant.category] || 0) + 1;
      }
    });

    const underrepresentedCategories = Object.keys(getPlantsByCategory()).filter(
      (cat) => !categoryCount[cat] || categoryCount[cat] < 2
    );

    return unloggedPlants
      .filter((p) => underrepresentedCategories.includes(p.category))
      .slice(0, 6);
  }, [plants, loggedPlantIds, progress.loggedPlants, getPlantsByCategory]);

  const togglePlantSelection = (plantId: string) => {
    const newSelection = new Set(selectedPlants);
    if (newSelection.has(plantId)) {
      newSelection.delete(plantId);
    } else {
      newSelection.add(plantId);
    }
    setSelectedPlants(newSelection);
  };

  const handleAddSelected = async () => {
    if (selectedPlants.size === 0) return;

    setIsLogging(true);

    for (const plantId of selectedPlants) {
      const plant = plants.find(p => p.id === plantId);
      if (plant) {
        await logPlant(plantId, plant.base_points);
      }
    }

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1000);

    setIsLogging(false);
  };

  const totalPoints = useMemo(() => {
    let total = 0;
    selectedPlants.forEach(plantId => {
      const plant = plants.find(p => p.id === plantId);
      if (plant) total += plant.base_points;
    });
    return total;
  }, [selectedPlants, plants]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Add Plant</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search plants..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {suggestedPlants.length > 0 && !searchQuery && selectedCategory === 'all' && (
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-800">Suggested for You</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {suggestedPlants.map((plant) => (
                  <button
                    key={plant.id}
                    onClick={() => togglePlantSelection(plant.id)}
                    disabled={isLogging}
                    className={`p-4 rounded-xl border transition-all disabled:opacity-50 text-left relative ${
                      selectedPlants.has(plant.id)
                        ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-400 ring-2 ring-emerald-400'
                        : 'bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border-amber-200'
                    }`}
                  >
                    {selectedPlants.has(plant.id) && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-2xl mb-1">{plant.emoji}</div>
                    <div className="font-medium text-gray-800 text-sm">{plant.name}</div>
                    <div className="text-xs text-amber-600">
                      {plant.base_points} {plant.base_points === 1 ? 'pt' : 'pts'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">
              {selectedCategory === 'all' ? 'All Plants' : selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filteredPlants.map((plant) => {
                const alreadyLogged = loggedPlantIds.has(plant.id);
                return (
                  <button
                    key={plant.id}
                    onClick={() => !alreadyLogged && togglePlantSelection(plant.id)}
                    disabled={isLogging || alreadyLogged}
                    className={`p-4 rounded-xl border transition-all text-left relative ${
                      alreadyLogged
                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                        : selectedPlants.has(plant.id)
                        ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-emerald-400 ring-2 ring-emerald-400'
                        : 'bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-emerald-200'
                    }`}
                  >
                    {selectedPlants.has(plant.id) && !alreadyLogged && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <div className="text-2xl mb-1">{plant.emoji}</div>
                    <div className="font-medium text-gray-800 text-sm">{plant.name}</div>
                    <div className={`text-xs ${alreadyLogged ? 'text-gray-500' : 'text-emerald-600'}`}>
                      {alreadyLogged ? 'Logged' : `${plant.base_points} ${plant.base_points === 1 ? 'pt' : 'pts'}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedPlants.size > 0 && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <button
              onClick={handleAddSelected}
              disabled={isLogging}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add {selectedPlants.size} {selectedPlants.size === 1 ? 'Plant' : 'Plants'} ({totalPoints.toFixed(2)} {totalPoints === 1 ? 'pt' : 'pts'})
            </button>
          </div>
        )}

        {showSuccess && (
          <div className="absolute inset-0 bg-white/95 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              <p className="text-xl font-bold text-emerald-600">Plant logged!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
