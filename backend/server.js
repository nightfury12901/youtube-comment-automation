const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-12345',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }
}));

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json());

const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const SESSIONS_DIR = path.join(__dirname, 'user_sessions');
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR);

function getOAuth2Client(redirectUri) {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_id, client_secret } = credentials.web || credentials.installed;
  return new google.auth.OAuth2(client_id, client_secret, redirectUri);
}

function saveCredentials(userId, tokens) {
  fs.writeFileSync(path.join(SESSIONS_DIR, `${userId}.json`), JSON.stringify(tokens));
}

function loadCredentials(userId) {
  const sessionPath = path.join(SESSIONS_DIR, `${userId}.json`);
  return fs.existsSync(sessionPath) ? JSON.parse(fs.readFileSync(sessionPath)) : null;
}

function getYouTubeClient(tokens) {
  const oauth2Client = getOAuth2Client('');
  oauth2Client.setCredentials(tokens);
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

app.get('/api/auth/status', (req, res) => {
  const userId = req.session.userId;
  res.json(userId && loadCredentials(userId) ? { authenticated: true, user_id: userId } : { authenticated: false });
});

app.get('/api/auth/login', (req, res) => {
  const userId = req.session.userId || Math.random().toString(36).substring(2, 15);
  req.session.userId = userId;
  const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback`;
  const oauth2Client = getOAuth2Client(redirectUri);
  const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });
  res.json({ auth_url: authUrl });
});

app.get('/api/auth/callback', async (req, res) => {
  try {
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/callback`;
    const oauth2Client = getOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(req.query.code);
    saveCredentials(req.session.userId, tokens);
    res.redirect(`${FRONTEND_URL}?login=success`);
  } catch (error) {
    res.redirect(`${FRONTEND_URL}?login=error&message=${error.message}`);
  }
});

app.post('/api/auth/logout', (req, res) => {
  const userId = req.session.userId;
  if (userId) {
    const sessionPath = path.join(SESSIONS_DIR, `${userId}.json`);
    if (fs.existsSync(sessionPath)) fs.unlinkSync(sessionPath);
  }
  req.session.destroy();
  res.json({ success: true });
});

app.post('/api/comments/fetch', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const tokens = loadCredentials(userId);
  if (!tokens) return res.status(401).json({ error: 'Invalid credentials' });
  const { video_id } = req.body;
  if (!video_id) return res.status(400).json({ error: 'video_id required' });
  
  try {
    const youtube = getYouTubeClient(tokens);
    const videoResponse = await youtube.videos.list({ part: 'statistics,snippet', id: video_id });
    if (!videoResponse.data.items?.length) return res.json({ success: false, error: 'Video not found' });
    
    const videoItem = videoResponse.data.items[0];
    const channelId = videoItem.snippet.channelId;
    const totalCommentCount = parseInt(videoItem.statistics.commentCount || 0);
    const comments = [];
    let nextPageToken = null;
    
    while (comments.length < 1000) {
      const commentsResponse = await youtube.commentThreads.list({
        part: 'snippet,replies', videoId: video_id, maxResults: 100, pageToken: nextPageToken, textFormat: 'plainText'
      });
      
      for (const item of commentsResponse.data.items) {
        const commentData = item.snippet.topLevelComment.snippet;
        let hasOwnerReply = false;
        if (item.replies) {
          for (const reply of item.replies.comments) {
            if (reply.snippet.authorChannelId.value === channelId) {
              hasOwnerReply = true;
              break;
            }
          }
        }
        comments.push({
          id: item.id, text: commentData.textDisplay, author: commentData.authorDisplayName,
          likeCount: commentData.likeCount, hasReply: hasOwnerReply, publishedAt: commentData.publishedAt
        });
      }
      nextPageToken = commentsResponse.data.nextPageToken;
      if (!nextPageToken) break;
    }
    
    res.json({
      success: true, comments, total_count: totalCommentCount,
      fetched_count: comments.length, already_replied: comments.filter(c => c.hasReply).length
    });
  } catch (error) {
    if (error.message.toLowerCase().includes('quota')) {
      return res.json({ success: false, error: 'Quota exceeded', quota_exceeded: true });
    }
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/comments/reply', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const tokens = loadCredentials(userId);
  if (!tokens) return res.status(401).json({ error: 'Invalid credentials' });
  const { comments, reply_presets } = req.body;
  if (!comments || !reply_presets) return res.status(400).json({ error: 'Comments and reply_presets required' });
  
  const youtube = getYouTubeClient(tokens);
  const results = { total: comments.length, successful: 0, failed: 0, errors: [] };
  
  for (const comment of comments) {
    try {
      const replyText = reply_presets[Math.floor(Math.random() * reply_presets.length)];
      await youtube.comments.insert({
        part: 'snippet',
        requestBody: { snippet: { parentId: comment.id, textOriginal: replyText } }
      });
      results.successful++;
    } catch (error) {
      results.failed++;
      if (error.message.toLowerCase().includes('quota')) {
        results.errors.push({ comment_id: comment.id, error: 'Quota exceeded' });
        break;
      }
      results.errors.push({ comment_id: comment.id, error: error.message });
    }
  }
  res.json(results);
});

app.post('/api/quota/estimate', (req, res) => {
  const { num_comments } = req.body;
  const videoStats = 1;
  const fetchComments = Math.max(1, Math.floor(num_comments / 100));
  const postReplies = num_comments * 50;
  const total = videoStats + fetchComments + postReplies;
  res.json({
    breakdown: { video_stats: videoStats, fetch_comments: fetchComments, post_replies: postReplies },
    total, daily_limit: 10000, percentage: Math.round((total / 10000) * 100 * 10) / 10
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend on http://localhost:${PORT}`);
});
