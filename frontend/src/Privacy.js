import React from 'react';
import './styles.css';

function Privacy() {
  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '900px', margin: '40px auto' }}>
        <h1>Privacy Policy</h1>
        <p style={{ color: '#999', fontSize: '14px' }}>
          Last Updated: December 3, 2025
        </p>

        <h2>1. Introduction</h2>
        <p>
          Comment Reply Automation ("we," "our," or "the Service") respects your privacy.
          This Privacy Policy explains how we collect, use, and protect your
          information when you use our Service.
        </p>

        <h2>2. Use of YouTube API Services</h2>
        <p>
          This Service uses YouTube API Services to access and interact with
          your YouTube account. By using this Service, you acknowledge that
          your use of YouTube data is also subject to the{' '}
          <a
            href="http://www.google.com/policies/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Privacy Policy
          </a>
          .
        </p>

        <h2>3. Information We Access and Collect</h2>
        <p>When you use Comment Reply Automation, we access and temporarily store:</p>
        <ul>
          <li>
            <strong>OAuth Tokens:</strong> Access and refresh tokens provided
            by Google to authenticate your YouTube account
          </li>
          <li>
            <strong>Video Comments:</strong> Comment text, author names, like
            counts, and reply status from videos you specify
          </li>
          <li>
            <strong>User Identifier:</strong> A randomly generated ID stored in
            your browser's localStorage to maintain your session
          </li>
        </ul>

        <h2>4. How We Use Your Information</h2>
        <p>We use the information we access to:</p>
        <ul>
          <li>Authenticate your identity via Google OAuth 2.0</li>
          <li>Fetch comments from your YouTube videos</li>
          <li>Post replies to comments on your behalf</li>
          <li>Display video and comment statistics</li>
        </ul>
        <p>
          <strong>We do not:</strong>
        </p>
        <ul>
          <li>Store your data permanently on our servers</li>
          <li>Share your data with third parties</li>
          <li>Use your data for advertising or marketing</li>
          <li>Access any data beyond what is necessary for the Service</li>
        </ul>

        <h2>5. Data Storage and Retention</h2>
        <p>
          All OAuth tokens and user data are stored temporarily in server
          memory during your session. When you log out or close your browser,
          this data is cleared. A session identifier is stored in your
          browser's localStorage to maintain your login state.
        </p>

        <h2>6. Cookies and Similar Technologies</h2>
        <p>
          The Service stores a session identifier in your browser's
          localStorage to maintain your authenticated state. This identifier is
          a randomly generated string and does not contain personal
          information. You can clear this data at any time by logging out or
          clearing your browser's local storage.
        </p>

        <h2>7. How to Revoke Access</h2>
        <p>You can revoke Comment Reply Automation's access to your YouTube data at any time by:</p>
        <ul>
          <li>Clicking the "Logout" button in the app</li>
          <li>
            Visiting{' '}
            <a
              href="https://myaccount.google.com/connections?filters=3,4&hl=en"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Account Permissions
            </a>{' '}
            and removing Comment Reply Automation from your connected apps
          </li>
        </ul>

        <h2>8. Data Sharing</h2>
        <p>
          We do not share, sell, or transfer your personal information or
          YouTube data to any third parties. All data processing occurs on our
          server and is used solely to provide the Service to you.
        </p>

        <h2>9. Security</h2>
        <p>
          We implement industry-standard security measures to protect your data
          during transmission and temporary storage. However, no method of
          electronic storage is 100% secure, and we cannot guarantee absolute
          security.
        </p>

        <h2>10. Children's Privacy</h2>
        <p>
          The Service is not intended for users under the age of 13. We do not
          knowingly collect personal information from children under 13.
        </p>

        <h2>11. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by updating the "Last Updated" date at the top of
          this policy.
        </p>

        <h2>12. Contact Information</h2>
        <p>
          If you have any questions about this Privacy Policy or how we handle
          your data, please contact us at:{' '}
          <a href="mailto:claudekaaccoun@gmail.com">claudekaaccoun@gmail.com</a>
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

export default Privacy;
