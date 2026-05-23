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
    // 401 bo'lsa va so'rov auth talab qiladigan endpointga bo'lsa — tokenni tozalaymiz.
    // /predict/* endpointlari optional auth bilan ishlaydi, ularda token tozalanmaydi.
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const isOptionalAuthEndpoint = url.includes('/predict/');
      if (!isOptionalAuthEndpoint) {
        localStorage.removeItem('kasbim_token');
        localStorage.removeItem('kasbim_user');
      }
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
  verifyEmail: (email, code) => api.post('/auth/verify-email', { email, code }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
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

// ============================================================
// Admin panel
// ============================================================

export const adminAPI = {
  /** Dashboard statistikasi */
  getStats: () => api.get('/admin/stats'),

  /** Tizim holati (backend, DB, model) */
  getSystem: () => api.get('/admin/system'),

  /** Oxirgi N kunlik faollik (signup + test) */
  getActivity: (days = 7) => api.get('/admin/activity', { params: { days } }),

  /** Eng ko'p tavsiya etilgan kasblar */
  getTopCareers: (limit = 10) => api.get('/admin/top-careers', { params: { limit } }),

  /** Foydalanuvchilar ro'yxati */
  listUsers: ({ q = '', only = 'all', limit = 50, offset = 0 } = {}) =>
    api.get('/admin/users', { params: { q, only, limit, offset } }),

  /** Foydalanuvchi tafsiloti + test tarixi */
  getUser: (userId) => api.get(`/admin/users/${userId}`),

  /** CSV eksport URL (token bilan brauzerda ochish uchun) */
  usersCsvUrl: () => {
    const token = localStorage.getItem('kasbim_token') || '';
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
    // Eksport autentifikatsiya talab qiladi; brauzer faqat URL bilan token yubora olmaydi,
    // shuning uchun adminPanel orqali fetch qilib blob yuklab beramiz (downloadUsersCsv).
    return `${base}/admin/users.csv`;
  },
  downloadUsersCsv: async () => {
    const resp = await api.get('/admin/users.csv', { responseType: 'blob' });
    const blob = new Blob([resp.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kasbim-users-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  /** Foydalanuvchini o'chirish */
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),

  /** Admin huquqini berish/olib tashlash */
  setAdmin: (userId, isAdmin) =>
    api.patch(`/admin/users/${userId}/admin`, { is_admin: !!isAdmin }),

  /** Test natijalari ro'yxati */
  listTests: ({ userId = null, limit = 50, offset = 0 } = {}) => {
    const params = { limit, offset };
    if (userId !== null && userId !== undefined) params.user_id = userId;
    return api.get('/admin/tests', { params });
  },

  /** Test natijasi to'liq tafsiloti */
  getTest: (testId) => api.get(`/admin/tests/${testId}`),

  /** Test natijasini o'chirish */
  deleteTest: (testId) => api.delete(`/admin/tests/${testId}`),

  /** Kasblar bazasi qisqacha ma'lumoti */
  getOccupations: () => api.get('/admin/occupations'),
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
