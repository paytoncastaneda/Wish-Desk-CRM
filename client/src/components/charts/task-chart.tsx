import { useQuery } from "@tanstack/react-query";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function TaskChart() {
  const { data: taskData = [], isLoading } = useQuery({
    queryKey: ["/api/dashboard/task-analytics"],
  });

  const formatData = (data: any[]) => {
    return data.map((item) => ({
      name: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
      completed: item.completed,
      date: item.date
    }));
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-2 bg-gray-200 rounded" style={{ width: `${Math.random() * 60 + 40}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const formattedData = formatData(taskData);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={formattedData}>
        <XAxis 
          dataKey="name" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6B7280' }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6B7280' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          labelStyle={{ color: '#374151', fontWeight: 500 }}
        />
        <Line
          type="monotone"
          dataKey="completed"
          stroke="#1976D2"
          strokeWidth={3}
          dot={{ fill: '#1976D2', strokeWidth: 0, r: 4 }}
          activeDot={{ r: 6, stroke: '#1976D2', strokeWidth: 2, fill: '#FFFFFF' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
