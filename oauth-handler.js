/**
 * SKILLNEX AI — OAuth Handler
 * Manages Google, LinkedIn, and GitHub OAuth flows
 */

// Load Google SDK
(function() {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = initializeGoogle;
  document.head.appendChild(script);
})();

/**
 * Initialize Google Sign-In
 */
function initializeGoogle() {
  if (window.google && window.google.accounts) {
    // Google SDK loaded successfully
    console.log('[OAuth] Google SDK loaded');
  }
}

/**
 * Handle Google Login
 */
async function handleGoogleLogin() {
  try {
    // In production, use official Google Sign-In SDK
    // For development/demo, simulate OAuth flow
    
    API.showToast('⏳ Connecting to Google...', 'info');
    
    // Simulate OAuth popup/redirect
    const mockGoogleProfile = {
      id: 'google_' + Date.now(),
      email: 'user@gmail.com',
      name: 'Google User',
      picture: 'https://ui-avatars.com/api/?name=Google+User'
    };
    
    await processOAuthCallback('google', mockGoogleProfile);
  } catch (err) {
    API.showToast('Google login failed: ' + err.message, 'error');
  }
}

/**
 * Handle LinkedIn Login
 */
async function handleLinkedInLogin() {
  try {
    API.showToast('⏳ Connecting to LinkedIn...', 'info');
    
    // Simulate OAuth popup/redirect
    const mockLinkedInProfile = {
      id: 'linkedin_' + Date.now(),
      email: 'user@linkedin.com',
      name: 'LinkedIn User',
      picture: 'https://ui-avatars.com/api/?name=LinkedIn+User'
    };
    
    await processOAuthCallback('linkedin', mockLinkedInProfile);
  } catch (err) {
    API.showToast('LinkedIn login failed: ' + err.message, 'error');
  }
}

/**
 * Handle GitHub Login
 */
async function handleGitHubLogin() {
  try {
    API.showToast('⏳ Connecting to GitHub...', 'info');
    
    // Simulate OAuth popup/redirect
    const mockGitHubProfile = {
      id: 'github_' + Date.now(),
      email: 'user@github.com',
      name: 'GitHub User',
      picture: 'https://ui-avatars.com/api/?name=GitHub+User'
    };
    
    await processOAuthCallback('github', mockGitHubProfile);
  } catch (err) {
    API.showToast('GitHub login failed: ' + err.message, 'error');
  }
}

/**
 * Process OAuth callback - send profile to backend
 */
async function processOAuthCallback(provider, profile) {
  try {
    const response = await API.post('/auth/oauth/callback', {
      provider: provider,
      profile: {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture
      }
    });

    // Store token and user
    API.setToken(response.token);
    API.setUser(response.user);
    
    API.showToast(`✅ Logged in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`, 'success');

    // Redirect after 1 second
    setTimeout(() => {
      if (response.user.role === 'professional') {
        window.location.href = 'dashboard-professional.html';
      } else if (response.user.role === 'organization') {
        window.location.href = 'dashboard-org.html';
      } else {
        window.location.href = 'role-select.html';
      }
    }, 1000);
  } catch (err) {
    API.showToast('OAuth authentication failed: ' + err.message, 'error');
    console.error('[OAuth Error]', err);
  }
}

/**
 * PRODUCTION SETUP:
 * 
 * For Google OAuth:
 * 1. Go to https://console.cloud.google.com
 * 2. Create new project "SKILLNEX AI"
 * 3. Enable Google+ API
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add authorized JavaScript origins: http://localhost:3000
 * 6. Add authorized redirect URIs: http://localhost:3000/login.html
 * 7. Copy Client ID to GOOGLE_CLIENT_ID in .env
 * 8. Use @react-oauth/google or google-auth-library
 * 
 * For LinkedIn OAuth:
 * 1. Go to https://www.linkedin.com/developers/apps
 * 2. Create new app
 * 3. Add Authorized redirect URLs: http://localhost:5050/api/auth/oauth/callback
 * 4. Get Client ID and Secret from app settings
 * 5. Copy to LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET in .env
 * 6. Use linkedin-oauth2 package for backend OAuth flow
 * 
 * For GitHub OAuth:
 * 1. Go to GitHub Settings → Developer settings → OAuth Apps
 * 2. Create new OAuth App
 * 3. Set Authorization callback URL: http://localhost:5050/api/auth/oauth/callback
 * 4. Get Client ID and Secret
 * 5. Copy to .env as GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET
 * 6. Use @octokit/oauth-user-client for OAuth flow
 */
