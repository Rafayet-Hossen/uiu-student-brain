import api from "../../lib/api";

export function getSchedules() {
  return api.get("/planner/schedules/").then((res) => res.data);
}

export function createSchedule(schedule) {
  return api.post("/planner/schedules/", schedule).then((res) => res.data);
}

export function updateSchedule(id, schedule) {
  return api
    .patch(`/planner/schedules/${id}/`, schedule)
    .then((res) => res.data);
}

export function deleteSchedule(id) {
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
