import { useAuth } from "../../context/AuthContext";
import {Link} from "react-router-dom" ; 
import {
  MoreVertical,
  Bell,
  Search, 
} from 'lucide-react'

export default function Topbar() {
  const { user , logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between">
      {/* Page title placeholder */}
      <div className="text-sm text-gray-500">
      </div>

      {/* Right section */}
<div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent w-64"
                />
              </div>
              
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-6 w-6" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="relative group">
                <button className="flex items-center space-x-2">
                  <div className="h-8 w-8 rounded-full bg-[#4F46E5] text-white flex items-center justify-center font-semibold">
                    {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <MoreVertical className="h-5 w-5 text-gray-500" />
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
                  <div className="p-4 border-b">
                    <p className="font-semibold">{user?.displayName || 'User'}</p>
                    <p className="text-sm text-gray-600 truncate">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <Link to="/dashboard/profile" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">Profile</Link>
                    <Link to="/settings" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">Settings</Link>
                    <button 
                      onClick={logout}
                      className="block w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
    </header>
  );
}
