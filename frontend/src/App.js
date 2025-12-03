import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  checkAuthStatus,
  initiateLogin,
  logout,
  fetchComments,
  replyToComments,
  estimateQuota,
  storeUserId,
  getStoredUserId
} from './api';
import Terms from './Terms';
import Privacy from './Privacy';
import './styles.css';

function MainApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserIdState] = useState(null);
  const [videoId, setVideoId] = useState('');
  const [comments, setComments] = useState([]);
  const [totalComments, setTotalComments] = useState(0);
  const [alreadyReplied, setAlreadyReplied] = useState(0);
  const [replyPresets, setReplyPresets] = useState([
    'Thanks for watching! 🎉',
    'Appreciate your comment! More content coming soon!',
    'Great feedback! Subscribe for more! 🔥'
  ]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedComments, setSelectedComments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [quotaEstimate, setQuotaEstimate] = useState(null);
  const [progress, setProgress] = useState(0);

  const setUserId = (id) => {
    setUserIdState(id);
    storeUserId(id);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const loginStatus = urlParams.get('login');
    const userFromUrl = urlParams.get('user');

    if (loginStatus === 'success' && userFromUrl) {
      setUserId(userFromUrl);
    } else {
      const stored = getStoredUserId();
      if (stored) {
        setUserIdState(stored);
      }
    }

    if (loginStatus || userFromUrl) {
      window.history.replaceState({}, document.title, '/');
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (selectedComments.length > 0) {
      calculateQuota();
    }
  }, [selectedComments]);

  const checkAuth = async () => {
    try {
      const status = await checkAuthStatus();
      setAuthenticated(status.authenticated);
      if (status.authenticated && status.user_id) {
        setUserId(status.user_id);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    try {
      const { auth_url } = await initiateLogin();
      window.location.href = auth_url;
    } catch (error) {
      alert('❌ Login failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    setAuthenticated(false);
    setUserId(null);
    setComments([]);
    setResults(null);
    setVideoId('');
    setSelectedComments([]);
    setQuotaEstimate(null);
  };

  const handleFetchComments = async () => {
    if (!videoId.trim()) {
      alert('⚠️ Please enter a video ID');
      return;
    }

    setProcessing(true);
    setResults(null);
    setComments([]);

    try {
      const data = await fetchComments(videoId);
      if (data.quota_exceeded) {
        alert(data.error);
      } else if (data.success) {
        setComments(data.comments);
        setTotalComments(data.total_count);
        setAlreadyReplied(data.already_replied);

        const unrepliedIndexes = data.comments
          .map((comment, idx) => (comment.hasReply ? null : idx))
          .filter((idx) => idx !== null);
        setSelectedComments(unrepliedIndexes);
      } else {
        alert('❌ Error: ' + data.error);
      }
    } catch (error) {
      alert('❌ Failed to fetch comments: ' + error.message);
    }

    setProcessing(false);
  };

  const calculateQuota = async () => {
    try {
      const data = await estimateQuota(selectedComments.length);
      setQuotaEstimate(data);
    } catch (error) {
      console.error('Quota calculation failed:', error);
    }
  };

  const handleReply = async () => {
    const commentsToReply = selectedComments.map((idx) => comments[idx]);

    if (commentsToReply.length === 0) {
      alert('⚠️ No comments selected');
      return;
    }

    const validPresets = replyPresets.filter((p) => p.trim());
    if (validPresets.length < 2) {
      alert('⚠️ Please provide at least 2 reply presets');
      return;
    }

    if (
      !window.confirm(
        `🚀 Reply to ${commentsToReply.length} comments with ${validPresets.length} presets?`
      )
    ) {
      return;
    }

    setProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 5, 95));
    }, 300);

    try {
      const data = await replyToComments(commentsToReply, validPresets);
      clearInterval(progressInterval);
      setProgress(100);
      setResults(data);
    } catch (error) {
      clearInterval(progressInterval);
      alert('❌ Failed to reply: ' + error.message);
    }

    setProcessing(false);
  };

  const handleNewVideo = () => {
    setVideoId('');
    setComments([]);
    setResults(null);
    setSelectedComments([]);
    setQuotaEstimate(null);
  };

  const addPreset = () => {
    setReplyPresets([...replyPresets, '']);
  };

  const removePreset = (index) => {
    if (replyPresets.length <= 2) {
      alert('⚠️ Must have at least 2 presets');
      return;
    }
    setReplyPresets(replyPresets.filter((_, idx) => idx !== index));
  };

  const updatePreset = (index, value) => {
    const newPresets = [...replyPresets];
    newPresets[index] = value;
    setReplyPresets(newPresets);
  };

  const toggleCommentSelection = (index) => {
    if (selectedComments.includes(index)) {
      setSelectedComments(selectedComments.filter((i) => i !== index));
    } else {
      setSelectedComments([...selectedComments, index]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedComments.length === filteredComments.length) {
      setSelectedComments([]);
    } else {
      const allIndexes = filteredComments.map((c) => comments.indexOf(c));
      setSelectedComments(allIndexes);
    }
  };

  const filteredComments = comments.filter(
    (comment) =>
      comment.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comment.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="container">
        <div className="loader">
          <div className="loading"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="container">
        <div className="card welcome-card">
          <h1>🎥 COMMENT REPLY AUTOMATION</h1>
          <p>Automate your comment replies with ease</p>

          <div className="features">
            <div className="feature-item">
              <h3>🔐 SECURE</h3>
              <p>OAuth 2.0 authentication</p>
            </div>
            <div className="feature-item">
              <h3>⚡ FAST</h3>
              <p>Reply to 100s of comments instantly</p>
            </div>
            <div className="feature-item">
              <h3>🎯 SMART</h3>
              <p>Skip already-replied comments</p>
            </div>
            <div className="feature-item">
              <h3>🎨 NATURAL</h3>
              <p>Randomized personalized replies</p>
            </div>
          </div>

          <button onClick={handleLogin} className="btn btn-primary">
            <span>🚀 LOGIN WITH GOOGLE</span>
          </button>

          <p
            style={{
              marginTop: '30px',
              color: '#999',
              fontSize: '14px'
            }}
          >
            Beta Version • Built for Creators
          </p>

          <div style={{ marginTop: '20px', fontSize: '12px' }}>
            <Link to="/terms" style={{ color: '#666', marginRight: '20px' }}>
              Terms of Service
            </Link>
            <Link to="/privacy" style={{ color: '#666' }}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>💬 COMMENT AUTOMATOR</h1>
        <button onClick={handleLogout} className="btn btn-secondary btn-sm">
          LOGOUT
        </button>
      </div>

      {results && (
        <div className="card results">
          <h2>✅ MISSION COMPLETE</h2>
          <div className="stats">
            <div className="stat-item">
              <span className="stat-label">TOTAL</span>
              <span className="stat-value">{results.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">SUCCESS</span>
              <span className="stat-value">{results.successful}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">FAILED</span>
              <span className="stat-value">{results.failed}</span>
            </div>
          </div>
          {results.errors && results.errors.length > 0 && (
            <details className="error-details">
              <summary>⚠️ VIEW ERRORS ({results.errors.length})</summary>
              {results.errors.map((err, idx) => (
                <p key={idx} className="error-item">
                  {err.error}
                </p>
              ))}
            </details>
          )}
          <button
            onClick={handleNewVideo}
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
          >
            🎬 Process New Video
          </button>
        </div>
      )}

      <div className="card">
        <h2>📹 TARGET VIDEO</h2>
        <input
          type="text"
          placeholder="Enter Video ID (e.g., dQw4w9WgXcQ)"
          value={videoId}
          onChange={(e) => setVideoId(e.target.value)}
          className="input"
          disabled={processing}
        />
        <button
          onClick={handleFetchComments}
          disabled={processing}
          className="btn btn-primary"
        >
          {processing ? (
            <>
              <div className="loading"></div>
              <span>Fetching...</span>
            </>
          ) : (
            '🔍 Fetch All Comments'
          )}
        </button>
        {totalComments > 0 && (
          <div className="info-text">
            📊 Total: {totalComments} | ✅ Already replied: {alreadyReplied}
          </div>
        )}
      </div>

      {comments.length > 0 && !results && (
        <>
          <div className="card">
            <div className="preset-header">
              <h2>✏️ REPLY PRESETS ({replyPresets.length})</h2>
              <button onClick={addPreset} className="btn btn-sm btn-add">
                + Add
              </button>
            </div>
            {replyPresets.map((preset, index) => (
              <div key={index} className="preset-row">
                <input
                  type="text"
                  value={preset}
                  onChange={(e) => updatePreset(index, e.target.value)}
                  placeholder={`Reply preset ${index + 1}`}
                  className="input"
                />
                <button
                  onClick={() => removePreset(index)}
                  className="btn-remove"
                  disabled={replyPresets.length <= 2}
                >
                  ✕
                </button>
              </div>
            ))}
            <p className="info-text">
              💡 Replies will be randomly selected
            </p>
          </div>

          <div className="card">
            <div className="comment-header">
              <h2>💬 COMMENTS ({filteredComments.length})</h2>
              <button
                onClick={toggleSelectAll}
                className="btn btn-sm btn-secondary"
              >
                {selectedComments.length === filteredComments.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <input
              type="text"
              placeholder="🔍 Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />

            <div className="comment-stats">
              <span className="stat-badge">
                {selectedComments.length} selected
              </span>
              <span className="stat-badge">
                {comments.filter((c) => !c.hasReply).length} unreplied
              </span>
            </div>

            <div className="comment-list">
              {filteredComments.map((comment) => {
                const actualIdx = comments.indexOf(comment);
                return (
                  <div
                    key={actualIdx}
                    className={`comment-item ${
                      selectedComments.includes(actualIdx) ? 'selected' : ''
                    } ${comment.hasReply ? 'already-replied' : ''}`}
                    onClick={() => toggleCommentSelection(actualIdx)}
                  >
                    <div className="checkbox">
                      {selectedComments.includes(actualIdx) ? '☑' : '☐'}
                    </div>
                    <div className="comment-content">
                      <strong>
                        {comment.author}
                        {comment.hasReply && ' ✓'}
                        {comment.likeCount > 0 && ` ❤️ ${comment.likeCount}`}
                      </strong>
                      <p>
                        {comment.text.substring(0, 200)}
                        {comment.text.length > 200 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {quotaEstimate && selectedComments.length > 0 && (
              <div className="quota-info">
                <p>
                  📊 Estimated Quota:{' '}
                  <strong>{quotaEstimate.total}</strong> units (
                  {quotaEstimate.percentage}% of daily limit)
                </p>
              </div>
            )}

            {processing && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                >
                  {progress}%
                </div>
              </div>
            )}

            <button
              onClick={handleReply}
              disabled={processing || selectedComments.length === 0}
              className="btn btn-success"
            >
              {processing ? (
                <>
                  <div className="loading"></div>
                  <span>Deploying...</span>
                </>
              ) : (
                `🚀 Reply to ${selectedComments.length} Comments`
              )}
            </button>
          </div>
        </>
      )}

      <div
        style={{
          textAlign: 'center',
          marginTop: '40px',
          paddingBottom: '20px',
          fontSize: '12px',
          color: '#666'
        }}
      >
        <Link to="/terms" style={{ color: '#666', marginRight: '20px' }}>
          Terms of Service
        </Link>
        <Link to="/privacy" style={{ color: '#666' }}>
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;
