import api from "../../lib/api";
import queryCache from "../../lib/queryCache";

export function getAnalyticsDashboard(forceRefresh = false) {
  return queryCache.fetchWithSWR(
    "analytics_dashboard",
    () => api.get("/analytics/dashboard/").then((res) => res.data),
    { forceRefresh, ttl: 90000, staleTtl: 600000 },
  );
}

export function extractAnalyticsErrorMessage(error) {
  const data = error?.response?.data;

  if (!data) {
    return "Something went wrong. Please try again.";
  }

  if (typeof data === "string") {
    return data;
  }

  if (data.detail) {
    return data.detail;
  }

  const firstKey = Object.keys(data)[0];

  if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
    return data[firstKey][0];
  }

  return "Something went wrong. Please try again.";
}
