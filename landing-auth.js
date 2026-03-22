/**
 * landing-auth.js — Authentication flow for index.html gateway
 */

(function landingAuthInit() {
  "use strict";

  var GoogleAuth = window.CSGoogleAuth;
  var el = {};
  var AUTO_REDIRECT_DELAY_MS = 550;

  function cacheElements() {
    el.signInBtn = document.getElementById("landing-sign-in-btn");
    el.signOutBtn = document.getElementById("landing-sign-out-btn");
    el.openHubBtn = document.getElementById("landing-open-hub-btn");
    el.userName = document.getElementById("landing-user-name");
    el.userEmail = document.getElementById("landing-user-email");
    el.userAvatar = document.getElementById("landing-user-avatar");
    el.authUnauthenticated = document.getElementById("auth-unauthenticated");
    el.authAuthenticated = document.getElementById("auth-authenticated");
  }

  function goToSpecialistHub() {
    window.location.href = "./specialist-hub.html";
  }

  function showAuthenticatedUI(user) {
    if (el.authUnauthenticated) el.authUnauthenticated.style.display = "none";
    if (el.authAuthenticated) el.authAuthenticated.style.display = "flex";

    if (el.userName) el.userName.textContent = user && user.name ? user.name : "Specialist";
    if (el.userEmail) el.userEmail.textContent = user && user.email ? user.email : "";
    if (el.userAvatar) {
      if (user && user.picture) {
        el.userAvatar.src = user.picture;
        el.userAvatar.style.display = "block";
      } else {
        el.userAvatar.removeAttribute("src");
        el.userAvatar.style.display = "none";
      }
    }
  }

  function showUnauthenticatedUI() {
    if (el.authUnauthenticated) el.authUnauthenticated.style.display = "block";
    if (el.authAuthenticated) el.authAuthenticated.style.display = "none";
  }

  function updateUIForAuthState() {
    if (!GoogleAuth) {
      showUnauthenticatedUI();
      return;
    }

    var user = GoogleAuth.getCurrentUser && GoogleAuth.getCurrentUser();
    if (user && user.email) {
      showAuthenticatedUI(user);
    } else {
      showUnauthenticatedUI();
    }
  }

  function handleSignIn() {
    if (!GoogleAuth || !GoogleAuth.signIn) return;

    GoogleAuth.signIn()
      .then(function (user) {
        showAuthenticatedUI(user || {});
        window.setTimeout(goToSpecialistHub, AUTO_REDIRECT_DELAY_MS);
      })
      .catch(function (err) {
        console.error("[LandingAuth] Sign-in failed:", err);
        window.alert("Sign-in failed. Please try again.");
      });
  }

  function handleSignOut() {
    if (!GoogleAuth || !GoogleAuth.signOut) return;
    GoogleAuth.signOut();
    showUnauthenticatedUI();
  }

  function init() {
    cacheElements();

    if (GoogleAuth && GoogleAuth.init) {
      GoogleAuth.init();
    }

    if (el.signInBtn) el.signInBtn.addEventListener("click", handleSignIn);
    if (el.signOutBtn) el.signOutBtn.addEventListener("click", handleSignOut);
    if (el.openHubBtn) {
      el.openHubBtn.addEventListener("click", function () {
        // allow normal navigation while keeping the CTA explicit for keyboard users
      });
    }

    updateUIForAuthState();

    if (GoogleAuth && GoogleAuth.onAuthChange) {
      GoogleAuth.onAuthChange(function () {
        updateUIForAuthState();
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.LandingAuth = {
    updateUI: updateUIForAuthState,
    getCurrentUser: function () {
      return GoogleAuth && GoogleAuth.getCurrentUser ? GoogleAuth.getCurrentUser() : null;
    },
    signIn: handleSignIn,
    signOut: handleSignOut,
    goToSpecialistHub: goToSpecialistHub
  };
})();
