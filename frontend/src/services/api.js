/**
 * API Service - Backend bilan aloqa qilish uchun
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Token bilan so'rovlar uchun interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kasbim_token');
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
  googleLogin: (credential) => api.post('/auth/google', { credential }),
  me: () => api.get('/auth/me'),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  // Parolni tiklash
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetToken: (token) => api.post('/auth/verify-reset-token', { token }),
  resetPassword: (token, newPassword) =>
    api.post('/auth/reset-password', { token, new_password: newPassword }),
};

// Token localStorage boshqaruvi
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

  /** Form metadata: kategoriyalar, qiziqishlar, fanlar, ko'nikma guruhlari */
  getMetadata: () => api.get('/predict/metadata'),

  /** Barcha kasblar ro'yxati (kategoriya bo'yicha filtrlanishi mumkin) */
  listOccupations: (category = null) =>
    api.get('/predict/occupations', { params: category ? { category } : {} }),

  /** Ko'nikmalar farqi tahlili */
  skillsGap: (userSkills, occupationId) =>
    api.post('/predict/skills-gap', {
      user_skills: userSkills,
      occupation_id: occupationId,
    }),

  /** Yo'l xaritasini olish */
  getRoadmap: (occupationId) => api.get(`/predict/roadmap/${occupationId}`),

  /** O'quv yo'li (kurslar tavsiyasi) — token bo'lsa avtomatik personallashadi.
   *  userSkills berilsa, POST orqali ham yuborish mumkin (token bo'lmasa). */
  getLearningPath: (occupationId, userSkills = null) =>
    userSkills
      ? api.post('/predict/learning-path', { user_skills: userSkills, occupation_id: occupationId })
      : api.get(`/predict/learning-path/${occupationId}`),
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
  getJobs: (occupationId, forceRefresh = false) =>
    api.get(`/jobs/${occupationId}`, { params: { force_refresh: forceRefresh } }),
  getStats: (occupationId) => api.get(`/jobs/${occupationId}/stats`),
};

// ============================================================
// Progress
// ============================================================

export const progressAPI = {
  save: (occupationId, completedSkills) =>
    api.post('/progress/save', { occupation_id: occupationId, completed_skills: completedSkills }),
  get: (occupationId) => api.get(`/progress/${occupationId}`),
  getAll: () => api.get('/progress/'),

  // Ko'nikma quizzlari
  listAvailableQuizzes: () => api.get('/progress/skill-quiz/available'),
  getSkillQuiz: (skill) => api.get(`/progress/skill-quiz/${encodeURIComponent(skill)}`),
  submitSkillQuiz: (skill, answers, occupationId = null) =>
    api.post('/progress/skill-quiz/submit', {
      skill,
      answers,
      occupation_id: occupationId,
    }),
};

// ============================================================
// History
// ============================================================

export const historyAPI = {
  getHistory: () => api.get('/users/history'),
};

// ============================================================
// Karyera profili — yagona tahrirlanadigan profil
// ============================================================

export const careerProfileAPI = {
  /** Joriy profilni olish */
  get: () => api.get('/career-profile'),
  /** Profilning bir qismini yangilash (auto re-prediction) */
  update: (data) => api.patch('/career-profile', data),
};


// ============================================================
// Stats
// ============================================================

export const statsAPI = {
  /** Bosh sahifa uchun haqiqiy statistikalar */
  getOverview: () => api.get('/stats/overview'),
  /** Faol foydalanuvchilar (oxirgi 15 daqiqa) */
  getLiveUsers: () => api.get('/stats/live-users'),
};

export default api;
