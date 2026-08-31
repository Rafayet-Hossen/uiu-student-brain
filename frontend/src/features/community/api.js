import api from "../../lib/api";

// Posts
export function getPosts(category, search) {
  const params = {};
  if (category && category !== "All") params.category = category;
  if (search) params.search = search;
  return api.get("/community/posts/", { params }).then((res) => res.data);
}

export function createPost(payload) {
  return api.post("/community/posts/", payload).then((res) => res.data);
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
export function getEvents(search) {
  const params = {};
  if (search) params.search = search;
  return api.get("/community/events/", { params }).then((res) => res.data);
}

export function createEvent(payload) {
  return api.post("/community/events/", payload).then((res) => res.data);
}

export function deleteEvent(id) {
  return api.delete(`/community/events/${id}/`).then((res) => res.data);
}

export function toggleEventRSVP(id) {
  return api.post(`/community/events/${id}/rsvp/`).then((res) => res.data);
}

export function toggleEventRsvp(id) {
  return toggleEventRSVP(id);
}

// Student Network
export function getStudents(search) {
  const params = {};
  if (search) params.search = search;
  return api.get("/community/students/", { params }).then((res) => res.data);
}

export function toggleFollowStudent(id) {
  return api.post(`/community/students/${id}/follow/`).then((res) => res.data);
}

// Leaderboard & Opt-in
export function getLeaderboard(timeframe = "weekly") {
  return api
    .get("/community/leaderboard/", { params: { timeframe } })
    .then((res) => res.data);
}

export function getLeaderboardStatus() {
  return api.get("/community/leaderboard/status/").then((res) => res.data);
}

export function toggleLeaderboardOptIn(payload) {
  return api
    .post("/community/leaderboard/opt-in/", payload)
    .then((res) => res.data);
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
