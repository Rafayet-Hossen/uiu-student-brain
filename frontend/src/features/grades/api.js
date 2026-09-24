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

export function getCourseRetakeAdvisor(cacheBust = false) {
  const url = cacheBust
    ? `/grades/retake-advisor/?_t=${Date.now()}`
    : "/grades/retake-advisor/";
  return api.get(url).then((res) => res.data);
}

export function updateCourseGrade(id, payload) {
  return api.patch(`/grades/courses/${id}/`, payload).then((res) => res.data);
}

export function getCourseGrades() {
  return api.get("/grades/courses/").then((res) => res.data);
}

export function createCourseGrade(payload) {
  return api.post("/grades/courses/", payload).then((res) => res.data);
}

export function deleteCourseGrade(id) {
  return api.delete(`/grades/courses/${id}/`).then((res) => res.data);
}

export function uploadTranscript(formDataOrPayload) {
  const isFormData = formDataOrPayload instanceof FormData;
  return api
    .post("/grades/transcript/upload/", formDataOrPayload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
    })
    .then((res) => res.data);
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
