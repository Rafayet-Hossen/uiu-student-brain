import api from "../../lib/api";

export function getMaterials(subject, category, search) {
  const params = {};
  if (subject && subject !== "All") params.subject = subject;
  if (category && category !== "All") params.category = category;
  if (search) params.search = search;
  return api.get("/materials/", { params }).then((res) => res.data);
}

export function getMaterialStats() {
  return api.get("/materials/stats/").then((res) => res.data);
}

export function getMaterialById(id) {
  return api.get(`/materials/${id}/`).then((res) => res.data);
}

export function createMaterial(payload) {
  return api.post("/materials/", payload).then((res) => res.data);
}

export function updateMaterial(id, payload) {
  return api.patch(`/materials/${id}/`, payload).then((res) => res.data);
}

export function deleteMaterial(id) {
  return api.delete(`/materials/${id}/`).then((res) => res.data);
}

export function analyzeMaterial(id) {
  return api.post(`/materials/${id}/analyze/`).then((res) => res.data);
}

export function extractMaterialErrorMessage(error) {
  const data = error?.response?.data;
  if (!data)
    return "An unexpected error occurred while processing study materials.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
    return `${firstKey}: ${data[firstKey][0]}`;
  }
  return "An unexpected error occurred while processing study materials.";
}
