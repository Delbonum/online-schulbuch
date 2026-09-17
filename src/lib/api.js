// Zugriff auf das PHP-Backend. Die Session läuft über ein HttpOnly-Cookie,
// deshalb werden keine Zugangsdaten im Browser gespeichert.

const API_BASE = (process.env.REACT_APP_API_URL || `${process.env.PUBLIC_URL}/api`).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(method, path, body) {
  let response;
  try {
    response = await fetch(API_BASE + path, {
      method,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(method !== "GET" && { "Content-Type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Der Server ist nicht erreichbar. Bitte prüfe deine Internetverbindung.");
  }

  if (response.status === 204) return null;

  let data = null;
  try {
    data = await response.json();
  } catch {
    // keine JSON-Antwort
  }
  if (!response.ok) {
    throw new ApiError(response.status, data?.error || `Serverfehler (${response.status}).`);
  }
  return data;
}

export const api = {
  me: () => request("GET", "/auth/me"),
  login: (username, password) => request("POST", "/auth/login", { username, password }),
  logout: () => request("POST", "/auth/logout", {}),
  changePassword: (currentPassword, newPassword) => request("POST", "/auth/password", { currentPassword, newPassword }),

  quiz: (level) => request("GET", `/quizzes/${level}`),
  submitQuiz: (level, answers) => request("POST", `/quizzes/${level}/submit`, { answers }),

  classes: () => request("GET", "/classes"),
  createClass: (name) => request("POST", "/classes", { name }),
  updateClass: (id, name) => request("PATCH", `/classes/${id}`, { name }),
  deleteClass: (id) => request("DELETE", `/classes/${id}`, {}),

  students: () => request("GET", "/students"),
  createStudent: (username, password, classId = null) => request("POST", "/students", { username, password, classId }),
  updateStudent: (id, changes) => request("PATCH", `/students/${id}`, changes),
  deleteStudent: (id) => request("DELETE", `/students/${id}`, {}),
  resetStudent: (id) => request("POST", `/students/${id}/reset`, {}),
  studentHistory: (id) => request("GET", `/students/${id}/history`),
  statistics: (classId) =>
    request("GET", classId ? `/statistics?classId=${encodeURIComponent(classId)}` : "/statistics"),
};
