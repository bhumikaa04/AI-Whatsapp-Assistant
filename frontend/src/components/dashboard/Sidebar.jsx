import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  HelpCircle,
  Brain,
  BarChart3,
  Settings
} from "lucide-react";

const navItems = [
  {
    name: "Overview",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />
  },
  {
    name: "Conversations",
    path: "/dashboard/conversations",
    icon: <MessageSquare size={20} />
  },
  {
    name: "Expert System",
    path: "/dashboard/faqs",
    icon: <HelpCircle size={20} />
  },
  {
    name: "AI Control",
    path: "/dashboard/ai-control",
    icon: <Brain size={20} />
  },
  {
    name: "Analytics",
    path: "/dashboard/analytics",
    icon: <BarChart3 size={20} />
  },
  {
    name: "Settings",
    path: "/dashboard/settings",
    icon: <Settings size={20} />
  }
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b">
        <span className="text-xl font-bold text-gray-900">
          Replyly
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition
              ${
                isActive
                  ? "bg-indigo-50 text-[#4F46E5]"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t text-xs text-gray-500">
        © {new Date().getFullYear()} Replyly
      </div>
    </aside>
  );
}
