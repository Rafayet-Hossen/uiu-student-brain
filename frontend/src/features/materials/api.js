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

// Projects
export const getProjects = async () => {
  const res = await apiClient.get("/materials/projects/");
  return res.data;
};

export const createProject = async (payload) => {
  const res = await apiClient.post("/materials/projects/", payload);
  return res.data;
};

export const getProject = async (id) => {
  const res = await apiClient.get(`/materials/projects/${id}/`);
  return res.data;
};

export const deleteProject = async (id) => {
  const res = await apiClient.delete(`/materials/projects/${id}/`);
  return res.data;
};

// Materials
export const getMaterials = async (projectId, params = {}) => {
  const res = await apiClient.get(`/materials/projects/${projectId}/materials/`, {
    params,
  });
  return res.data;
};

export const createMaterial = async (projectId, formData) => {
  const res = await apiClient.post(
    `/materials/projects/${projectId}/materials/`,
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
