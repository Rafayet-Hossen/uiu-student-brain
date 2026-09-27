import axios from "axios";

const getApiBaseUrl = () => {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();
  const isBrowser = typeof window !== "undefined";
  const hostname = isBrowser ? window.location.hostname : "";
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("172.");

  // If running on Vercel or any cloud public domain:
  if (isBrowser && !isLocalHost) {
    // If envUrl is a valid remote HTTPS URL, use it; otherwise ALWAYS point to Render backend
    if (
      envUrl &&
      !envUrl.includes("localhost") &&
      !envUrl.includes("127.0.0.1") &&
      envUrl.startsWith("http")
    ) {
      return envUrl;
    }
    return "https://uiu-student-brain.onrender.com/api";
  }

  // Local development on LAN / WiFi IP
  if (
    isBrowser &&
    (hostname.startsWith("192.168.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("172."))
  ) {
    return `${window.location.protocol}//${hostname}:8000/api`;
  }

  // Local dev with explicit envUrl
  if (envUrl && envUrl !== "") {
    return envUrl;
  }

  if (isBrowser) {
    if (window.location.port !== "8000" && window.location.port !== "") {
      return `${window.location.protocol}//${window.location.hostname}:8000/api`;
    }
    return "/api";
  }

  return "https://uiu-student-brain.onrender.com/api";
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s timeout to allow Render free tier backend to spin up from sleep
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/accounts/login/") &&
      !originalRequest.url?.includes("/accounts/token/refresh/")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refresh_token");

      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(
          `${API_BASE_URL}/accounts/token/refresh/`,
          {
            refresh: refreshToken,
          },
        );
        const newAccessToken = res.data.access;
        localStorage.setItem("access_token", newAccessToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
