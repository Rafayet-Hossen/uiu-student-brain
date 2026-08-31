import api from "../../lib/api";

export function getStudySessions() {
  return api.get("/tracker/sessions/").then((res) => res.data);
}

export function createStudySession(session) {
  return api.post("/tracker/sessions/", session).then((res) => res.data);
}

export function updateStudySession(id, session) {
  return api.patch(`/tracker/sessions/${id}/`, session).then((res) => res.data);
}

export function deleteStudySession(id) {
  return api.delete(`/tracker/sessions/${id}/`).then((res) => res.data);
}

export function getStreakSummary() {
  return api.get("/tracker/streaks/").then((res) => res.data);
}

export function getRewards() {
  return api.get("/tracker/rewards/").then((res) => res.data);
}

export function getStudyGoal() {
  return api.get("/tracker/goal/").then((res) => res.data);
}

export function updateStudyGoal(goalData) {
  return api.patch("/tracker/goal/", goalData).then((res) => res.data);
}

export function extractTrackerErrorMessage(error) {
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
