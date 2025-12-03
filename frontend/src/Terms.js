import React from 'react';
import './styles.css';

function Terms() {
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '900px', margin: '40px auto' }}>
        <h1>Terms of Service</h1>
        <p style={{ color: '#999', fontSize: '14px' }}>
          Last Updated: December 3, 2025
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By using Comment Reply Automation ("the Service"), you agree to be bound by these
          Terms of Service and the{' '}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube Terms of Service
          </a>
          .
        </p>

        <h2>2. Description of Service</h2>
        <p>
          Comment Reply Automation is a tool that helps content creators automate replies
          to comments on their videos using YouTube API Services. The Service
          allows you to:
        </p>
        <ul>
          <li>Authenticate with your Google/YouTube account</li>
          <li>Fetch comments from your videos</li>
          <li>Reply to multiple comments with preset messages</li>
        </ul>

        <h2>3. YouTube Terms of Service</h2>
        <p>
          This Service uses YouTube API Services. By using this Service, you
          are agreeing to be bound by the{' '}
          <a
            href="https://www.youtube.com/t/terms"
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTube Terms of Service
          </a>
          .
        </p>

        <h2>4. User Responsibilities</h2>
        <p>You agree to:</p>
        <ul>
          <li>Use the Service only for your own YouTube channel</li>
          <li>Not abuse, spam, or violate YouTube's Community Guidelines</li>
          <li>Not use the Service for any illegal or unauthorized purpose</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>

        <h2>5. Termination</h2>
        <p>
          We reserve the right to terminate or suspend your access to the
          Service at any time, without notice, for conduct that we believe
          violates these Terms or is harmful to other users, us, or third
          parties, or for any other reason.
        </p>

        <h2>6. Disclaimer</h2>
        <p>
          The Service is provided "as is" without any warranties, express or
          implied. We do not guarantee that the Service will be uninterrupted,
          secure, or error-free.
        </p>

        <h2>7. Contact</h2>
        <p>
          If you have any questions about these Terms, please contact us at:{' '}
          <a href="mailto:YOUR_EMAIL@gmail.com">YOUR_EMAIL@gmail.com</a>
        </p>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <a href="/" className="btn btn-secondary">
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default Terms;
