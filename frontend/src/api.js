import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

export const checkAuthStatus = async () => (await axios.get(`${API_BASE}/auth/status`)).data;
export const initiateLogin = async () => (await axios.get(`${API_BASE}/auth/login`)).data;
export const logout = async () => (await axios.post(`${API_BASE}/auth/logout`)).data;
export const fetchComments = async (videoId) => (await axios.post(`${API_BASE}/comments/fetch`, { video_id: videoId })).data;
export const replyToComments = async (comments, replyPresets) => (await axios.post(`${API_BASE}/comments/reply`, { comments, reply_presets: replyPresets })).data;
export const estimateQuota = async (numComments) => (await axios.post(`${API_BASE}/quota/estimate`, { num_comments: numComments })).data;
