# TEACHER TESTING SUPPORT INFRASTRUCTURE

**Status**: READY TO DEPLOY
**Date**: March 18, 2026
**Purpose**: Support 5-10 teachers during 2-3 week testing phase

---

## SUPPORT CHANNELS

### Primary: Email
- **Address**: cornerstone-mtss-support@[domain].com (or your email forwarding alias)
- **Response SLA**: <4 hours during business hours (8am-5pm), next business day outside
- **Monitoring**: Check inbox at: Start of day, lunch, before leaving

### Secondary: Slack (Optional)
- **Channel**: #cornerstone-mtss-testing
- **Setup**: Invite all teacher testers + support team
- **Response SLA**: <1 hour during business hours
- **Use for**: Quick questions, feature clarifications, urgent issues

### Tertiary: Office Hours (Optional)
- **Schedule**: 2x/week optional drop-in (Tuesday + Thursday 4-5pm)
- **Format**: Zoom link shared in welcome email
- **Purpose**: General Q&A, feature walkthroughs, relationship building
- **Expectation**: Teachers can join if they have questions, no pressure to attend

---

## SUPPORT RESPONSE HIERARCHY

### Tier 1: Known Issues (Documented, Low Priority)
**Response**: "This is a known issue we're tracking. Workaround: [X]"
- Include in "KNOWN ISSUES" section below
- Provide workaround if available
- No immediate fix needed

### Tier 2: Questions About Features (Common)
**Response**: Answer with doc reference or explanation
- Use FAQ answers when applicable
- Include screenshots or video link if helpful
- Mark as FAQ candidate for future teachers

### Tier 3: Bugs (Medium Priority)
**Response**: "Thanks for reporting. We're looking into it. ETA: [X]"
- Escalate to product team immediately
- Document in bug log
- Update teacher with daily progress
- Plan fix for next deployment

### Tier 4: Critical Bugs (High Priority)
**Response**: "Critical issue confirmed. Deploying fix now."
- Stop what you're doing
- Triage with technical team (5-10 min)
- Deploy fix or rollback immediately
- Notify all teachers of resolution

### Tier 5: Data Loss / Security (Crisis)
**Response**: "We're investigating immediately. [Escalation info]"
- Immediate escalation to leadership
- Hourly status updates to affected teachers
- Detailed post-mortem after resolution

---

## KNOWN ISSUES & WORKAROUNDS

### Issue 1: Demo Data Not Showing in Caseload
**Symptom**: Teacher logs in but doesn't see demo students
**Root Cause**: Data not yet synced to their account
**Workaround**:
1. Clear browser cache (Cmd+Shift+Delete)
2. Logout and log back in
3. If still not showing, confirm demo data was assigned in admin panel

**ETA to Fix**: N/A (procedural issue, not bug)

### Issue 2: Game Won't Start / Loads Blank Screen
**Symptom**: Click "Play" button, game loads but no content visible
**Root Cause**: Service worker cache conflict OR game assets not loaded
**Workaround**:
1. Refresh page (Cmd+R or Ctrl+R)
2. Try a different game to isolate issue
3. Clear service worker: Settings > Storage > Clear All > Reload
4. If issue persists, try different browser

**Status**: Investigating service worker cache logic
**ETA**: Fix deployed by April 1

### Issue 3: Slow Page Loads on Slow Internet
**Symptom**: Pages take 5-10 seconds to load
**Root Cause**: Large assessment data transfers on slow connections
**Workaround**:
1. Platform is optimized for 4G+ speeds
2. On slower networks, refresh may take longer
3. Switching to mobile hotspot often helps if WiFi is slow
4. Report internet speed to support team if consistently slow

**Status**: Acceptable for testing phase (will optimize post-launch)
**ETA**: Not before April 7

### Issue 4: Dark Mode Colors Don't Display Correctly
**Symptom**: Text hard to read in dark mode on some screens
**Root Cause**: CSS variable scoping issue with some browsers
**Workaround**:
1. Switch to light mode temporarily (Settings > Theme > Light)
2. Report browser + OS combination to support
3. Works correctly in: Chrome, Safari, Firefox (latest versions)

**Status**: Investigating - likely browser-specific
**ETA**: Patch by April 5

---

## FREQUENTLY ASKED QUESTIONS

### About the Platform

**Q: What data is being collected about my students?**
A: During testing, we collect: assessment scores you enter, interventions you select, student progress on games, and your feedback. We're NOT collecting audio, photos, or any identifying information beyond first name. All data is stored securely and deleted after testing phase unless you consent otherwise.

**Q: Is this platform FERPA-compliant?**
A: Yes. We encrypt all student data, limit access to authorized staff, and don't share data with third parties. Full privacy policy: [LINK]

**Q: Can I use real students or only demo students?**
A: Please use demo students for testing. This keeps real student data safe and lets us control the test environment. Real data can be imported after launch.

---

### About Features

**Q: How do I log evidence of a student's reading performance?**
A: Two ways:
1. **AI Capture**: When you use the platform, we automatically log which interventions were selected and used
2. **Quick Log**: Click "Log Evidence" on the student's profile and manually enter notes about what you observed

**Q: What if I disagree with the AI recommendation?**
A: Perfect! Click "See Alternative Approaches" to view 2-3 alternatives, or log your feedback in the Evidence section. Your choices help us improve the recommendation model.

**Q: Do the games actually help students improve?**
A: Games are research-based and aligned to Science of Reading. Short-term (1-2 week) improvement may not be visible in assessment scores, but teachers report improved engagement and automaticity. We'll track this during testing.

**Q: Can I create my own interventions?**
A: Not yet - that's a future feature. For now, choose from the curated list. Let us know if you need an intervention type that's missing.

---

### About Surveys & Feedback

**Q: Do I have to complete surveys?**
A: Surveys are how we understand what's working. Daily survey (5 min) is essential; weekly reflection (15 min) is highly appreciated. We'll send reminders but respect your schedule.

**Q: Where do I submit the surveys?**
A: Links will be in your welcome email and sent daily via email. You can also access them from the platform Settings > Feedback.

**Q: Can I give feedback anytime or only in surveys?**
A: Anytime! Email support@... or message in Slack #cornerstone-mtss-testing. Surveys are formal collection points, but we want your feedback whenever you have it.

**Q: Will my feedback stay anonymous?**
A: No - we want to know it's you so we can follow up. But feedback is only shared internally for product improvement. We won't attribute quotes to you without permission.

---

### About Technical Issues

**Q: What if I find a bug?**
A: Report it immediately! Include: what you were doing, what happened, what you expected, and browser/device info. Include screenshot if possible.

**Q: What if I lose work / data doesn't save?**
A: Data saves automatically to the platform. If you don't see your changes, try refreshing. If data is truly lost, report it immediately with the student name and time it happened.

**Q: What if the platform is down / won't load?**
A: Check: 1) Your internet connection, 2) Try incognito mode, 3) Check our status page [LINK], 4) Email support. We have 99%+ uptime target, but let us know immediately if you experience outage.

**Q: Can I use the platform on my phone / iPad?**
A: Yes! Mobile responsive design tested on phones (375px) and tablets (768px). Some features work better on larger screens, but core functionality is mobile-friendly.

---

### About Participation

**Q: What if I need to stop testing early?**
A: No problem - just let us know. We'd love to hear feedback about why if you're willing to share, but no pressure.

**Q: Can I share the platform with colleagues who aren't part of the testing cohort?**
A: Please don't - we want to control who has access during testing. But definitely tell them about it! We'll have a wider launch later in the year.

**Q: What happens to my data after testing ends?**
A: You'll have the option to: 1) Keep your data and continue using the platform (pending wider launch), 2) Have data deleted, 3) Export data for your records. Your choice.

**Q: Will teachers get the platform for free after testing?**
A: That depends on the wider launch plan. Early testers will definitely get special pricing or incentives as a thank you for your feedback.

---

## SUPPORT TEAM PLAYBOOK

### Daily Routine

**Start of Day (8:00am)**
- [ ] Check email for overnight messages
- [ ] Check Slack #cornerstone-mtss-testing for urgent questions
- [ ] Review previous day's issues for follow-up needed

**Mid-Day (12:30pm)**
- [ ] Check email again
- [ ] Respond to any new issues
- [ ] Prepare response summaries for team

**End of Day (4:30pm)**
- [ ] Respond to all outstanding questions
- [ ] Flag any critical issues for escalation
- [ ] Document all issues in log
- [ ] Prepare end-of-day summary for team

---

### When Teachers Report Issues

**Step 1: Acknowledge (within 30 min)**
- Thank them for reporting
- Confirm we received the message
- Give rough ETA for response

**Step 2: Diagnose (within 1-2 hours)**
- Ask clarifying questions if needed
- Check if it's a known issue
- Try to reproduce on your end
- Check logs if available

**Step 3: Respond (within 4 hours)**
- **If known issue**: Provide workaround + ETA
- **If question**: Answer with link to FAQ or explanation
- **If bug**: Confirm we're investigating, ETA for fix
- **If critical**: Escalate immediately + provide phone number

**Step 4: Follow Up**
- If fix deployed: "Issue should be resolved. Please try again and let us know."
- If waiting on fix: Daily updates on progress
- After 24 hours: "We're still investigating. Will update you by [date]."

---

### Escalation Path for Critical Issues

**IF**: Data loss, security breach, or complete service outage

**THEN**:
1. Immediately notify: [Tech Lead Name] + [Project Lead Name]
2. Severity assessment: <5 min discussion
3. Emergency response: Deploy fix or rollback within 30 min
4. Teacher notification: Phone call + email within 1 hour
5. Post-mortem: Within 24 hours of resolution

---

## ISSUE LOG TEMPLATE

Create a shared spreadsheet or document with this structure:

| Date | Teacher | Issue | Category | Severity | Status | Workaround | ETA | Resolved |
|------|---------|-------|----------|----------|--------|-----------|-----|----------|
| 3/31 | [Name] | Game won't load | Bug | Medium | Investigating | Clear cache | 4/1 | [Date if done] |
| 3/31 | [Name] | Demo students not showing | Question | Low | Answered | Refresh browser | N/A | ✓ |

---

## COMMUNICATION TEMPLATES

### Initial Response (Fast/Known Issue)
```
Hi [Teacher Name],

Thanks for reporting this! We're aware of [issue] and have a workaround:

[Workaround steps]

If that doesn't work, let me know and we'll dig deeper.

Best,
[Support Person]
```

### Investigation Response
```
Hi [Teacher Name],

Thanks for the detailed report. We're investigating [issue] and should have an update for you by [date].

In the meantime, [workaround if available / We'll keep you posted].

I'll follow up with you by [time/date].

Best,
[Support Person]
```

### Fix Deployed Response
```
Hi [Teacher Name],

Good news! We've deployed a fix for [issue]. Can you try again and let me know if it's working?

[Instructions to clear cache if needed]

Thanks for your patience!

[Support Person]
```

---

## SUCCESS METRICS FOR SUPPORT

| Metric | Target | Notes |
|--------|--------|-------|
| Email response time | <4 hours | During business hours |
| Issue resolution rate | >80% by day 3 | Critical bugs <1 day |
| Teacher satisfaction with support | >8/10 | Asked in final survey |
| Critical bugs during testing | <3 | Anything breaking platform usage |
| Teacher retention (complete testing) | >80% | Should complete 2-3 weeks |
| Support ticket volume | <5/day | Expected: 2-3 per teacher |

---

## THINGS TO MONITOR (Red Flags)

### 🚨 STOP & ESCALATE IMMEDIATELY
- Multiple teachers reporting same critical bug
- Data loss or corruption reported
- Security concern / unauthorized access
- Platform completely unavailable (>30 min)
- Teacher unable to complete basic workflow

### ⚠️ PLAN FIX TODAY
- Teacher can't access assigned student
- Recommendation engine returning bad advice
- Game features not working for multiple teachers
- Evidence not saving / data lost
- Mobile experience broken

### 📋 LOG & MONITOR
- Single teacher reporting minor bug (may be user error)
- Slow performance on some networks
- Non-essential feature request
- Questions about expected behavior
- Accessibility issue on specific browser

---

## CONTACT SHEET

Print and keep handy:

```
CORNERSTONE MTSS - TESTING SUPPORT CONTACTS

PRIMARY SUPPORT:
  Email: cornerstone-mtss-support@[domain].com
  Response: <4 hours business hours

PRODUCT LEAD:
  Name: [X]
  Phone: [X]
  For: Critical issues, feature questions, product decisions

TECH LEAD:
  Name: [X]
  Phone: [X]
  For: Critical bugs, data issues, system outages

PROJECT LEAD:
  Name: [X]
  Phone: [X]
  For: Overall strategy, teacher feedback escalation

OFFICE HOURS:
  Tuesday 4-5pm (Zoom link in welcome email)
  Thursday 4-5pm (Zoom link in welcome email)
```

---

## PRE-LAUNCH CHECKLIST

- [ ] Support email alias created and monitored
- [ ] Support team trained on playbook
- [ ] Slack channel created (if using)
- [ ] Office hours scheduled and communicated
- [ ] FAQ document finalized and linked
- [ ] Known issues documented with workarounds
- [ ] Issue log template created and shared
- [ ] Communication templates customized
- [ ] Emergency escalation contacts confirmed
- [ ] Contact sheet printed/shared with team

---

**Status**: Ready to deploy

**Next Step**: Customize contact info and deploy when teachers are recruited (March 24-25)

