import apiClient from "../../lib/api";

export const extractMaterialsErrorMessage = (error) => {
  if (error.response?.data) {
    const data = error.response.data;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey])) {
      return `${firstKey}: ${data[firstKey][0]}`;
    }
  }
  return error.message || "An unexpected error occurred.";
};

// ============================================================
// SEMESTERS API
// ============================================================

export const getSemesters = async () => {
  const res = await apiClient.get("/materials/semesters/");
  return res.data;
};

export const createSemester = async (payload) => {
  const res = await apiClient.post("/materials/semesters/", payload);
  return res.data;
};

export const deleteSemester = async (id) => {
  const res = await apiClient.delete(`/materials/semesters/${id}/`);
  return res.data;
};

// ============================================================
// COURSES API
// ============================================================

export const getCourses = async (semesterId) => {
  const res = await apiClient.get(`/materials/semesters/${semesterId}/courses/`);
  return res.data;
};

export const createCourse = async (semesterId, payload) => {
  const res = await apiClient.post(`/materials/semesters/${semesterId}/courses/`, payload);
  return res.data;
};

export const deleteCourse = async (id) => {
  const res = await apiClient.delete(`/materials/courses/${id}/`);
  return res.data;
};

// ============================================================
// MATERIALS API
// ============================================================

export const getMaterials = async (courseId, params = {}) => {
  const res = await apiClient.get(`/materials/courses/${courseId}/materials/`, {
    params,
  });
  return res.data;
};

export const createMaterial = async (courseId, formData) => {
  const res = await apiClient.post(
    `/materials/courses/${courseId}/materials/`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const deleteMaterial = async (id) => {
  const res = await apiClient.delete(`/materials/materials/${id}/`);
  return res.data;
};

export const analyzeMaterial = async (id) => {
  const res = await apiClient.post(`/materials/materials/${id}/analyze/`);
  return res.data;
};

// ============================================================
// COURSE AI CHAT API
// ============================================================

export const getCourseChat = async (courseId) => {
  const res = await apiClient.get(`/materials/courses/${courseId}/chat/`);
  return res.data;
};

export const sendCourseChat = async (courseId, message) => {
  const res = await apiClient.post(`/materials/courses/${courseId}/chat/`, { message });
  return res.data;
};
