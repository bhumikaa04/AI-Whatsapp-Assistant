import { useEffect, useState } from "react";
import API from "../../../services/api";
import { Zap, Target, AlertTriangle } from "lucide-react";

export default function Performance() {
  const [stats, setStats] = useState({ total: 0, aiResolved: 0, fallbacks: 0 });

  useEffect(() => {
    API.get("/analytics/performance").then(res => setStats(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">System Performance</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard icon={<Zap className="text-yellow-500"/>} label="Total Handled" value={stats.total} />
        <StatCard icon={<Target className="text-green-500"/>} label="AI Resolved" value={stats.aiResolved} />
        <StatCard icon={<AlertTriangle className="text-red-500"/>} label="Fallbacks" value={stats.fallbacks} />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-medium mb-4">Automation Accuracy</h3>
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-600 h-full transition-all duration-1000" 
            style={{ width: `${(stats.aiResolved / stats.total) * 100}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Your AI is successfully handling {((stats.aiResolved / stats.total) * 100).toFixed(1)}% of all queries.
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}