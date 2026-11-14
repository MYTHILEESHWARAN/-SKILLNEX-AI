/**
 * SKILLNEX AI — Shared Frontend API Client
 * Centralized fetch wrapper, token management, error dispatching, and auth guards.
 * "Learn Smarter. Grow Faster. Achieve Further."
 */

(function (window) {
  'use strict';

  // Configurable backend API base URL
  const API_BASE_URL = window.SKILLNEX_API_URL || 'http://localhost:5050/api';

  const TOKEN_KEY = 'skillnex_token';
  const USER_KEY = 'skillnex_user';

  const API = {
    BASE_URL: API_BASE_URL,

    /**
     * Token & User Storage Helpers
     */
    getToken() {
      return localStorage.getItem(TOKEN_KEY);
    },

    setToken(token) {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    },

    getUser() {
      try {
        const u = localStorage.getItem(USER_KEY);
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    },

    setUser(user) {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    },

    isAuthenticated() {
      return Boolean(this.getToken());
    },

    /**
     * Route protection guard: redirect to login if not authenticated
     */
    requireAuth(allowedRoles = []) {
      if (!this.isAuthenticated()) {
        const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `login.html?redirect=${currentPath}`;
        return false;
      }

      if (allowedRoles.length > 0) {
        const user = this.getUser();
        if (user && !allowedRoles.includes(user.role)) {
          this.showToast(`Access restricted for role '${user.role}'`, 'error');
          // Redirect to appropriate dashboard
          setTimeout(() => {
            if (user.role === 'professional') window.location.href = 'dashboard-professional.html';
            else if (user.role === 'organization') window.location.href = 'dashboard-org.html';
            else window.location.href = 'dashboard-student.html';
          }, 1200);
          return false;
        }
      }
      return true;
    },

    /**
     * Perform server-side logout, revoke token, clear local state, and redirect
     */
    async logout() {
      const token = this.getToken();
      try {
        if (token) {
          await fetch(`${API_BASE_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (err) {
        console.warn('[Logout Notice]', err.message);
      } finally {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = 'login.html';
      }
    },

    /**
     * Core Fetch Request Wrapper
     */
    async request(endpoint, options = {}) {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      };

      const token = this.getToken();
      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config = {
        ...options,
        headers
      };

      try {
        const response = await fetch(url, config);
        let data;
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = { rawText: await response.text() };
        }

        if (!response.ok) {
          // Handle specific HTTP Status Codes
          if (response.status === 401) {
            // Token expired or revoked - BUT ONLY if this is an auth endpoint
            console.warn('[API 401 Unauthorized]', data.error ? data.error.message : 'Session expired');
            
            // Only logout for auth-specific 401 errors
            // Do NOT logout for 401 from other endpoints (they may fail for other reasons)
            const authRelatedCodes = [
              'AUTH_TOKEN_MISSING',
              'AUTH_TOKEN_INVALID', 
              'AUTH_TOKEN_EXPIRED',
              'AUTH_TOKEN_REVOKED',
              'AUTH_USER_NOT_FOUND',
              'AUTH_ACCOUNT_DEACTIVATED'
            ];
            
            const isAuthError = authRelatedCodes.includes(data.error?.code);
            const isAuthEndpoint = endpoint.includes('/auth/') || endpoint.includes('/me');
            
            // Only clear session if it's a genuine auth failure
            if ((isAuthError || isAuthEndpoint) && !endpoint.includes('oauth')) {
              const isAuthPage = window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html');
              if (!isAuthPage) {
                this.setToken(null);
                this.setUser(null);
                this.showToast('Session expired. Please sign in again.', 'warning');
                setTimeout(() => {
                  window.location.href = 'login.html';
                }, 1500);
              }
            } else {
              // For non-auth 401 errors, just show the error but keep the session alive
              this.showToast(data.error?.message || 'Access denied for this resource', 'error');
            }
          } else if (response.status === 403) {
            console.warn('[API 403 Forbidden]', data.error ? data.error.message : 'Access denied');
            this.showToast(data.error ? data.error.message : 'Forbidden resource', 'error');
          } else if (response.status === 503) {
            // Service Unavailable (e.g. Gemini key missing)
            console.warn('[API 503 Service Unavailable]', data.error ? data.error.message : 'Service unavailable');
            this.showToast(data.error ? data.error.message : 'AI service unavailable. Please check GEMINI_API_KEY in backend/.env.', 'warning');
          }

          const error = new Error(data.error ? data.error.message : `Request failed with status ${response.status}`);
          error.status = response.status;
          error.code = data.error ? data.error.code : 'HTTP_ERROR';
          error.data = data;
          throw error;
        }

        return data;
      } catch (networkError) {
        if (!networkError.status) {
          console.error('[API Network Error]', networkError.message);
          this.showToast('Unable to connect to SKILLNEX API server. Please ensure backend is running at http://localhost:5050.', 'error');
        }
        throw networkError;
      }
    },

    get(endpoint, options = {}) {
      return this.request(endpoint, { ...options, method: 'GET' });
    },

    post(endpoint, body = {}, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: 'POST',
        body: JSON.stringify(body)
      });
    },

    put(endpoint, body = {}, options = {}) {
      return this.request(endpoint, {
        ...options,
        method: 'PUT',
        body: JSON.stringify(body)
      });
    },

    delete(endpoint, options = {}) {
      return this.request(endpoint, { ...options, method: 'DELETE' });
    },

    /**
     * Non-intrusive Glassmorphism Toast Notification with Accessibility Support
     */
    showToast(message, type = 'info') {
      let container = document.getElementById('skillnex-toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'skillnex-toast-container';
        container.setAttribute('role', 'status');
        container.setAttribute('aria-live', 'polite');
        container.setAttribute('aria-atomic', 'true');
        container.style.cssText = `
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 99999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
          pointer-events: none;
        `;
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.style.cssText = `
        pointer-events: auto;
        padding: 12px 18px;
        border-radius: 12px;
        font-family: inherit;
        font-size: 13px;
        font-weight: 500;
        line-height: 1.5;
        backdrop-filter: blur(16px);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      `;

      let icon = 'ℹ️';
      if (type === 'success') {
        icon = '✅';
        toast.style.background = 'rgba(16, 185, 129, 0.15)';
        toast.style.border = '1px solid rgba(16, 185, 129, 0.4)';
        toast.style.color = '#34d399';
      } else if (type === 'error') {
        icon = '❌';
        toast.style.background = 'rgba(244, 63, 94, 0.15)';
        toast.style.border = '1px solid rgba(244, 63, 94, 0.4)';
        toast.style.color = '#fb7185';
      } else if (type === 'warning') {
        icon = '⚠️';
        toast.style.background = 'rgba(245, 158, 11, 0.15)';
        toast.style.border = '1px solid rgba(245, 158, 11, 0.4)';
        toast.style.color = '#fbbf24';
      } else {
        toast.style.background = 'rgba(99, 102, 241, 0.15)';
        toast.style.border = '1px solid rgba(99, 102, 241, 0.4)';
        toast.style.color = '#a5b4fc';
      }

      toast.innerHTML = `<span aria-hidden="true">${icon}</span><span style="flex:1">${message}</span>`;
      container.appendChild(toast);

      // Animate in
      requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
      });

      // Animate out
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 350);
      }, 4000);
    }
  };

  window.API = API;
})(window);
