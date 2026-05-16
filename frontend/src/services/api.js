/**
 * API Service — backend bilan aloqa (ML Recommender System).
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kasbim_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('kasbim_token');
      localStorage.removeItem('kasbim_user');
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

export const tokenStorage = {
  get: () => localStorage.getItem('kasbim_token'),
  set: (token) => localStorage.setItem('kasbim_token', token),
  remove: () => localStorage.removeItem('kasbim_token'),
  getUser: () => {
    try {
      const u = localStorage.getItem('kasbim_user');
      return u ? JSON.parse(u) : null;
    } catch { return null; }
  },
  setUser: (user) => localStorage.setItem('kasbim_user', JSON.stringify(user)),
  clear: () => {
    localStorage.removeItem('kasbim_token');
    localStorage.removeItem('kasbim_user');
  },
};

// ============================================================
// RIASEC Test
// ============================================================

export const testAPI = {
  getQuestions: () => api.get('/test/questions'),
  calculateScores: (answers) => api.post('/test/calculate', { answers }),
};

// ============================================================
// Recommender (ML Model)
// ============================================================

export const recommendAPI = {
  /**
   * Top-K kasb tavsiya olish.
   * @param {object} profile - {riasec_scores, interests, subjects, top_k, category_filter}
   */
  recommend: (profile) => api.post('/predict/recommend', profile),

  /** Mavjud kategoriyalar (filter uchun) */
  getCategories: () => api.get('/predict/categories'),

  /** Mavjud qiziqishlar (form uchun) */
  getInterests: () => api.get('/predict/interests'),

  /** Mavjud o'quv fanlari (form uchun) */
  getSubjects: () => api.get('/predict/subjects'),

  /** Model haqida ma'lumot (debug/himoya uchun) */
  getModelInfo: () => api.get('/predict/model-info'),

  /** Forma uchun barcha taxonomiyalar */
  getMetadata: () => api.get('/predict/metadata'),
};

// ============================================================
// Foydalanuvchi (tarix, profil)
// ============================================================

export const userAPI = {
  /** Joriy foydalanuvchi profilini olish (stats bilan) */
  getProfile: () => api.get('/users/me'),

  /** Profilni tahrirlash (bir nechta maydon birga) */
  editProfile: (payload) => api.post('/users/edit-profile', payload),

  /** Avatar rasm yuklash */
  uploadAvatar: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return api.post('/users/upload-avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** Avatarni o'chirish */
  deleteAvatar: () => api.delete('/users/delete-avatar'),

  /** Tarix */
  getHistory: () => api.get('/users/history'),
  deleteHistory: (testId) => api.delete(`/users/history/${testId}`),

  /** Parol */
  changePassword: (currentPassword, newPassword) =>
    api.post('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  /** Stats (qisqacha) */
  getStats: () => api.get('/users/stats'),
};

// Eski sahifalar uchun alias (AcademicSkills bilan moslik)
export const predictAPI = {
  getMetadata: () => api.get('/predict/metadata'),
};

// Stats endpoint olib tashlangan — WelcomePage uchun stub
export const statsAPI = {
  getOverview: () => Promise.resolve({ data: {
    total_users: 0, total_tests: 0, tests_today: 0,
    tests_this_week: 0, popular_careers: [], top_dominant_type: null,
  }}),
  getLiveUsers: () => Promise.resolve({ data: { active_users: 0 } }),
};

export default api;
