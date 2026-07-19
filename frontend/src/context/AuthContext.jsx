import { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase/config";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import axios from "../services/api";
import { toast } from "react-hot-toast";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  const syncWithBackend = async (firebaseUser) => {
    try {
      if (!firebaseUser) {
        console.log("No Firebase user to sync");
        return;
      }

      console.log("🔄 Syncing user with backend:", firebaseUser.email);
      
      // Get fresh token
      const token = await firebaseUser.getIdToken(true); // Force refresh
      console.log("🔑 Token obtained");
      
      // Call sync endpoint
      const res = await axios.post(
        "/auth/sync-user",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("✅ Backend sync response:", res.data);
      
      if (res.data.success) {
        setUser(res.data.user);
        setProfileComplete(res.data.isProfileComplete);
        console.log("📊 Profile complete?", res.data.isProfileComplete);
      }
    } catch (error) {
      console.error("❌ Sync with backend failed:", error.response?.data || error.message);
      
      // If unauthorized, maybe token expired
      if (error.response?.status === 401) {
        console.log("Token invalid, refreshing...");
        // Force re-auth
        await auth.signOut();
        window.location.href = "/login";
      }
    }
  };

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    setLoading(true); // Start loading when state changes
    if (firebaseUser) {
      await syncWithBackend(firebaseUser);
    } else {
      setUser(null);
      setProfileComplete(false);
    }
    setLoading(false); // Only stop loading after sync is done
  });

  return unsubscribe;
}, []);

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await syncWithBackend(userCredential.user);
      toast.success("Welcome back!");
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error };
    }
  };

  const signup = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (name) {
        await updateProfile(userCredential.user, { displayName: name });
      }
      
      await syncWithBackend(userCredential.user);
      toast.success("Account created!");
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      await syncWithBackend(result.user);
      toast.success("Logged in with Google");
      return { success: true };
    } catch (error) {
      console.error("Google login error:", error);
      toast.error(error.message);
      return { success: false, error };
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfileComplete(false);
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const value = {
    user,
    profileComplete,
    loading,
    login,
    signup,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
    refreshSync: () => syncWithBackend(auth.currentUser),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};