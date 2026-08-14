import api from "../../lib/api";

export function getGradePlans() {
  return api.get("/grades/plans/").then((res) => res.data);
}

export function createGradePlan(plan) {
  return api.post("/grades/plans/", plan).then((res) => res.data);
}

export function updateGradePlan(id, plan) {
  return api.patch(`/grades/plans/${id}/`, plan).then((res) => res.data);
}

export function deleteGradePlan(id) {
  return api.delete(`/grades/plans/${id}/`).then((res) => res.data);
}

export function extractGradeErrorMessage(error) {
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
