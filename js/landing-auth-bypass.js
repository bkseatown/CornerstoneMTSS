/**
 * landing-auth-bypass.js
 * Demo/Testing mode: Bypass Google Sign-In without a real account
 *
 * Enable by setting: window.ENABLE_AUTH_BYPASS = true
 * Or click "Demo Mode" button on landing page
 */

(function LandingAuthBypass() {
  'use strict';

  // Mock authenticated user for testing
  const mockUser = {
    email: 'teacher@example.com',
    name: 'Demo Teacher',
    picture: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ccircle cx="50" cy="50" r="50" fill="%2366BB6A"/%3E%3Ctext x="50" y="65" font-size="60" font-weight="bold" text-anchor="middle" fill="white"%3ET%3C/text%3E%3C/svg%3E',
    id: 'demo-user-12345',
  };

  /**
   * Create demo mode button
   */
  function createDemoButton() {
    const button = document.createElement('button');
    button.id = 'landing-demo-mode-btn';
    button.textContent = '🚀 Demo Mode (Skip Sign-In)';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 15px;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 12px;
      cursor: pointer;
      z-index: 9999;
      font-weight: bold;
    `;

    button.addEventListener('click', () => {
      activateDemoMode();
      button.style.display = 'none';
    });

    return button;
  }

  /**
   * Activate demo mode - simulate successful authentication
   */
  function activateDemoMode() {
    console.log('[AuthBypass] Activating demo mode...');

    // Store mock user data
    window.mockAuthUser = mockUser;
    localStorage.setItem('demo-mode-user', JSON.stringify(mockUser));

    // Update UI to authenticated state
    const authSection = document.getElementById('landing-auth-section');
    if (authSection) {
      authSection.style.display = 'none';
    }

    const authUnauthenticated = document.getElementById('auth-unauthenticated');
    if (authUnauthenticated) {
      authUnauthenticated.style.display = 'none';
    }

    const authAuthenticated = document.getElementById('auth-authenticated');
    if (authAuthenticated) {
      authAuthenticated.style.display = 'block';

      // Set user info
      const userName = document.getElementById('landing-user-name');
      if (userName) userName.textContent = mockUser.name;

      const userEmail = document.getElementById('landing-user-email');
      if (userEmail) userEmail.textContent = mockUser.email;

      const userAvatar = document.getElementById('landing-user-avatar');
      if (userAvatar) {
        userAvatar.src = mockUser.picture;
        userAvatar.style.display = 'block';
      }
    }

    // Show destinations
    const destinations = document.querySelector('.landing-destinations');
    if (destinations) {
      destinations.style.display = 'block';
      destinations.style.opacity = '1';
      destinations.style.pointerEvents = 'auto';
    }

    console.log('[AuthBypass] Demo mode activated. User: ', mockUser.email);

    // Show notification
    showNotification('✅ Demo Mode Active - Signed in as ' + mockUser.email, 3000);
  }

  /**
   * Mock Google Auth API for demo mode
   */
  function createMockGoogleAuth() {
    return {
      init: function() {
        console.log('[AuthBypass] Google Auth mock initialized');
      },

      signIn: function() {
        return new Promise((resolve) => {
          activateDemoMode();
          resolve(mockUser);
        });
      },

      signOut: function() {
        localStorage.removeItem('demo-mode-user');
        console.log('[AuthBypass] Signed out');
        window.location.reload();
      },

      getCurrentUser: function() {
        const stored = localStorage.getItem('demo-mode-user');
        return stored ? JSON.parse(stored) : null;
      },

      onAuthChange: function(callback) {
        // Call immediately with current user
        const user = this.getCurrentUser();
        if (user) callback(user);
      },
    };
  }

  /**
   * Show temporary notification
   */
  function showNotification(message, duration = 3000) {
    const div = document.createElement('div');
    div.textContent = message;
    div.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2ecc71;
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      z-index: 10000;
      font-weight: bold;
    `;

    document.body.appendChild(div);
    setTimeout(() => div.remove(), duration);
  }

  /**
   * Check if demo mode is requested
   */
  function isDemoModeRequested() {
    return (
      window.ENABLE_AUTH_BYPASS ||
      localStorage.getItem('demo-mode-enabled') === 'true' ||
      new URLSearchParams(window.location.search).get('demo') === 'true'
    );
  }

  /**
   * Initialize bypass system
   */
  function init() {
    // Add demo button to all pages
    if (document.body) {
      document.body.appendChild(createDemoButton());
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(createDemoButton());
      });
    }

    // If demo mode is active, initialize mock auth
    if (isDemoModeRequested()) {
      const stored = localStorage.getItem('demo-mode-user');
      if (stored) {
        window.mockAuthUser = JSON.parse(stored);
        // Don't auto-activate, let user click button or use URL param
      }

      // If URL has ?demo=true, auto-activate
      if (new URLSearchParams(window.location.search).get('demo') === 'true') {
        window.addEventListener('load', () => {
          setTimeout(activateDemoMode, 500);
        });
      }
    }

    // Provide mock Google Auth as fallback
    if (!window.CSGoogleAuth) {
      window.CSGoogleAuth = createMockGoogleAuth();
      console.log('[AuthBypass] Mock Google Auth available');
    }

    console.log('[AuthBypass] Initialized - Click "Demo Mode" button to bypass sign-in');
  }

  // Export for external use
  window.LandingAuthBypass = {
    activate: activateDemoMode,
    getMockUser: () => mockUser,
    isDemoActive: () => !!localStorage.getItem('demo-mode-user'),
    mockAuth: createMockGoogleAuth(),
  };

  // Auto-init on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
