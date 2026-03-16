# Execution Blueprint: March 16 Continuation Pass

This blueprint defines the remaining work needed to turn the current platform from "stabilized and improving" into a cleaner, more intuitive, more specialist-useful daily tool.

It reflects the current verified state:
- landing page now fits the real desktop window more honestly
- the landing Games card now uses a permanent three-row board with color-state progression
- the platform still needs cleaner information hierarchy, stronger visual proof, and less explanatory copy

## Non-Negotiable Constraints

- Key desktop pages must fit at the real working size without unnecessary vertical scroll.
- Screens should feel like tools, not sales pages.
- Show value through visuals, artifacts, states, and useful previews before relying on explanation.
- Remove redundant copy before adding new copy.
- Avoid raw standards codes or internal language on first-glance surfaces.
- If a visual fix is claimed, it must be verified in a real rendered screenshot.

## Current Highest-Value Gaps

### 1. Landing still needs polish, not more structure changes

Current truth:
- fit is substantially better
- the top tone is more neutral
- the Games preview is closer to a real classroom artifact

Still needed:
- tighten the landing header into a true working header
- keep only the facts that help a specialist decide what to open
- improve the Hub preview so it demonstrates support moves more visually
- make Workspace preview show useful continuity without feeling dead or oversized
- remove remaining dead landing-only CSS selectors from previous preview experiments

Acceptance bar:
- no coaching or pitch language
- first screen reads in under 3 seconds
- each door shows what it does visually
- no visual overlap
- no unnecessary desktop scroll at real working size

### 2. Hub preview and Hub page should show support, not just describe it

Current truth:
- the Hub is one of the strongest product surfaces
- support language is more trustworthy than before

Still needed:
- convert the key lesson support move into a visual mini-artifact
- for math, show fraction strips / number line / area model style snippets
- for reading, show chunking / prompt / second-read cue
- for writing, show sentence frame / evidence stack / revision move
- carry the same "show the move" principle into the real Hub where appropriate

Acceptance bar:
- the user can understand the support move from the artifact without reading a paragraph
- the artifact feels teacher-useful, not decorative
- the page still fits and stays visually calm

### 3. Reports still needs a decision-first reduction pass

Current truth:
- Reports is materially improved
- workflow actions are more grounded than before

Still needed:
- reduce first-load split attention
- make the primary next move visually dominant
- compress secondary queues and tools
- reduce wording and internal/process language
- keep evidence visible without flooding the screen

Acceptance bar:
- a specialist can tell where to start in one glance
- the page feels lighter than the current multi-column planning cockpit
- labels match real actions

### 4. Cross-page code cleanup is still incomplete

Current truth:
- some old landing-only chrome and layout logic has already been removed
- there are still stale rules and legacy branches across landing and likely across other shared surfaces

Still needed:
- remove dead landing-only selectors left from retired preview patterns
- audit Hub and Reports for hidden old strips, duplicate heading systems, and unused shell behaviors
- prefer deleting unused layers over piling on overrides

Acceptance bar:
- fewer duplicate selectors and layout overrides
- fewer route-specific hacks
- no old hidden structures still shaping layout by accident

## Execution Order

### Pass 1: Finish landing polish
- keep header factual and quiet
- turn Hub preview into a stronger visual support surface
- keep Games preview permanent-board behavior
- make Workspace preview read as active, not empty
- remove dead landing CSS after visual state is locked

### Pass 2: Add visual support cards
- start with the landing Hub preview
- then add the same support-card logic to the real Hub / lesson brief surfaces where useful
- use curriculum-specific examples:
  - math: fraction strips, area model, number line
  - reading: chunk / blend / re-read
  - writing: claim / evidence / explain

### Pass 3: Reports reduction
- simplify first visible screen
- increase one dominant next move
- compress queue and tools
- remove redundant labels and explanatory copy

### Pass 4: Cross-page cleanup and verification
- remove stale CSS/markup branches
- verify landing, Hub, student profile, Reports, and gallery again with screenshots
- confirm the one-screen rule at real desktop conditions

## Verification Matrix

Every pass should verify:
- `index.html`
- `teacher-hub-v2.html`
- `reports.html`
- `student-profile.html`

Core checks:
- no overlap
- no cropped bottom controls
- no fake-smart or stale labels
- correct cache-busted asset load
- screenshot verification at desktop working size

## “Done” Definition For This Phase

This phase is done when:
- landing feels like a real working dashboard, not a homepage
- Games, Hub, and Workspace each prove their value visually
- Hub support moves are shown more than explained
- Reports is meaningfully lighter and more decisive
- the remaining legacy layout conflicts are removed, not just hidden
