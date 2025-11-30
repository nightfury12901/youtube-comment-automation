import axios from 'axios';

// Backend API base (Render)
const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://youtube-comment-automation.onrender.com/api';

// No cookies now; using header token
axios.defaults.withCredentials = false;

// Helper to get current userId from localStorage
const getUserId = () => {
  return localStorage.getItem('yca_user_id') || null;
};

const axiosInstance = axios.create({
  baseURL: API_BASE
});

// Attach x-user-id header if present
axiosInstance.interceptors.request.use((config) => {
  const userId = getUserId();
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});

export const checkAuthStatus = async () => {
  const response = await axiosInstance.get('/auth/status');
  return response.data;
};

export const initiateLogin = async () => {
  const response = await axiosInstance.get('/auth/login');
  return response.data;
};

export const logout = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};

export const fetchComments = async (videoId) => {
  const response = await axiosInstance.post('/comments/fetch', {
    video_id: videoId
  });
  return response.data;
};

export const replyToComments = async (comments, replyPresets) => {
  const response = await axiosInstance.post('/comments/reply', {
    comments,
    reply_presets: replyPresets
  });
  return response.data;
};

export const estimateQuota = async (numComments) => {
  const response = await axiosInstance.post('/quota/estimate', {
    num_comments: numComments
  });
  return response.data;
};

// Export helper so App.js can store userId after login
export const setUserId = (userId) => {
  if (userId) {
    localStorage.setItem('yca_user_id', userId);
  } else {
    localStorage.removeItem('yca_user_id');
  }
};

export const getStoredUserId = getUserId;
