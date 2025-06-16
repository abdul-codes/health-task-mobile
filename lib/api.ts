import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
const api = axios.create({
  baseURL: "http://localhost:5000", // d URL from AuthContext
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the auth token in requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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