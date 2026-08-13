import api from "../../lib/api";

export function register({ email, password, full_name }) {
  return api.post("/accounts/register/", { email, password, full_name }).then((res) => res.data);
}

export function login({ email, password }) {
  return api.post("/accounts/login/", { email, password }).then((res) => res.data);
}

export function getMe() {
  return api.get("/accounts/me/").then((res) => res.data);
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
