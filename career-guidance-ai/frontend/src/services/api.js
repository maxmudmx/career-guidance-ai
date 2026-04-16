/**
 * API Service - Backend bilan aloqa qilish uchun
 */
import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Token bilan so'rovlar uchun interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kasbyol_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 401 → localStorage tozalash
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kasbyol_token');
      localStorage.removeItem('kasbyol_user');
    }
    return Promise.reject(err);
  }
);

// ============================================================
// Auth
// ============================================================

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Token localStorage boshqaruvi
export const tokenStorage = {
  get: () => localStorage.getItem('kasbyol_token'),
  set: (token) => localStorage.setItem('kasbyol_token', token),
  remove: () => localStorage.removeItem('kasbyol_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('kasbyol_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },
  setUser: (user) => localStorage.setItem('kasbyol_user', JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem('kasbyol_token');
    localStorage.removeItem('kasbyol_user');
  },
};

// ============================================================
// RIASEC Test
// ============================================================

export const testAPI = {
  /** Barcha savollarni olish */
  getQuestions: () => api.get('/test/questions'),

  /** Javoblardan skorlarni hisoblash */
  calculateScores: (answers) => api.post('/test/calculate', { answers }),
};

// ============================================================
// ML Bashorat
// ============================================================

export const predictAPI = {
  /** Kasb bashorat qilish */
  predictCareer: (data) => api.post('/predict/career', data),

  /** Ko'nikmalar farqi tahlili */
  skillsGap: (userSkills, occupationId) =>
    api.post('/predict/skills-gap', {
      user_skills: userSkills,
      occupation_id: occupationId,
    }),

  /** Yo'l xaritasini olish */
  getRoadmap: (occupationId) => api.get(`/predict/roadmap/${occupationId}`),
};

// ============================================================
// Rezume
// ============================================================

export const resumeAPI = {
  /** PDF rezumeni tahlil qilish */
  analyze: (file, occupationId) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/resume/analyze?occupation_id=${occupationId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Kasblar ro'yxatini olish */
  getOccupations: () => api.get('/resume/occupations'),
};

// ============================================================
// Vakansiyalar
// ============================================================

export const jobsAPI = {
  /** Kasb bo'yicha vakansiyalarni olish */
  getJobs: (occupationId, forceRefresh = false) =>
    api.get(`/jobs/${occupationId}`, { params: { force_refresh: forceRefresh } }),

  /** Ish haqi statistikasi */
  getStats: (occupationId) => api.get(`/jobs/${occupationId}/stats`),
};

export default api;
