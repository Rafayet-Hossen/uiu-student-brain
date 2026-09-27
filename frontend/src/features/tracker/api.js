import api from "../../lib/api";
import queryCache from "../../lib/queryCache";

export function getStudySessions(forceRefresh = false) {
  return queryCache.fetchWithSWR(
    "tracker_sessions",
    () => api.get("/tracker/sessions/").then((res) => res.data),
    { forceRefresh, ttl: 90000, staleTtl: 600000 },
  );
}

export function createStudySession(session) {
  queryCache.invalidate("tracker_");
  queryCache.invalidate("analytics_");
  return api.post("/tracker/sessions/", session).then((res) => res.data);
}

export function updateStudySession(id, session) {
  queryCache.invalidate("tracker_");
  queryCache.invalidate("analytics_");
  return api.patch(`/tracker/sessions/${id}/`, session).then((res) => res.data);
}

export function deleteStudySession(id) {
  queryCache.invalidate("tracker_");
  queryCache.invalidate("analytics_");
  return api.delete(`/tracker/sessions/${id}/`).then((res) => res.data);
}

export function startStudySession(id) {
  queryCache.invalidate("tracker_");
  queryCache.invalidate("analytics_");
  return api.post(`/tracker/sessions/${id}/start/`).then((res) => res.data);
}

export function completeStudySession(id) {
  queryCache.invalidate("tracker_");
  queryCache.invalidate("analytics_");
  return api.post(`/tracker/sessions/${id}/complete/`).then((res) => res.data);
}

export function extendStudySession(id, extraMinutes = 15) {
  queryCache.invalidate("tracker_");
  queryCache.invalidate("analytics_");
  return api
    .post(`/tracker/sessions/${id}/extend/`, { extra_minutes: extraMinutes })
    .then((res) => res.data);
}

export function generateSessionQuiz(id, forceRefresh = false) {
  return api
    .post(`/tracker/sessions/${id}/quiz/generate/`, {
      force_refresh: forceRefresh,
    })
    .then((res) => res.data);
}

export function submitSessionQuiz(id, questionResults) {
  queryCache.invalidate("tracker_");
  queryCache.invalidate("analytics_");
  return api
    .post(`/tracker/sessions/${id}/quiz/submit/`, {
      question_results: questionResults,
    })
    .then((res) => res.data);
}

export function getStreakSummary(forceRefresh = false) {
  return queryCache.fetchWithSWR(
    "tracker_streaks",
    () => api.get("/tracker/streaks/").then((res) => res.data),
    { forceRefresh, ttl: 90000, staleTtl: 600000 },
  );
}

export function getRewards(forceRefresh = false) {
  return queryCache.fetchWithSWR(
    "tracker_rewards",
    () => api.get("/tracker/rewards/").then((res) => res.data),
    { forceRefresh, ttl: 120000, staleTtl: 600000 },
  );
}

export function getStudyGoal(forceRefresh = false) {
  return queryCache.fetchWithSWR(
    "tracker_goal",
    () => api.get("/tracker/goal/").then((res) => res.data),
    { forceRefresh, ttl: 120000, staleTtl: 600000 },
  );
}

export function updateStudyGoal(goalData) {
  queryCache.invalidate("tracker_");
  queryCache.invalidate("analytics_");
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

  if (data.message) {
    return data.message;
  }

  const firstKey = Object.keys(data)[0];

  if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
    return `${firstKey}: ${data[firstKey][0]}`;
  }

  if (firstKey && typeof data[firstKey] === "string") {
    return `${firstKey}: ${data[firstKey]}`;
  }

  return "Something went wrong. Please try again.";
}
