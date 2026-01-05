import axios from "axios";
import { toast } from "react-toastify";

// Ensure this matches your NestJS port (usually 3001)
const API_URL = "http://localhost:3001";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// --- REQUEST INTERCEPTOR ---
// Automatically attaches the JWT to every request to prevent 401 errors
apiClient.interceptors.request.use(
  (config) => {
    // Standardize on the 'token' key
    const token = localStorage.getItem("token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // This warning appears if the user isn't logged in or localStorage was cleared
      console.warn("No token found in localStorage! Request will likely fail 401.");
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// --- RESPONSE INTERCEPTOR ---
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const originalRequest = error.config;
      
      const isLoginRequest = originalRequest.url.includes("/auth/login") || 
                             originalRequest.url.includes("/users/login");

      if (status === 401 && !isLoginRequest) {
          if (!toast.isActive("session-expired")) {
             toast.error("Session expired. Please log in again.", { toastId: "session-expired" });
          }
          
          // Clear everything so the UI resets
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = '/login';
      } else if (status === 500) {
        toast.error("Server error. Please try again later.");
      }
    } else {
      toast.error("Network error. Is the backend server running?");
    }
    return Promise.reject(error);
  }
);

export default apiClient;