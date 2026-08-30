import api from "../../lib/api";

// Posts
export function getPosts(params = {}) {
  return api.get("/community/posts/", { params }).then((res) => res.data);
}

export function createPost(payload) {
  return api.post("/community/posts/", payload).then((res) => res.data);
}

export function updatePost(id, payload) {
  return api.patch(`/community/posts/${id}/`, payload).then((res) => res.data);
}

export function deletePost(id) {
  return api.delete(`/community/posts/${id}/`).then((res) => res.data);
}

export function togglePostReaction(id) {
  return api.post(`/community/posts/${id}/react/`).then((res) => res.data);
}

// Comments
export function getComments(postId) {
  return api
    .get(`/community/posts/${postId}/comments/`)
    .then((res) => res.data);
}

export function createComment(postId, payload) {
  return api
    .post(`/community/posts/${postId}/comments/`, payload)
    .then((res) => res.data);
}

export function deleteComment(id) {
  return api.delete(`/community/comments/${id}/`).then((res) => res.data);
}

// Study Events
export function getEvents() {
  return api.get("/community/events/").then((res) => res.data);
}

export function createEvent(payload) {
  return api.post("/community/events/", payload).then((res) => res.data);
}

export function deleteEvent(id) {
  return api.delete(`/community/events/${id}/`).then((res) => res.data);
}

export function toggleEventRsvp(id, status = "going") {
  return api
    .post(`/community/events/${id}/rsvp/`, { status })
    .then((res) => res.data);
}

// Student Network
export function getStudents(params = {}) {
  return api.get("/community/students/", { params }).then((res) => res.data);
}

export function toggleFollowStudent(id) {
  return api.post(`/community/students/${id}/follow/`).then((res) => res.data);
}

export function extractCommunityErrorMessage(error) {
  const data = error?.response?.data;
  if (!data) return "An unexpected error occurred. Please try again.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
    return `${firstKey}: ${data[firstKey][0]}`;
  }
  return "An unexpected error occurred. Please try again.";
}
