import api from "../../lib/api";

export function register({ email, password, full_name }) {
  return api
    .post("/accounts/register/", { email, password, full_name })
    .then((res) => res.data);
}

export function login({ email, password }) {
  return api
    .post("/accounts/login/", { email, password })
    .then((res) => res.data);
}

export function googleAuthLogin({ credential }) {
  return api
    .post("/accounts/google/", { credential })
    .then((res) => res.data);
}


export function getMe() {
  return api.get("/accounts/me/").then((res) => res.data);
}

export function updateProfile(payload) {
  return api.patch("/accounts/me/", payload).then((res) => res.data);
}

export function getProfileSummary() {
  return api.get("/accounts/profile-summary/").then((res) => res.data);
}

export function getNotificationState() {
  return api.get("/accounts/notifications/").then((res) => res.data);
}

export function saveNotificationState(payload) {
  return api.post("/accounts/notifications/", payload).then((res) => res.data);
}

export function extractErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong. Please try again.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
    return data[firstKey][0];
  }
  return "Something went wrong. Please try again.";
}
