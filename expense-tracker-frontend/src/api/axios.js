
// src/api/axios.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api", // set env var VITE_API_BASE if needed
  timeout: 15000,
});

// attach token from sessionStorage (or localStorage fallback)
api.interceptors.request.use((config) => {
  try {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
}, (err) => Promise.reject(err));

// optional: central response error logger (makes debugging easier)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Put a console log for debugging
    console.error("API error:", err?.response?.status, err?.response?.data || err.message);
    return Promise.reject(err);
  }
);

export default api;

