import { Leaf, X } from 'lucide-react';

interface PlantListProps {
  plants: Array<{
    plant_id: string;
    plant_name: string;
    emoji: string;
    points: number;
    logged_at: string;
  }>;
  loading: boolean;
  onRemovePlant: (plantId: string) => void;
}

export function PlantList({ plants, loading, onRemovePlant }: PlantListProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Plants This Week</h3>
        <div className="text-center text-gray-500 py-8">Loading...</div>
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Plants This Week</h3>
        <div className="text-center py-12">
          <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
            <Leaf className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600">No plants logged yet this week</p>
          <p className="text-sm text-gray-500 mt-2">Start tracking your plant diversity!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Plants This Week</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {plants.map((plant) => (
          <div
            key={plant.plant_id}
            className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-shadow group relative"
          >
            <button
              onClick={() => onRemovePlant(plant.plant_id)}
              className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
              title="Remove plant"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
            <div className="flex items-center space-x-3">
              <span className="text-3xl">{plant.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 truncate">{plant.plant_name}</p>
                <p className="text-sm text-emerald-600 font-semibold">
                  {plant.points === 1 ? '1 point' : `${plant.points} points`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
