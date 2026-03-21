/**
 * specialist-hub-google-workspace.js — Google Auth + Classroom sync module
 *
 * Manages:
 * - Google authentication initialization
 * - Auth state subscriptions (sign in/out UI updates)
 * - Google Classroom course picker modal
 * - Classroom roster sync to hub caseload
 *
 * Extracted from specialist-hub.js (Phase 2 refactoring)
 * Reduces specialist-hub.js by ~180 lines
 * Makes Google integration optional (graceful degradation if Google config missing)
 */

function createSpecialistHubGoogleWorkspaceModule(deps) {
  "use strict";

  var showToast = deps.showToast;
  var loadCaseload = deps.loadCaseload;

  if (!showToast || !loadCaseload) {
    console.warn("[SpecialistHubGoogleWorkspace] Missing dependencies. Google Workspace disabled.");
    return null;
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function openClassroomModal() {
    var modal     = document.getElementById("th2-classroom-modal");
    var body      = document.getElementById("th2-classroom-modal-body");
    var closeBtn  = document.getElementById("th2-classroom-modal-close");
    var Classroom = window.CSGoogleClassroom;

    if (!modal || !Classroom) return;
    modal.classList.remove("hidden");

    if (body) body.innerHTML = "<p class='th2-classroom-modal-loading'>Loading your courses…</p>";

    if (closeBtn) {
      closeBtn.onclick = function () { modal.classList.add("hidden"); };
    }
    modal.addEventListener("click", function (e) {
      if (e.target === modal) modal.classList.add("hidden");
    }, { once: true });

    Classroom.fetchCourses().then(function (courses) {
      if (!body) return;
      if (!courses.length) {
        body.innerHTML = "<p class='th2-classroom-modal-loading'>No active courses found in your Google Classroom.</p>";
        return;
      }
      var html = "";
      courses.forEach(function (c) {
        html += "<div class='th2-classroom-course-item'>" +
          "<div><div class='th2-classroom-course-name'>" + escHtml(c.name) + "</div>" +
          (c.section ? "<div class='th2-classroom-course-section'>" + escHtml(c.section) + "</div>" : "") +
          "</div>" +
          "<button class='th2-classroom-sync-course-btn' data-course-id='" + escHtml(c.id) + "' data-course-name='" + escHtml(c.name) + "'>Sync</button>" +
          "</div>";
      });
      body.innerHTML = html;

      /* Wire sync buttons */
      body.querySelectorAll(".th2-classroom-sync-course-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var courseId   = btn.getAttribute("data-course-id");
          var courseName = btn.getAttribute("data-course-name");
          btn.textContent = "Syncing…";
          btn.disabled = true;
          Classroom.syncRosterToHub(courseId).then(function (result) {
            modal.classList.add("hidden");
            showToast("Synced " + result.added + " student(s) from '" + courseName + "' (" + result.skipped + " already in caseload).", "success");
            /* Reload caseload to show new students */
            loadCaseload();
          }).catch(function (err) {
            btn.textContent = "Retry";
            btn.disabled = false;
            showToast("Classroom sync failed: " + err.message, "error");
          });
        });
      });
    }).catch(function (err) {
      if (body) body.innerHTML = "<p class='th2-classroom-modal-loading'>Error: " + escHtml(err.message) + "</p>";
    });
  }

  function init() {
    var chipEl       = document.getElementById("th2-auth-chip");
    var avatarEl     = document.getElementById("th2-auth-avatar");
    var nameEl       = document.getElementById("th2-auth-name");
    var syncRow      = document.getElementById("th2-classroom-sync-row");
    var signinRow    = document.getElementById("th2-google-signin-row");
    var syncBtn      = document.getElementById("th2-classroom-sync-btn");
    var signinBtn    = document.getElementById("th2-google-signin-btn");
    var signoutBtn   = document.getElementById("th2-google-signout-btn");

    var Auth      = window.CSGoogleAuth;
    var Classroom = window.CSGoogleClassroom;

    if (!Auth) return; /* Auth module not loaded — Google config missing */

    Auth.init();

    Auth.onAuthChange(function (user) {
      if (user) {
        /* Signed in — show chip + sync row, hide sign-in row */
        if (chipEl)    chipEl.classList.remove("hidden");
        if (syncRow)   syncRow.classList.remove("hidden");
        if (signinRow) signinRow.classList.add("hidden");
        if (nameEl)    nameEl.textContent = user.name ? user.name.split(" ")[0] : user.email;
        if (avatarEl && user.picture) {
          avatarEl.src = user.picture;
          avatarEl.alt = user.name || "Google account";
        }
      } else {
        /* Signed out — hide chip + sync row */
        if (chipEl)    chipEl.classList.add("hidden");
        if (syncRow)   syncRow.classList.add("hidden");
        /* Show sign-in row only if auth module is configured */
        if (signinRow && Auth.isConfigured()) {
          signinRow.classList.remove("hidden");
        }
      }
    });

    /* Sign-in button */
    if (signinBtn) {
      signinBtn.addEventListener("click", function () {
        signinBtn.textContent = "Signing in…";
        signinBtn.disabled = true;
        Auth.signIn().catch(function (err) {
          showToast("Google sign-in failed: " + err.message, "error");
          signinBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Sign in with Google';
          signinBtn.disabled = false;
        });
      });
    }

    /* Sign-out button */
    if (signoutBtn) {
      signoutBtn.addEventListener("click", function () {
        Auth.signOut();
        showToast("Signed out of Google.", "info");
      });
    }

    /* Classroom sync button — opens course picker */
    if (syncBtn && Classroom) {
      syncBtn.addEventListener("click", function () {
        openClassroomModal();
      });
    }
  }

  return {
    init: init,
    openClassroomModal: openClassroomModal
  };
}

// Wire to global scope
if (typeof window !== "undefined") {
  window.createSpecialistHubGoogleWorkspaceModule = createSpecialistHubGoogleWorkspaceModule;
}
