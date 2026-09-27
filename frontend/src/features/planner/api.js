import api from "../../lib/api";
import queryCache from "../../lib/queryCache";

export function getSchedules(forceRefresh = false) {
  return queryCache.fetchWithSWR(
    "planner_schedules",
    () => api.get("/planner/schedules/").then((res) => res.data),
    { forceRefresh, ttl: 120000, staleTtl: 600000 },
  );
}

export function createSchedule(schedule) {
  queryCache.invalidate("planner_");
  queryCache.invalidate("analytics_");
  return api.post("/planner/schedules/", schedule).then((res) => res.data);
}

export function updateSchedule(id, schedule) {
  queryCache.invalidate("planner_");
  queryCache.invalidate("analytics_");
  return api
    .patch(`/planner/schedules/${id}/`, schedule)
    .then((res) => res.data);
}

export function deleteSchedule(id) {
  queryCache.invalidate("planner_");
  queryCache.invalidate("analytics_");
  return api.delete(`/planner/schedules/${id}/`).then((res) => res.data);
}

export function extractPlannerErrorMessage(error) {
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
