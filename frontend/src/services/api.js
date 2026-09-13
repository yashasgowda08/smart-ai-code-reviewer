import axios from 'axios';

// Auto-detect: use the same host as the frontend but on port 8001
// This works from any device (PC browser, phone, tablet) on the same network
const API_BASE = `http://${window.location.hostname}:8001`;

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    config.headers['X-User-ID'] = userId;
  }
  const adminKey = localStorage.getItem('admin_key');
  if (adminKey) {
    config.headers['X-Admin-Key'] = adminKey;
  }
  return config;
}, (error) => Promise.reject(error));

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    let customMsg = 'An unexpected error occurred.';
    if (!error.response) {
      customMsg = 'Backend server is unavailable or offline. Please ensure FastAPI is running on port 8001.';
    } else if (error.response.data && error.response.data.detail) {
      customMsg = error.response.data.detail;
    } else if (error.response.status === 401) {
      customMsg = 'Authentication failed. Please check your credentials or secret passkey.';
    } else if (error.response.status === 403) {
      customMsg = 'Access Denied: Restricted admin privileges required.';
    } else if (error.response.status === 404) {
      customMsg = 'Requested resource was not found.';
    } else if (error.response.status === 400) {
      customMsg = 'Invalid request parameters or unsupported input format.';
    } else if (error.response.status >= 500) {
      customMsg = 'Internal server analysis error. Please try again.';
    }
    const err = new Error(customMsg);
    err.status = error.response ? error.response.status : 0;
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (userId, password, confirmPassword) =>
    apiClient.post('/auth/register', { user_id: userId, password, confirm_password: confirmPassword }),
  login: (userId, password) =>
    apiClient.post('/auth/login', { user_id: userId, password }),
};

export const reviewAPI = {
  analyzeCode: (code, filename, language) =>
    apiClient.post('/code-review/analyze', { code, filename, language }),
  uploadFile: (formData) =>
    apiClient.post('/code-review/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadMultipleFiles: (formData) =>
    apiClient.post('/code-review/multi-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getReportUrl: (filename) => `${API_BASE}/code-review/report/${filename}`,
};

export const fetchAPI = {
  fetchUrl: (url, language) =>
    apiClient.post('/fetch/url', { url, language }),
  scanDependencies: (content, filename) =>
    apiClient.post('/fetch/dependencies', { content, filename }),
};

export const exportsAPI = {
  getJsonUrl: (reviewId) => `${API_BASE}/exports/json/${reviewId}`,
  getCsvUrl: (reviewId) => `${API_BASE}/exports/csv/${reviewId}`,
  downloadJson: async (reviewId) => {
    const res = await apiClient.get(`/exports/json/${reviewId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `review_${reviewId}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  downloadCsv: async (reviewId) => {
    const res = await apiClient.get(`/exports/csv/${reviewId}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `findings_${reviewId}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export const notifyAPI = {
  sendWebhook: (reviewId, webhookUrl) =>
    apiClient.post('/notify/webhook', { review_id: reviewId, webhook_url: webhookUrl }),
  getEmailPreview: (reviewId, email) =>
    apiClient.post('/notify/email/preview', { review_id: reviewId, email: email }),
};

export const githubAPI = {
  clone: (repoUrl, branch) =>
    apiClient.post('/github/clone', { repo_url: repoUrl, branch }),
  review: (repoUrl, branch) =>
    apiClient.post('/github/review', { repo_url: repoUrl, branch }),
};

export const historyAPI = {
  getHistory: () => apiClient.get('/history'),
  getReview: (reviewId) => apiClient.get(`/history/${reviewId}`),
  deleteReview: (reviewId) => apiClient.delete(`/history/${reviewId}`),
  clearHistory: () => apiClient.delete('/history'),
};

export const adminAPI = {
  verifyPasskey: (secretKey) =>
    apiClient.post('/admin/auth/verify', { secret_key: secretKey }),
  getStats: () => apiClient.get('/admin/stats'),
  getUsers: () => apiClient.get('/admin/users'),
  getReviews: (params = {}) => apiClient.get('/admin/reviews', { params }),
  deleteReview: (reviewId) => apiClient.delete(`/admin/reviews/${reviewId}`),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
};

export const systemAPI = {
  checkHealth: () => apiClient.get('/health'),
};

export default apiClient;
