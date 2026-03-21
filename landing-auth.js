/**
 * landing-auth.js — Authentication flow for index.html
 *
 * Handles:
 * - Google Sign-In button initialization
 * - User session persistence
 * - Authenticated user greeting
 * - Sign-out functionality
 * - Conditional rendering of landing destinations
 *
 * Requires: google-auth.js to be loaded first
 */

(function landingAuthInit() {
  "use strict";

  var GoogleAuth = window.CSGoogleAuth;
  var el = {};

  /* ── Element References ────────────────────────────────────── */

  function cacheElements() {
    el.body = document.body;
    el.authSection = document.getElementById("landing-auth-section");
    el.signInBtn = document.getElementById("landing-sign-in-btn");
    el.signOutBtn = document.getElementById("landing-sign-out-btn");
    el.userGreeting = document.getElementById("landing-user-greeting");
    el.userName = document.getElementById("landing-user-name");
    el.userEmail = document.getElementById("landing-user-email");
    el.userAvatar = document.getElementById("landing-user-avatar");
    el.authUnauthenticated = document.getElementById("auth-unauthenticated");
    el.authAuthenticated = document.getElementById("auth-authenticated");
    el.destinations = document.querySelectorAll(".landing-destination");
    el.destinationsContainer = document.querySelector(".landing-destinations");
  }

  /* ── Authentication State ────────────────────────────────────── */

  function updateUIForAuthState() {
    if (!GoogleAuth) {
      console.warn("[LandingAuth] GoogleAuth not available");
      showUnauthenticatedUI();
      return;
    }

    var user = GoogleAuth.getCurrentUser();

    if (user && user.email) {
      showAuthenticatedUI(user);
      enableDestinations();
    } else {
      showUnauthenticatedUI();
      disableDestinations();
    }
  }

  function showAuthenticatedUI(user) {
    if (el.authUnauthenticated) el.authUnauthenticated.style.display = "none";
    if (el.authAuthenticated) el.authAuthenticated.style.display = "block";

    if (el.userName) el.userName.textContent = user.name || "User";
    if (el.userEmail) el.userEmail.textContent = user.email;
    if (el.userAvatar && user.picture) {
      el.userAvatar.src = user.picture;
      el.userAvatar.style.display = "block";
    }
  }

  function showUnauthenticatedUI() {
    if (el.authUnauthenticated) el.authUnauthenticated.style.display = "block";
    if (el.authAuthenticated) el.authAuthenticated.style.display = "none";
  }

  function enableDestinations() {
    if (el.destinationsContainer) {
      el.destinationsContainer.style.display = "block";
    }
    (el.destinations || []).forEach(function (el) {
      el.style.opacity = "1";
      el.style.pointerEvents = "auto";
    });
  }

  function disableDestinations() {
    // Hide destinations section completely when not authenticated
    if (el.destinationsContainer) {
      el.destinationsContainer.style.display = "none";
    }
    (el.destinations || []).forEach(function (el) {
      el.style.opacity = "0.4";
      el.style.pointerEvents = "none";
    });
  }

  /* ── Event Handlers ─────────────────────────────────────────── */

  function handleSignIn() {
    if (!GoogleAuth) return;

    GoogleAuth.signIn()
      .then(function (user) {
        console.log("[LandingAuth] Signed in as:", user.email);
        updateUIForAuthState();
        // Optional: auto-navigate to Specialist Hub after successful sign-in
        // setTimeout(function () {
        //   window.location.href = "./specialist-hub.html";
        // }, 500);
      })
      .catch(function (err) {
        console.error("[LandingAuth] Sign-in failed:", err);
        alert("Sign-in failed. Please try again.");
      });
  }

  function handleSignOut() {
    if (!GoogleAuth) return;

    GoogleAuth.signOut();
    console.log("[LandingAuth] Signed out");
    updateUIForAuthState();
  }

  /* ── Initialization ────────────────────────────────────────── */

  function init() {
    cacheElements();

    if (!GoogleAuth) {
      console.warn("[LandingAuth] GoogleAuth module not loaded");
      return;
    }

    // Initialize Google Auth
    GoogleAuth.init();

    // Wire up event listeners
    if (el.signInBtn) {
      el.signInBtn.addEventListener("click", handleSignIn);
    }
    if (el.signOutBtn) {
      el.signOutBtn.addEventListener("click", handleSignOut);
    }

    // Update UI based on current auth state
    updateUIForAuthState();

    // Listen for auth changes (sign-in from other tabs, token expiry, etc.)
    GoogleAuth.onAuthChange(function (user) {
      updateUIForAuthState();
    });
  }

  /* ── Auto-init on DOM ready ────────────────────────────────── */

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Export for external use
  window.LandingAuth = {
    updateUI: updateUIForAuthState,
    getCurrentUser: function () {
      return GoogleAuth && GoogleAuth.getCurrentUser();
    },
    signIn: handleSignIn,
    signOut: handleSignOut
  };
})();
