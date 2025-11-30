const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// In‑memory token store: userId -> tokens
const tokenStore = {};

// FRONTEND URL (Vercel frontend)
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  'https://youtube-comment-automation.vercel.app';

// CORS
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());

const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const CREDENTIALS = JSON.parse(process.env.GOOGLE_CREDENTIALS);

function getOAuth2Client(redirectUri) {
  const { client_id, client_secret } = CREDENTIALS.web || CREDENTIALS.installed;
  return new google.auth.OAuth2(client_id, client_secret, redirectUri);
}

function saveCredentials(userId, tokens) {
  tokenStore[userId] = tokens;
}

function loadCredentials(userId) {
  return tokenStore[userId] || null;
}

function getYouTubeClient(tokens) {
  const oauth2Client = getOAuth2Client('');
  oauth2Client.setCredentials(tokens);
  return google.youtube({ version: 'v3', auth: oauth2Client });
}

// AUTH STATUS (checks userId from header)
app.get('/api/auth/status', (req, res) => {
  const userId = req.header('x-user-id');
  if (userId && loadCredentials(userId)) {
    return res.json({ authenticated: true, user_id: userId });
  }
  return res.json({ authenticated: false });
});

// LOGIN: generate state and redirect user to Google
const stateStore = {};

app.get('/api/auth/login', (req, res) => {
  const state = Math.random().toString(36).substring(2, 15);
  stateStore[state] = true;

  const redirectUri = `https://${req.get('host')}/api/auth/callback`;
  const oauth2Client = getOAuth2Client(redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state
  });

  res.json({ auth_url: authUrl });
});

// CALLBACK: exchange code, create userId, redirect back with ?user=
app.get('/api/auth/callback', async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!state || !stateStore[state]) {
      return res.redirect(
        `${FRONTEND_URL}?login=error&message=${encodeURIComponent(
          'Invalid state'
        )}`
      );
    }
    delete stateStore[state];

    const redirectUri = `https://${req.get('host')}/api/auth/callback`;
    const oauth2Client = getOAuth2Client(redirectUri);

    console.log('Got code:', code);
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens:', tokens);

    const userId = Math.random().toString(36).substring(2, 15);
    saveCredentials(userId, tokens);

    return res.redirect(`${FRONTEND_URL}?login=success&user=${userId}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(
      `${FRONTEND_URL}?login=error&message=${encodeURIComponent(
        error.message
      )}`
    );
  }
});

// LOGOUT: forget tokens for this userId
app.post('/api/auth/logout', (req, res) => {
  const userId = req.header('x-user-id');
  if (userId && tokenStore[userId]) {
    delete tokenStore[userId];
  }
  res.json({ success: true });
});

// Helper: get tokens from header
function requireUserTokens(req, res) {
  const userId = req.header('x-user-id');
  if (!userId) {
    res.status(401).json({ error: 'Missing user id' });
    return null;
  }
  const tokens = loadCredentials(userId);
  if (!tokens) {
    res.status(401).json({ error: 'Invalid user id or expired session' });
    return null;
  }
  return { userId, tokens };
}

// FETCH COMMENTS
app.post('/api/comments/fetch', async (req, res) => {
  const user = requireUserTokens(req, res);
  if (!user) return;
  const { tokens } = user;

  const { video_id } = req.body;
  if (!video_id) return res.status(400).json({ error: 'video_id required' });

  try {
    const youtube = getYouTubeClient(tokens);

    const videoResponse = await youtube.videos.list({
      part: 'statistics,snippet',
      id: video_id
    });

    if (!videoResponse.data.items || !videoResponse.data.items.length) {
      return res.json({ success: false, error: 'Video not found' });
    }

    const videoItem = videoResponse.data.items[0];
    const channelId = videoItem.snippet.channelId;
    const totalCommentCount = parseInt(
      videoItem.statistics.commentCount || '0',
      10
    );

    const comments = [];
    let nextPageToken = null;

    while (comments.length < 1000) {
      const commentsResponse = await youtube.commentThreads.list({
        part: 'snippet,replies',
        videoId: video_id,
        maxResults: 100,
        pageToken: nextPageToken || undefined,
        textFormat: 'plainText'
      });

      for (const item of commentsResponse.data.items) {
        const commentData = item.snippet.topLevelComment.snippet;
        let hasOwnerReply = false;

        if (item.replies && item.replies.comments) {
          for (const reply of item.replies.comments) {
            if (reply.snippet.authorChannelId?.value === channelId) {
              hasOwnerReply = true;
              break;
            }
          }
        }

        comments.push({
          id: item.id,
          text: commentData.textDisplay,
          author: commentData.authorDisplayName,
          likeCount: commentData.likeCount,
          hasReply: hasOwnerReply,
          publishedAt: commentData.publishedAt
        });
      }

      nextPageToken = commentsResponse.data.nextPageToken;
      if (!nextPageToken) break;
    }

    return res.json({
      success: true,
      comments,
      total_count: totalCommentCount,
      fetched_count: comments.length,
      already_replied: comments.filter((c) => c.hasReply).length
    });
  } catch (error) {
    if (error.message.toLowerCase().includes('quota')) {
      return res.json({
        success: false,
        error: 'Quota exceeded',
        quota_exceeded: true
      });
    }
    return res.json({ success: false, error: error.message });
  }
});

// REPLY TO COMMENTS
app.post('/api/comments/reply', async (req, res) => {
  const user = requireUserTokens(req, res);
  if (!user) return;
  const { tokens } = user;

  const { comments, reply_presets } = req.body;
  if (!comments || !reply_presets) {
    return res
      .status(400)
      .json({ error: 'Comments and reply_presets required' });
  }

  const youtube = getYouTubeClient(tokens);
  const results = {
    total: comments.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  for (const comment of comments) {
    try {
      const replyText =
        reply_presets[Math.floor(Math.random() * reply_presets.length)];

      await youtube.comments.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            parentId: comment.id,
            textOriginal: replyText
          }
        }
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

  return res.json(results);
});

// QUOTA ESTIMATE
app.post('/api/quota/estimate', (req, res) => {
  const { num_comments } = req.body;
  const videoStats = 1;
  const fetchComments = Math.max(1, Math.floor(num_comments / 100));
  const postReplies = num_comments * 50;
  const total = videoStats + fetchComments + postReplies;

  return res.json({
    breakdown: {
      video_stats: videoStats,
      fetch_comments: fetchComments,
      post_replies: postReplies
    },
    total,
    daily_limit: 10000,
    percentage: Math.round((total / 10000) * 1000) / 10
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

module.exports = app;
