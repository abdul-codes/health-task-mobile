import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

const api = axios.create({
  baseURL: Platform.OS === 'android' ? "http://10.0.2.2:8000" : "http://localhost:8000", 
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  async (config) => {
    try {
      // Get token from auth store storage
      const authData = await AsyncStorage.getItem("auth-storage");
      if (authData) {
        const parsed = JSON.parse(authData);
        const token = parsed.state?.token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error('Error getting auth token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases here
    if (error.response?.status === 401) {
      // Handle unauthorized errors (e.g., redirect to login)
      // You could use router.push('/login') here if needed
    }
    return Promise.reject(error);
  }
);

export default api;