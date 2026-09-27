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

export function startStudySession(id) {
  return api.post(`/tracker/sessions/${id}/start/`).then((res) => res.data);
}

export function completeStudySession(id) {
  return api.post(`/tracker/sessions/${id}/complete/`).then((res) => res.data);
}

export function extendStudySession(id, extraMinutes = 15) {
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
  return api
    .post(`/tracker/sessions/${id}/quiz/submit/`, {
      question_results: questionResults,
    })
    .then((res) => res.data);
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
