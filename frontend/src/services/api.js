import axios from "axios";
import { auth } from "../firebase/config";

// Get base URL from environment or use default
const getBaseURL = () => {
  // Production: Use your Render backend URL
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://ai-whatsapp-assistant-1.onrender.com';
  }
  
  // Development: Use local backend
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const API = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for Firebase auth
API.interceptors.request.use(
  async (config) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken(true);
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error("Error attaching token:", error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

export default API;