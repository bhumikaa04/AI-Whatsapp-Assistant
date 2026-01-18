import axios from "axios";
import { auth } from "../firebase/config"; // Import your firebase auth instance

const API = axios.create({
  baseURL: "http://localhost:3000/api",
  withCredentials: true,
});

// Add a request interceptor
API.interceptors.request.use(
  async (config) => {
    try {
      // 1. Get the currently logged-in Firebase user
      const user = auth.currentUser;

      if (user) {
        // 2. Get the ID Token (JWT) from Firebase
        // Passing true forces a refresh if the token is expired
        const token = await user.getIdToken();
        
        // 3. Attach the token to the Authorization header
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    } catch (error) {
      console.error("Error attaching token to request:", error);
      return Promise.reject(error);
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;