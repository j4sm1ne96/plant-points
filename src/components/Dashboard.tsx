import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useWeeklyProgress } from '../contexts/WeeklyProgressContext';
import { LogOut, Plus, Award, TrendingUp } from 'lucide-react';
import { ProgressRing } from './ProgressRing';
import { AddPlantModal } from './AddPlantModal';
import { PlantList } from './PlantList';
import { DailyChart } from './DailyChart';
import { MealsList } from './MealsList';
import { CreateMealModal } from './CreateMealModal';

export function Dashboard() {
  const { signOut } = useAuth();
  const { progress, loading, removePlant } = useWeeklyProgress();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateMealModal, setShowCreateMealModal] = useState(false);

  const progressPercentage = Math.min((progress.totalPoints / 30) * 100, 100);
  const goalReached = progress.totalPoints >= 30;

  const handleRemovePlant = async (plantId: string) => {
    await removePlant(plantId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-emerald-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-2 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">Plant Points</h1>
          </div>
          <button
            onClick={signOut}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                This Week's Progress
              </h2>
              <p className="text-gray-600 mb-6">
                Aim for 30+ unique plant points for optimal gut health
              </p>

              <div className="space-y-4">
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                    {loading ? '...' : progress.totalPoints.toFixed(2)}
                  </span>
                  <span className="text-2xl text-gray-400">/</span>
                  <span className="text-2xl text-gray-400">30</span>
                </div>

                <div className="flex items-center gap-6 text-sm flex-wrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {progress.uniquePlants} unique {progress.uniquePlants === 1 ? 'plant' : 'plants'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {loading ? '...' : progress.todayPoints.toFixed(2)} points today
                    </span>
                  </div>
                </div>

                {goalReached && (
                  <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">Goal reached! Amazing work!</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <ProgressRing
                percentage={progressPercentage}
                size={160}
                strokeWidth={12}
              />
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-full mt-8 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Plant</span>
          </button>
        </div>

        <MealsList onCreateMeal={() => setShowCreateMealModal(true)} />

        <PlantList plants={progress.loggedPlants} loading={loading} onRemovePlant={handleRemovePlant} />

        <DailyChart loggedPlants={progress.loggedPlants} />
      </main>

      {showAddModal && <AddPlantModal onClose={() => setShowAddModal(false)} />}
      {showCreateMealModal && <CreateMealModal onClose={() => setShowCreateMealModal(false)} />}
    </div>
  );
}
