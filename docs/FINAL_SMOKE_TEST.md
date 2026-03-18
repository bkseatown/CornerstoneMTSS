# FINAL SMOKE TEST CHECKLIST

**Status**: TO RUN BEFORE MARCH 31
**Date**: March 18, 2026
**Purpose**: Verify platform readiness for live teacher testing
**Timeline**: 2-3 hours (run March 28-29)

---

## PRE-TEST SETUP

### Build & Deployment
- [ ] Latest build deployed to production (March 28 EOD)
- [ ] Build number verified in footer/settings
- [ ] Service worker cache cleared on deployment
- [ ] Browser cache headers configured correctly
- [ ] All static assets loading (CSS, JS, images, fonts)

### Test Account Access
- [ ] Admin account has access to all features
- [ ] Demo teacher account created and verified
- [ ] Demo student caseload loaded and visible
- [ ] Analytics tracking enabled and logging events
- [ ] Error logging configured (dev console clear of errors)

---

## CORE PLATFORM FEATURES

### Landing & Authentication
- [ ] Landing page (index.html) loads without errors
- [ ] Login form functional with test credentials
- [ ] Error handling for invalid credentials (shows error, no crash)
- [ ] "Forgot password" flow works (if applicable)
- [ ] Logout functionality removes session
- [ ] Redirect to login if accessing protected pages directly

### Morning Brief (Dashboard)
- [ ] Page loads within 2 seconds
- [ ] Demo students appear in caseload list
- [ ] Student cards display: name, grade, current performance
- [ ] Student cards are clickable and navigate to profile
- [ ] Sorting/filtering works (by grade, status, name)
- [ ] No placeholder content visible
- [ ] Dark mode displays correctly (high contrast)
- [ ] Mobile view (375px): cards stack in single column
- [ ] Tablet view (768px): proper card layout and spacing

### Student Profile
- [ ] Page loads for demo student without errors
- [ ] Assessment data displays correctly (all scores visible)
- [ ] Student history/intervention timeline shows
- [ ] Navigation tabs work (Profile, Assessments, Progress)
- [ ] Quick Log button is visible and clickable
- [ ] Evidence section loads without errors
- [ ] Mobile: information is readable and scrollable

### Focus Card (Recommendations)
- [ ] Focus Card loads with primary recommendation
- [ ] Recommendation includes: intervention name, confidence score, rationale
- [ ] Alternative recommendations section expands/collapses smoothly
- [ ] Each alternative shows: name, confidence, rationale, context
- [ ] "Use this approach" button is clickable on alternatives
- [ ] Selection is confirmed with visual feedback (✓ Selected)
- [ ] Card is readable on mobile (375px+)
- [ ] Dark mode: text is readable on colored backgrounds

### Game Gallery
- [ ] Gallery page loads all game cards
- [ ] Each game card displays with correct vibrant color gradient:
  - [ ] Word Quest: Rich Teal (#1a6f7e to #3da9ce)
  - [ ] Typing Quest: Warm Amber (#d67f2e to #f5ba4d)
  - [ ] Precision Play: Vibrant Purple (#6b46c1 to #a78bfa)
  - [ ] Word Connections: Fresh Green (#357a5c to #5fbb95)
  - [ ] Reading Lab: Warm Coral (#d34d38 to #f5a962)
  - [ ] Sentence Surgery: Cool Blue (#1e40af to #60a5fa)
  - [ ] Writing Studio: Soft Magenta (#a71f7f to #e082b6)
  - [ ] Numeracy: Bright Orange (#d97706 to #fbbf24)
- [ ] Game card hover effect: brightness increases and card lifts
- [ ] Game card text is white and readable on backgrounds
- [ ] Badge styling is visible with color-matched appearance
- [ ] Grade filter dropdown works (K, 1-2, 3-5, 6-8, 9-12)
- [ ] Subject filter dropdown works
- [ ] Cards are clickable and navigate to game details
- [ ] Mobile view: cards display in responsive grid

### Game Play
- [ ] Each game loads without errors (test 2-3 games minimum)
  - [ ] Word Quest loads completely
  - [ ] Typing Quest loads completely
  - [ ] Precision Play loads completely
- [ ] Game assets display correctly (images, animations, UI)
- [ ] Game mechanics work: input response, scoring, feedback
- [ ] Exit button returns to gallery
- [ ] Celebration animations trigger after correct answers
- [ ] Score tracking displays correctly
- [ ] Dark mode displays correctly in games
- [ ] Mobile: game UI scales appropriately (375px+)
- [ ] Touch controls responsive on touch devices

---

## INTERVENTION RECOMMENDATION ENGINE

### Primary Recommendations
- [ ] Recommendations generate for all demo students
- [ ] Recommendation type matches student gap profile
- [ ] Confidence score displays (0-100%)
- [ ] Rationale explains why recommendation was made
- [ ] Recommendations appropriate for grade level

### Alternative Recommendations
- [ ] Alternative section appears and expands smoothly
- [ ] 2-3 alternatives display for each student
- [ ] Alternatives are ranked by confidence (descending)
- [ ] Each alternative includes name, confidence, rationale
- [ ] Context descriptions are relevant and helpful
- [ ] "Use this approach" buttons are functional
- [ ] Selection saves to localStorage
- [ ] Selection logged to recommendation history

### Recommendation Accuracy
- [ ] Marcus (EMERGING): Recommends phonics-focused intervention ✓
- [ ] Jasmine (DEVELOPING): Recommends fluency-focused intervention ✓
- [ ] DeAndre (EMERGING + behavior): Recommends engaging games ✓
- [ ] Sophia (PROFICIENT): Recommends enrichment, not intervention ✓
- [ ] Ethan (MIXED): Recommends appropriate multi-skill intervention ✓

---

## EVIDENCE & LOGGING

### Quick Log Feature
- [ ] Evidence logging form loads without errors
- [ ] Form fields present: date, observation, severity
- [ ] Form accepts text input
- [ ] Submit button saves evidence
- [ ] Saved evidence appears in student's evidence history
- [ ] Evidence displays in chronological order (newest first)

### AI-Captured Evidence
- [ ] When intervention is logged, system captures: student, intervention, date
- [ ] Captured evidence appears in Evidence section
- [ ] Evidence correctly links to recommendation that was made

### Evidence Editing
- [ ] Teachers can edit evidence they entered
- [ ] Delete function available
- [ ] Edit/delete doesn't break system

---

## REPORTS & ANALYTICS

### Student Progress View
- [ ] Progress page loads without errors
- [ ] Student performance trends display
- [ ] Charts/graphs render correctly
- [ ] Data is current (reflects demo data entered)
- [ ] Export button available (if feature exists)

### Analytics Dashboard (Internal)
- [ ] Feature usage tracked (Focus Card views, alternative selections)
- [ ] Game play tracked (game starts, completions)
- [ ] Evidence capture tracked (Quick Logs, AI-captured)
- [ ] Recommendation acceptance tracked
- [ ] System is not logging performance to slow down platform

---

## NAVIGATION & USABILITY

### Menu Navigation
- [ ] Main navigation menu loads and functions
- [ ] All primary pages accessible from menu
- [ ] Menu displays correctly on mobile (hamburger if needed)
- [ ] Mobile menu opens/closes smoothly
- [ ] No dead links in navigation

### Breadcrumbs / Back Navigation
- [ ] Back button works from all pages
- [ ] Breadcrumbs display accurately
- [ ] Navigation doesn't get stuck

### Settings/Preferences
- [ ] Settings page loads
- [ ] Theme selector works (Light/Dark modes)
- [ ] Theme preference saves
- [ ] Settings persist after refresh

---

## ACCESSIBILITY & RESPONSIVE DESIGN

### Keyboard Navigation
- [ ] Tab order is logical (left-to-right, top-to-bottom)
- [ ] Focus indicator visible on all interactive elements
- [ ] Enter/Space activate buttons correctly
- [ ] Escape closes modals/dropdowns
- [ ] Can interact with all features using keyboard only

### Screen Reader Compatibility
- [ ] Major sections have semantic HTML (header, main, nav)
- [ ] Images have alt text
- [ ] Form labels associated with inputs
- [ ] Buttons have accessible names
- [ ] ARIA labels present where needed

### Color Contrast
- [ ] Text contrast ratio 4.5:1 for normal text (WCAG AA)
- [ ] Focus states have sufficient contrast
- [ ] Color alone is not used to convey information
- [ ] Dark mode has appropriate contrast

### Mobile Responsiveness
- [ ] **Mobile (375px)**: All content accessible, no horizontal scroll
  - [ ] Text readable at default zoom
  - [ ] Buttons touch-friendly (48px+ minimum)
  - [ ] Forms easy to use
  - [ ] Images scale appropriately

- [ ] **Tablet (768px)**: Optimized layout
  - [ ] Content well-organized
  - [ ] Touch targets appropriate
  - [ ] Spacing logical

- [ ] **Desktop (1280px+)**: Full feature set visible
  - [ ] Sidebar/layout visible
  - [ ] Multi-column layouts work
  - [ ] No excessive line lengths

---

## VISUAL POLISH & CONSISTENCY

### Gallery Colors (Recently Updated)
- [ ] Each game card has distinct vibrant color
- [ ] Colors are consistent with design system
- [ ] Text color (white) readable on all backgrounds
- [ ] Badge styling uses appropriate rgba overlays
- [ ] Hover states enhance visual appeal (brightness, shadow)
- [ ] Transitions are smooth (no jank)

### Typography
- [ ] Font loads correctly (no fallback fonts)
- [ ] Headings have proper hierarchy (h1 > h2 > h3)
- [ ] Body text line height and spacing appropriate
- [ ] No text overflow issues
- [ ] Dark mode text is readable

### Spacing & Alignment
- [ ] Consistent padding throughout
- [ ] Elements properly aligned (no misalignment)
- [ ] Whitespace appropriate
- [ ] Cards/sections visually distinct

### Animations
- [ ] Celebration animations smooth and celebratory
- [ ] No animation jank or performance issues
- [ ] Animations have proper duration (300-500ms typically)
- [ ] Animations respect prefers-reduced-motion if set
- [ ] Animations don't interfere with functionality

---

## BUTTONS AUDIT (Key Buttons)

### Gallery Buttons
- [ ] Game card buttons clickable and navigate correctly
- [ ] Filter buttons (grade, subject) open dropdowns
- [ ] Dropdown items selectable
- [ ] Theme toggle button works
- [ ] Menu buttons accessible

### Gameplay Buttons
- [ ] Game start button launches game
- [ ] Exit/back button returns to gallery (tested in 2-3 games)
- [ ] Hint button functional (if present in games)
- [ ] Submit/check answer button works
- [ ] Buttons have clear hover/active states
- [ ] Buttons responsive on mobile (48px+ touch targets)

### Focus Card Buttons
- [ ] Primary recommendation buttons functional
- [ ] "Use this approach" buttons on alternatives work
- [ ] Evidence button loads logging form
- [ ] Confirm/submit buttons in forms work

### All Buttons: Accessibility
- [ ] Visible focus states on keyboard navigation
- [ ] Buttons accessible via keyboard (Tab + Enter/Space)
- [ ] Aria-labels on icon-only buttons
- [ ] Disabled buttons have aria-disabled="true"

---

## PERFORMANCE & LOAD TIMES

### Page Load Times
- [ ] Home/Landing: <2 seconds
- [ ] Dashboard: <2 seconds
- [ ] Student Profile: <2 seconds
- [ ] Game Gallery: <3 seconds
- [ ] Game startup: <3 seconds

### Server/Backend
- [ ] No 404 errors in console
- [ ] No 5xx errors from server
- [ ] API calls successful (status 200)
- [ ] Database queries returning data
- [ ] Error logging working (no errors lost)

### Client Performance
- [ ] No JavaScript errors in console
- [ ] No CSS parsing errors
- [ ] Animations don't cause jank (60fps smooth)
- [ ] Large page interactions responsive (<100ms)
- [ ] Memory usage reasonable (not growing unbounded)

---

## DARK MODE VERIFICATION

### All Pages
- [ ] Landing page displays correctly in dark mode
- [ ] Dashboard readable (text contrast good)
- [ ] Student profile readable
- [ ] Focus card readable (text on colored alternatives section)
- [ ] Game gallery readable (white text on game colors)
- [ ] Game UI readable in dark mode
- [ ] Settings page readable

### Specific Issues to Watch
- [ ] Colored backgrounds in focus card: text readable?
- [ ] Game cards: white text visible against gradients?
- [ ] Modals/overlays: proper dark mode styling?
- [ ] Form inputs: outline/border visible?

---

## ERROR HANDLING

### Invalid/Missing Data
- [ ] Accessing non-existent student ID: shows error (not crash)
- [ ] Missing assessment data: displays gracefully
- [ ] No recommendations available: shows message
- [ ] Game load fails: shows error message + back button

### Network Issues
- [ ] Slow network: loading indicators appear
- [ ] Offline: appropriate error message
- [ ] Connection drops during feature use: recoverable

### Permission/Auth
- [ ] Trying to access another teacher's caseload: denied
- [ ] Session expires: redirects to login
- [ ] Invalid credentials: clear error message

---

## BUILD & VERSION

### Version Stamping
- [ ] Build number visible in footer or settings
- [ ] Build stamp reflects latest deployment
- [ ] Version format: YYYY-MM-DDx (e.g., 2026-03-18a)
- [ ] Build badge shows current version

### Service Worker
- [ ] Service worker installed (inspect application tab)
- [ ] Offline functionality works (if implemented)
- [ ] Cache strategy appropriate (serve cached, background update)
- [ ] No stale content issues

---

## FINAL VERIFICATION CHECKLIST

Before declaring ready for teachers:

- [ ] All critical features tested and passing
- [ ] No critical bugs found
- [ ] <5 minor bugs (known issues documented with workarounds)
- [ ] Performance acceptable (pages load <3 seconds)
- [ ] Accessibility verified (keyboard nav, contrast, ARIA)
- [ ] Mobile responsiveness verified (375px+)
- [ ] Dark mode functional
- [ ] Demo data loaded and visible
- [ ] Recommendations generating appropriately
- [ ] No JavaScript errors in console
- [ ] Error handling graceful (no crashes)
- [ ] Support infrastructure ready (email, FAQ, escalation)

---

## TEST EXECUTION NOTES

### When to Run
- March 28, 9am-12pm (3 hours)
- Run by: Product Lead + 1 QA person
- Document any issues found
- Fix critical issues same day
- Deploy any fixes by March 28 EOD

### Testing Environment
- Test on: Chrome (primary), Safari, Firefox
- Test on devices: Laptop, iPhone, iPad
- Test in: Light mode, Dark mode
- Test network: Home internet (typical speed), and on 4G if possible

### Reporting Issues
- Use issue template: Date | Feature | Issue | Severity | Status
- Screenshot if visual issue
- Note exact steps to reproduce
- Assign to fix or document as known issue

---

## GO/NO-GO DECISION

### GO (Proceed with Teacher Testing)
✅ All critical features working
✅ <3 critical bugs (preferably 0)
✅ Known issues documented with workarounds
✅ Platform loads reliably
✅ Recommendations generating sensibly
✅ Demo data ready
✅ Support infrastructure deployed

### NO-GO (Delay Testing)
❌ >3 critical bugs unresolved
❌ Data loss or security issue
❌ Core feature not working (recommendations, games, login)
❌ Performance severely degraded
❌ Platform crashes on common workflows

### CONDITIONAL GO (Proceed with Caveats)
⚠️ Minor bugs present but documented
⚠️ Workarounds available for known issues
⚠️ Support team briefed on issues
⚠️ Teachers given heads-up in welcome email

---

## SIGN-OFF

**Test Completed By**: _____________________ Date: ___________

**Result**: ☐ GO  ☐ NO-GO  ☐ CONDITIONAL GO

**Issues Found**: ____ Critical  ____ Major  ____ Minor

**Known Issues Documented**: Yes / No

**Support Ready**: Yes / No

**Recommendation**: ________________________________________

---

**Next Step**: After passing smoke test, execute final deployment and notify teacher cohort of go-live date.

