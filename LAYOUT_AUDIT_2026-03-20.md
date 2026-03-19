# Cornerstone MTSS — Layout & Formatting Audit
**Date:** March 20, 2026  
**Status:** Comprehensive visual and structural review

---

## MAJOR ISSUES IDENTIFIED

### 1. **DUPLICATE BANNER HEADINGS** (Critical)
Multiple pages have stacked heading/kicker combinations that create visual clutter:

#### reports.html
- "REPORTS & PREP" (kicker) → "Open a student. Then build the output." (heading)
- "STEP 1 · PICK A STUDENT" (kicker) → "Start with a student." (heading)  
- "STEP 2 · CHOOSE THE OUTPUT" (kicker) → "Choose the output." (heading)
- "STEP 3 · SEND OR SHARE" (kicker) → "Prepare the update before you send it." (heading)
- **Pattern:** Repeated kicker + heading pairs feel redundant and reduce clarity

#### teacher-hub-v2.html
- "DAY OVERVIEW" (kicker) → "What changes today" (heading)
- "CALENDAR HIGHLIGHTS" (kicker) → "Announcements and exceptions" (heading)
- "CLASS LESSON MAP" (kicker) → [section description]
- **Issue:** Section headers are preceded by label/kickers instead of being self-contained

### 2. **SIDEBAR SCROLLING (Layout)**
- **teacher-hub-v2.html**: "TODAY'S SCHEDULE" list scrolls unnecessarily in a cramped container
- `.th2-list` has `overflow-y: auto` with `flex: 1` + `min-height: 0`
- Sidebar height constraint forces small schedule list into scrollable area
- **Impact:** Users expect full day schedule to be visible at once

### 3. **SPACING & PADDING ISSUES**
- Cards and sections have adequate padding but could be more consistent
- Some sections have 12px margins that don't align with 8px/16px token system
- "Pilot Evaluation" section at bottom of reports.html feels isolated

### 4. **TEXT HIERARCHY ISSUES**
- Too many kickers (small caps labels) before headings creates noise
- Heading levels inconsistent across pages (multiple H2s without H1 context)
- Small caps kickers (REPORTS & PREP, STEP 1, etc.) take visual priority over actual headings

---

## PAGE-BY-PAGE ASSESSMENT

### ✅ index.html (Landing/Dashboard)
**Status:** GOOD
- Clean heading hierarchy
- Proper spacing
- No duplicate headers
- Good card layout

### ⚠️ teacher-hub-v2.html (Specialist Hub)
**Status:** NEEDS WORK
- Multiple stacked section labels (DAY OVERVIEW, CALENDAR HIGHLIGHTS, CLASS LESSON MAP)
- Schedule sidebar forced to scroll
- Consider collapsing kickers into headings or removing redundant labels

### ⚠️ reports.html (Reports & Prep)
**Status:** NEEDS WORK  
- **Most problematic page** — has 4 major "double heading" instances
- STEP 1/2/3 kickers redundant with following headings
- Consider merging kickers into headings or using single heading approach

### ✅ student-profile.html
**Status:** ACCEPTABLE
- Clear card-based layout
- Good spacing
- Section labels (CASE MANAGEMENT, STUDENT, etc.) work as context

### ✅ game-platform.html
**Status:** GOOD
- Clean card grid
- Proper spacing
- No layout issues

### ✅ word-quest.html
**Status:** GOOD
- Game UI polished
- Welcome modal clear
- No layout issues

---

## RECOMMENDATIONS

### Tier 1: Critical Fixes
1. **Eliminate redundant heading patterns** in reports.html
   - Remove kicker labels OR convert them to section context labels (not headings)
   - Option A: Use single strong heading per section
   - Option B: Keep kicker as subtle label but don't add a second heading

2. **Fix schedule scrolling** in teacher-hub-v2.html
   - Remove height constraint on `.th2-list`
   - Let schedule list size naturally to its content
   - Or increase sidebar height allocation

### Tier 2: Consistency
3. **Standardize heading hierarchy**
   - All major sections start with H2 (no double kicker+heading)
   - Use consistent spacing/padding (8px/16px tokens)

4. **Review kicker/label strategy**
   - Decide: Are small-caps labels needed or just noise?
   - If keeping: they should not be immediately followed by another heading

### Tier 3: Polish
5. **Text hierarchy refinement**
   - Ensure primary action is visually clear
   - Reduce kicker visual weight if keeping them

---

## IMPLEMENTATION PRIORITY

**High Impact, Low Effort:**
1. Merge STEP 1/2/3 kickers with their headings in reports.html
2. Remove schedule scrolling constraint in hub sidebar

**Medium Impact:**
3. Streamline section headers across all pages
4. Ensure consistent spacing on cards and sections

