import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Clock, AlertCircle, Sparkles } from "lucide-react";
import API from "../../../services/api";
import { useAuth } from "../../../context/AuthContext";

export default function Conversation() {
  const { user } = useAuth(); 
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const PRESET_AVATARS = ["🌻", "😊", "🦊", "🚀", "🎨"];

  // Safely derive systemID from user context
  const systemID = user?.expertSystemID || user?._id;

  // Memoize fetch function to handle async user context gracefully
  const fetchConversations = useCallback(async () => {
    if (!systemID) return;

    try {
      setLoading(true);
      const res = await API.get(`/conversations?expertSystemID=${systemID}`);
      
      // Handle both raw arrays and nested object wrappers cleanly
      if (Array.isArray(res.data)) {
        setConversations(res.data);
      } else if (res.data && Array.isArray(res.data.conversations)) {
        setConversations(res.data.conversations);
      } else {
        console.error("Expected an array from backend API but received:", res.data);
        setConversations([]);
      }
    } catch (err) {
      console.error("Error fetching pipeline conversations:", err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [systemID]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Helper styling configuration to give different intent tags proper visual prominence
  const getIntentBadgeStyle = (intent) => {
    switch (intent) {
      case "Interested":
      case "Converted":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Product Inquiry":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Complaint":
        return "bg-red-100 text-red-800 border border-red-200";
      case "Spam":
        return "bg-gray-200 text-gray-700 border border-gray-300";
      default:
        return "bg-purple-100 text-purple-800 border border-purple-200";
    }
  };

  const safeConversations = Array.isArray(conversations) ? conversations : [];

  if (loading && !safeConversations.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* View Header with CRM Metadata Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Conversations</h1>
          <p className="text-sm text-gray-500 mt-1">
            Reviewing {safeConversations.length} total managed interaction profiles.
          </p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 rounded-lg p-2 flex items-center text-xs font-semibold">
          <Sparkles className="w-4 h-4 mr-1.5" /> Automated Lead Scoring Running
        </div>
      </div>

      {/* Main Table/List Interface */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {safeConversations.map((item) => {
          const lastMessage = item.messages?.[item.messages.length - 1]?.text || "No interactions recorded";
          const totalMsgCount = item.totalMessages || item.messages?.length || 0;
          const currentIntent = item.intent || "New Lead";
          const customerName = item.name || "Anonymous Prospect";
          const customerAvatar = PRESET_AVATARS[(item.avatarSeed || 0) % PRESET_AVATARS.length];

          return (
            <Link
              key={item._id}
              to={`/dashboard/conversations/${item._id}`}
              className="block p-5 hover:bg-gray-50 transition-colors duration-150 ease-in-out group"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Left Side: Avatar & Core Identifying Fields */}
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <div className="h-11 w-11 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex-shrink-0 overflow-hidden">
                    <div className="transform scale-125">
                      {customerAvatar}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="font-semibold text-gray-900 truncate">{customerName}</p>
                      <span className="text-sm text-gray-400">·</span>
                      <p className="text-sm text-gray-500 font-mono">{item.customerPhone || item.phone}</p>
                    </div>
                    
                    {/* Snippet previewing the last message sent */}
                    <p className="text-sm text-gray-600 mt-1 truncate max-w-2xl">
                      {lastMessage}
                    </p>
                  </div>
                </div>

                {/* Right Side: Metadata Badges & Timestamps */}
                <div className="flex flex-col items-end space-y-2 flex-shrink-0 text-right">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getIntentBadgeStyle(currentIntent)}`}>
                      {currentIntent}
                    </span>
                    
                    <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-md flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1 opacity-70" /> {totalMsgCount}
                    </span>
                  </div>

                  {/* Relative Interaction Clock Indicators */}
                  <div className="text-xs text-gray-400 flex items-center justify-end">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.lastInteraction ? (
                      new Date(item.lastInteraction).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    ) : (
                      "Recent"
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}

        {/* Empty State Handler */}
        {safeConversations.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-3">
            <AlertCircle className="w-8 h-8 text-gray-300" />
            <p className="text-base font-medium">No active conversations found</p>
            <p className="text-sm text-gray-400">New inbound messages from Twilio will initialize here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}