import apiClient from "../../lib/api";

export const extractMaterialsErrorMessage = (error) => {
  if (error?.response?.data) {
    const data = error.response.data;
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    if (data.message) return data.message;
    const firstKey = Object.keys(data)[0];
    if (
      firstKey &&
      Array.isArray(data[firstKey]) &&
      data[firstKey].length > 0
    ) {
      return `${firstKey}: ${data[firstKey][0]}`;
    }
  }
  return (
    error?.message ||
    "An unexpected error occurred while processing study materials."
  );
};

export const extractMaterialErrorMessage = extractMaterialsErrorMessage;

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
  const res = await apiClient.get(
    `/materials/semesters/${semesterId}/courses/`,
  );
  return res.data;
};

export const createCourse = async (semesterId, payload) => {
  const res = await apiClient.post(
    `/materials/semesters/${semesterId}/courses/`,
    payload,
  );
  return res.data;
};

export const updateCourse = async (id, payload) => {
  const res = await apiClient.patch(`/materials/courses/${id}/`, payload);
  return res.data;
};

export const deleteCourse = async (id) => {
  const res = await apiClient.delete(`/materials/courses/${id}/`);
  return res.data;
};

// ============================================================
// MATERIALS API
// ============================================================

export const getMaterials = async (
  courseIdOrSubject,
  paramsOrCategory = {},
  maybeSearch = null,
) => {
  // If first param is number or numeric string, it's courseId
  if (
    typeof courseIdOrSubject === "number" ||
    (!isNaN(courseIdOrSubject) &&
      typeof paramsOrCategory === "object" &&
      !Array.isArray(paramsOrCategory) &&
      !maybeSearch)
  ) {
    const res = await apiClient.get(
      `/materials/courses/${courseIdOrSubject}/materials/`,
      {
        params: paramsOrCategory,
      },
    );
    return res.data;
  }

  // Otherwise global getMaterials(subject, category, search)
  const params = {};
  if (courseIdOrSubject && courseIdOrSubject !== "All")
    params.subject = courseIdOrSubject;
  if (
    paramsOrCategory &&
    typeof paramsOrCategory === "string" &&
    paramsOrCategory !== "All"
  )
    params.category = paramsOrCategory;
  if (maybeSearch) params.search = maybeSearch;
  const res = await apiClient.get("/materials/", { params });
  return res.data;
};

export const getMaterialStats = async () => {
  const res = await apiClient.get("/materials/stats/");
  return res.data;
};

export const getMaterialById = async (id) => {
  const res = await apiClient.get(`/materials/${id}/`);
  return res.data;
};

export const createMaterial = async (
  courseIdOrPayload,
  maybeFormData = null,
) => {
  // Case 1: Called with single object payload: createMaterial(payload)
  if (
    !maybeFormData &&
    typeof courseIdOrPayload === "object" &&
    !(typeof FormData !== "undefined" && courseIdOrPayload instanceof FormData)
  ) {
    const res = await apiClient.post("/materials/", courseIdOrPayload);
    return res.data;
  }

  // Case 2: Called with courseId and data (either FormData or JSON object)
  const numericCourseId =
    courseIdOrPayload && !isNaN(Number(courseIdOrPayload))
      ? Number(courseIdOrPayload)
      : null;

  const data = maybeFormData !== null ? maybeFormData : courseIdOrPayload;
  const isFormData =
    typeof FormData !== "undefined" && data instanceof FormData;

  if (numericCourseId) {
    const res = await apiClient.post(
      `/materials/courses/${numericCourseId}/materials/`,
      data,
      isFormData
        ? {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        : undefined,
    );
    return res.data;
  }

  // Fallback: If no valid numeric courseId, submit to global materials endpoint
  const res = await apiClient.post(
    "/materials/",
    data,
    isFormData
      ? {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      : undefined,
  );
  return res.data;
};

export const updateMaterial = async (id, payload) => {
  try {
    const res = await apiClient.patch(`/materials/${id}/`, payload);
    return res.data;
  } catch (err) {
    if (err?.response?.status === 404) {
      const res2 = await apiClient.patch(
        `/materials/materials/${id}/`,
        payload,
      );
      return res2.data;
    }
    throw err;
  }
};

export const deleteMaterial = async (id) => {
  try {
    const res = await apiClient.delete(`/materials/${id}/`);
    return res.data;
  } catch (err) {
    if (err?.response?.status === 404) {
      const res2 = await apiClient.delete(`/materials/materials/${id}/`);
      return res2.data;
    }
    throw err;
  }
};

export const analyzeMaterial = async (id) => {
  const res = await apiClient.post(`/materials/${id}/analyze/`);
  return res.data;
};

export const exportMaterialAnalysisPDF = async (
  id,
  title = "study_analysis",
) => {
  const res = await apiClient.get(`/materials/${id}/export-pdf/`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeTitle = (title || "study_analysis")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);
  link.setAttribute("download", `${safeTitle}_AI_Analysis.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};

export const downloadMaterialFile = async (id, title = "document") => {
  const res = await apiClient.get(`/materials/${id}/download/`, {
    responseType: "blob",
  });
  // Check Content-Disposition header if available
  let filename = `${title || "document"}`;
  const disposition = res.headers["content-disposition"];
  if (disposition && disposition.includes("filename=")) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match && match[1]) filename = match[1];
  }
  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};

// ============================================================
// COURSE AI CHAT API
// ============================================================

export const getCourseChat = async (courseId) => {
  const res = await apiClient.get(`/materials/courses/${courseId}/chat/`);
  return res.data;
};

export const sendCourseChat = async (courseId, message) => {
  const res = await apiClient.post(`/materials/courses/${courseId}/chat/`, {
    message,
  });
  return res.data;
};

// ============================================================
// FEATURE #8: AI QUIZ & ASSESSMENT API
// ============================================================

export const generateQuiz = async ({
  subject,
  topics,
  num_questions = 5,
  difficulty = "Intermediate",
}) => {
  const res = await apiClient.post("/ai/quiz/generate/", {
    subject,
    topics,
    num_questions,
    difficulty,
  });
  return res.data;
};

export const evaluateQuiz = async ({ subject, question_results }) => {
  const res = await apiClient.post("/ai/quiz/evaluate/", {
    subject,
    question_results,
  });
  return res.data;
};
