import { AuthProvider, useAuth } from './contexts/AuthContext';
import { WeeklyProgressProvider } from './contexts/WeeklyProgressContext';
import { MealsProvider } from './contexts/MealsContext';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Dashboard /> : <Auth />;
}

function App() {
  return (
    <AuthProvider>
      <WeeklyProgressProvider>
        <MealsProvider>
          <AppContent />
        </MealsProvider>
      </WeeklyProgressProvider>
    </AuthProvider>
  );
}

export default App;
