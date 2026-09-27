import axios from "axios";

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    if (envUrl.startsWith("/")) return envUrl;
    if (
      typeof window !== "undefined" &&
      (window.location.hostname.startsWith("192.168.") ||
        window.location.hostname.startsWith("10.") ||
        window.location.hostname.startsWith("172."))
    ) {
      try {
        const parsed = new URL(envUrl);
        if (
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1"
        ) {
          return `${window.location.protocol}//${window.location.hostname}:${parsed.port || "8000"}/api`;
        }
      } catch {
        // ignore
      }
    }
    return envUrl;
  }
  if (typeof window !== "undefined") {
    if (
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1" &&
      !window.location.hostname.startsWith("192.168.") &&
      !window.location.hostname.startsWith("10.") &&
      !window.location.hostname.startsWith("172.")
    ) {
      return "https://uiu-student-brain.onrender.com/api";
    }
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
  timeout: 45000,
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
    if (!originalRequest) return Promise.reject(error);

    // 1. Handle transient 502/503/504 or network timeout (e.g. backend spin-up) with 1 auto-retry
    const isTransientError =
      !error.response ||
      error.code === "ECONNABORTED" ||
      [502, 503, 504].includes(error.response.status);

    if (isTransientError && !originalRequest._networkRetry && originalRequest.method !== "post" && originalRequest.method !== "POST") {
      originalRequest._networkRetry = true;
      await new Promise((res) => setTimeout(res, 1200));
      return api(originalRequest);
    }

    // 2. Handle 401 Unauthorized token refresh
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
          { timeout: 15000 },
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
