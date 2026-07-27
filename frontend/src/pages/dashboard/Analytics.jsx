import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import API from "../../services/api"; // Axios instance
import { useAuth } from "../../context/AuthContext";

const SOCKET_SERVER_URL = "http://localhost:3000";

export default function Analytics() {
  const { user } = useAuth();
  
  const [kpis, setKpis] = useState({
    totalConversations: 0,
    messagesToday: 0,
    activeCustomers: 0,
    openLeads: 0,
    engagedLeads: 0,
    convertedLeads: 0,
    interestedLeads: 0
  });

  const [charts, setCharts] = useState({
    messagesPerDay: [],
    confidenceData: []
  });

  const [liveFeed, setLiveFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const systemID = user?.expertSystemID || user?._id;

  useEffect(() => {
    // Prevent fetching if systemID isn't ready yet
    if (!systemID) return;

    let isMounted = true;

    // 1. Fetch Analytics Data
    async function loadAnalytics() {
      try {
        setLoading(true);
        const response = await API.get(`/analytics?expertSystemID=${systemID}`);

        console.log("Analytics response:", response.data);
        
        if (response.data.success && isMounted) {
          setKpis(response.data.kpis || {});
          setCharts(response.data.charts || { messagesPerDay: [], confidenceData: [] });
        }
      } catch (err) {
        console.error("Failed to load live analytics:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadAnalytics();

    // 2. Connect to Socket.IO with WebSocket priority
    const socket = io(SOCKET_SERVER_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("⚡ Connected to real-time analytics socket:", socket.id);
    });

    socket.on("new_live_message", (message) => {
      if (!isMounted) return;

      setLiveFeed((prev) => [message, ...prev.slice(0, 9)]);
      
      // Dynamically increment real-time stats
      setKpis((prev) => ({
        ...prev,
        messagesToday: (prev.messagesToday || 0) + 1
      }));
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection warning:", err.message);
    });

    // Clean up socket instance and prevent state updates on unmounted component
    return () => {
      isMounted = false;
      socket.off("new_live_message");
      socket.disconnect();
    };
  }, [systemID]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-500 font-medium">
        Loading live analytics data...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      {/* KPI Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Conversations</p>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">{kpis.totalConversations}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Messages Today</p>
          <h3 className="text-2xl font-bold text-emerald-600 mt-1">{kpis.messagesToday}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Active Customers</p>
          <h3 className="text-2xl font-bold text-blue-600 mt-1">{kpis.activeCustomers}</h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Converted Leads</p>
          <h3 className="text-2xl font-bold text-purple-600 mt-1">{kpis.convertedLeads}</h3>
        </div>
      </div>

      {/* Real-time Activity Feed Stream */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Stream Feed
        </h2>

        {liveFeed.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Waiting for incoming messages...</p>
        ) : (
          <div className="space-y-3">
            {liveFeed.map((item, index) => (
              <div 
                key={item.id || index} 
                className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm flex justify-between items-center"
              >
                <div>
                  <span className="font-semibold text-gray-700">{item.sender || "User"}: </span>
                  <span className="text-gray-600">{item.text || item.content}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : "Just now"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}