import { useEffect, useState } from "react";
import API from "../../services/api";
import { 
  MessageSquare, Users, Mail, Brain, 
  AlertCircle, Activity, Settings,
  HelpCircle, Zap, Phone, Wifi,
  TrendingUp, UserPlus, Bot
} from "lucide-react";

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await API.get("/expert-system/me");
      setData(response.data);
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Unable to load dashboard</h3>
        <p className="text-red-600 mb-4">{error || data?.message}</p>
        <button 
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { system, stats = {}, activity = [] } = data ;

  const kpiCards = [
    {
      title: "Total Conversations",
      value: stats.totalConversations|| 0,
      icon: MessageSquare,
      color: "bg-blue-50",
      textColor: "text-blue-700",
      iconColor: "text-blue-600"
    },
    {
      title: "Total Leads",
      value: stats.totalLeads|| 0,
      icon: UserPlus,
      color: "bg-green-50",
      textColor: "text-green-700",
      iconColor: "text-green-600"
    },
    {
      title: "Messages Today",
      value: stats.messagesToday || 0,
      icon: Mail,
      color: "bg-purple-50",
      textColor: "text-purple-700",
      iconColor: "text-purple-600"
    },
    {
      title: "FAQ Hit Rate",
      value: `${stats.faqHitRate}%`|| 0 ,
      icon: Brain,
      color: "bg-amber-50",
      textColor: "text-amber-700",
      iconColor: "text-amber-600"
    },
    {
      title: "GPT Fallbacks",
      value: stats.gptFallbacks || 0 ,
      icon: AlertCircle,
      color: "bg-red-50",
      textColor: "text-red-700",
      iconColor: "text-red-600"
    },
    {
      title: "Active Users (24h)",
      value: stats.activeUsers24h || 0 ,
      icon: Activity,
      color: "bg-emerald-50",
      textColor: "text-emerald-700",
      iconColor: "text-emerald-600"
    }
  ];

  const systemStatus = [
    {
      title: "Bot Status",
      value: "Active",
      icon: Bot,
      status: "success"
    },
    {
      title: "Fallback Mode",
      value: system.fallbackType.toUpperCase(),
      icon: HelpCircle,
      status: system.fallbackType === "gpt" ? "warning" : "info"
    },
    {
      title: "WhatsApp",
      value: "Connected",
      icon: Wifi,
      status: "success"
    },
    {
      title: "Owner Phone",
      value: system.ownerPhone,
      icon: Phone,
      status: "info"
    }
  ];

  const quickActions = [
    { label: "Manage FAQs", href: "/dashboard/faqs", icon: HelpCircle },
    { label: "View Leads", href: "/dashboard/leads", icon: Users },
    { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
    { label: "Bot Settings", href: "/dashboard/settings", icon: Settings }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, <span className="text-indigo-600">{system.name}</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Here's a quick overview of your WhatsApp assistant
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpiCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div 
              key={index} 
              className={`${card.color} rounded-xl p-5 shadow-sm border border-gray-100`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${card.textColor}`}>
                    {card.title}
                  </p>
                  <p className={`text-2xl font-bold ${card.textColor} mt-2`}>
                    {card.value}
                  </p>
                </div>
                <div className={`${card.iconColor} p-3 rounded-lg bg-white/50`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStatus.map((item, index) => {
          const Icon = item.icon;
          const statusColor = {
            success: "text-green-600 bg-green-100",
            warning: "text-amber-600 bg-amber-100",
            info: "text-blue-600 bg-blue-100",
            error: "text-red-600 bg-red-100"
          }[item.status];

          return (
            <div 
              key={index} 
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg ${statusColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <p className="font-semibold text-gray-900 mt-1">{item.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-gray-400" />
            Recent Activity
          </h2>
          <span className="text-sm text-gray-500">Last 24 hours</span>
        </div>

        {activity.length > 0 ? (
          <div className="space-y-4">
            {activity.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  <span className="text-gray-700">{item.text}</span>
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">
              Activity will appear here once your bot starts receiving messages
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <a
                key={index}
                href={action.href}
                className="group bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:border-indigo-300 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 transition">
                    <Icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition">
                    {action.label}
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Dashboard Footer */}
      <div className="pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {" • "}
          <button 
            onClick={fetchDashboardData}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Refresh data
          </button>
        </p>
      </div>
    </div>
  );
}