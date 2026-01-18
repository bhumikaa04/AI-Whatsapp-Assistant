import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

/* Public pages */
import Home from "./pages/public/Home";
import Features from "./pages/public/Features";
import Pricing from "./pages/public/Pricing";
import Login from "./pages/public/Login";
import Signup from "./pages/public/Signup";

/* Dashboard layout + pages */
import DashboardLayout from "./layouts/DashboardLayout";
import Conversations from "./pages/dashboard/conversations/Conversation";
import ConversationDetail from "./pages/dashboard/conversations/ConversationDetail";
import FAQs from "./pages/dashboard/ExpertSystem/FAQ";
import AIControl from "./pages/dashboard/AIControl";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import Profile from "./pages/dashboard/Profile"

/* Auth */
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Overview from "./pages/dashboard/Overview";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* 🌐 Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* 🔐 Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Overview />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="conversations/:id" element={<ConversationDetail />} />
            <Route path="faqs" element={<FAQs />} />
            <Route path="profile" element={<Profile />} />
            <Route path="ai-control" element={<AIControl />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
