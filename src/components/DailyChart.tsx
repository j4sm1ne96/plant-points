import { useMemo } from 'react';

interface DailyChartProps {
  loggedPlants: Array<{
    plant_id: string;
    plant_name: string;
    emoji: string;
    points: number;
    logged_at: string;
  }>;
}

interface DayData {
  date: string;
  dayName: string;
  shortDay: string;
  points: number;
  isToday: boolean;
}

export function DailyChart({ loggedPlants }: DailyChartProps) {
  const weekData = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);

    const days: DayData[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const plantsForDay = loggedPlants.filter(p => {
        const loggedDate = new Date(p.logged_at);
        return loggedDate >= dayStart && loggedDate <= dayEnd;
      });

      const pointsForDay = plantsForDay.reduce((sum, p) => sum + p.points, 0);

      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      days.push({
        date: date.toISOString(),
        dayName: dayNames[i],
        shortDay: shortDays[i],
        points: pointsForDay,
        isToday,
      });
    }

    return days;
  }, [loggedPlants]);

  const maxPoints = Math.max(...weekData.map(d => d.points), 1);

  return (
    <div className="bg-white rounded-3xl shadow-xl p-8">
      <h3 className="text-xl font-bold text-gray-800 mb-6">Daily Breakdown</h3>

      <div className="flex items-end justify-between gap-3 h-52">
        {weekData.map((day) => {
          const heightPercentage = (day.points / maxPoints) * 100;

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-3">
              <div className="flex-1 w-full flex flex-col items-center justify-end">
                <div
                  className={`text-xs font-semibold mb-1 transition-colors ${
                    day.points > 0
                      ? day.isToday
                        ? 'text-teal-600'
                        : 'text-emerald-600'
                      : 'text-gray-400'
                  }`}
                >
                  {day.points > 0 ? day.points.toFixed(1) : '0'}
                </div>
                <div className="w-full relative">
                  <div
                    className={`w-full rounded-lg transition-all duration-300 ${
                      day.isToday
                        ? 'bg-gradient-to-t from-teal-500 to-teal-400'
                        : day.points > 0
                        ? 'bg-gradient-to-t from-emerald-500 to-emerald-400'
                        : 'bg-gray-200'
                    }`}
                    style={{ height: day.points > 0 ? `${Math.max(heightPercentage, 8)}%` : '8px' }}
                  />
                </div>
              </div>

              <div className="text-center">
                <div className={`text-xs font-medium ${day.isToday ? 'text-teal-600' : 'text-gray-600'} hidden sm:block`}>
                  {day.shortDay}
                </div>
                <div className={`text-xs font-medium ${day.isToday ? 'text-teal-600' : 'text-gray-600'} sm:hidden`}>
                  {day.shortDay.charAt(0)}
                </div>
                {day.isToday && (
                  <div className="w-1.5 h-1.5 bg-teal-500 rounded-full mx-auto mt-1"></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
