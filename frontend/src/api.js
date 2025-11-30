import axios from 'axios';

// Vercel backend URL
const API_BASE =
  process.env.REACT_APP_API_URL ||
  'https://youtube-comment-automation-m33n.vercel.app/api'; // replace with your backend domain

axios.defaults.withCredentials = true;

export const checkAuthStatus = async () => {
  const response = await axios.get(`${API_BASE}/auth/status`);
  return response.data;
};

export const initiateLogin = async () => {
  const response = await axios.get(`${API_BASE}/auth/login`);
  return response.data;
};

export const logout = async () => {
  const response = await axios.post(`${API_BASE}/auth/logout`);
  return response.data;
};

export const fetchComments = async (videoId) => {
  const response = await axios.post(`${API_BASE}/comments/fetch`, {
    video_id: videoId,
  });
  return response.data;
};

export const replyToComments = async (comments, replyPresets) => {
  const response = await axios.post(`${API_BASE}/comments/reply`, {
    comments,
    reply_presets: replyPresets,
  });
  return response.data;
};

export const estimateQuota = async (numComments) => {
  const response = await axios.post(`${API_BASE}/quota/estimate`, {
    num_comments: numComments,
  });
  return response.data;
};
