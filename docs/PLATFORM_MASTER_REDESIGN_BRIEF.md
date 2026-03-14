# Cornerstone MTSS Master Redesign Brief

This document defines the highest-value creative and product-design direction for turning Cornerstone MTSS into a professional, premium, flagship-quality platform.

It is intended to guide:
- future Codex threads
- visual design passes
- frontend polish work
- interaction and motion decisions
- future Figma exploration or production design work

Read with:
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/HANDOVER.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PLATFORM_DESIGN_SYSTEM.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PLATFORM_EXCELLENCE_PLAYBOOK.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PLATFORM_LAYOUT_OWNERS.md`

## 1) Product Ambition
Cornerstone MTSS should feel like a premium educational product, not a school admin dashboard with games attached.

The finished platform should feel:
- high-trust
- visually authored
- calm but modern
- academically credible
- emotionally warm
- playful in the right places
- sophisticated enough to stand beside elite consumer learning products

The core product model is:
- platform shell for specialists
- flagship game experiences for learners
- one shared product language
- distinct identities inside that system

## 2) Big Design Decision
Do not chase quality by redesigning every page at once.

The right move is:
1. define one strong platform design language
2. build three flagship game runtimes inside it
3. unify the surrounding routes after the flagship quality bar is real

Those three flagship anchors should be:
- Word Quest as the fluency and pattern-recognition flagship
- Word Clue as the speaking and small-group flagship
- Typing Quest as the skills-course flagship

This is the fastest route to a product that feels intentional rather than broadly “improved.”

## 3) Creative Direction

### Desired feel
The platform should combine:
- premium specialist workspace
- cinematic game presentation
- elegant academic restraint
- modern interaction polish

The experience should avoid:
- generic SaaS dashboard sameness
- flat utility panels with weak hierarchy
- childlike classroom clip-art energy
- noisy gamification clutter
- translucent overlays that weaken the primary artifact

### Creative reference qualities
Aim for these qualities rather than copying any single product:
- strong editorial framing
- cinematic product staging
- purposeful depth and lighting
- tactile interactions
- high-scanning readability
- polished onboarding and success states

## 4) Visual Language

### Surface system
Use a clear surface hierarchy:
- `canvas`: atmospheric page background
- `shell`: page-level structural frame
- `panel`: primary teacher workspace
- `card`: concise, actionable information
- `stage`: immersive game or focal object container
- `inset`: secondary tool or detail area

Professional feel comes from strong separation between these layers.

Rules:
- the page background should have atmosphere, not flat emptiness
- panels should feel grounded and intentional
- stages should feel special and slightly more dramatic
- secondary surfaces should never compete with the focal object

### Depth and lighting
Use depth with control:
- soft layered gradients
- restrained edge highlights
- more believable elevation
- richer shadow discipline
- subtle atmospheric backdrops

Avoid:
- muddy transparent boxes
- giant shadows
- frosted-glass effects everywhere
- multiple same-weight cards floating with no composition

### Shape language
The platform should use:
- confident rounded corners
- clean geometric framing
- occasional asymmetric crop or inset treatment
- subtle internal bevel or rim-light behavior on premium surfaces

This creates professionalism without looking corporate-generic.

## 5) Typography Direction

### Type strategy
Use one expressive display voice and one highly readable interface voice.

The system should clearly separate:
- display titles
- section titles
- support copy
- metadata
- control labels

### Typography goals
- stronger headline presence on hero and game surfaces
- fewer total words on most screens
- tighter copywriting and less explanatory text
- better scan paths for teacher workflows
- more confidence and clarity in game titles and score surfaces

### Quality rules
- body text must remain easy to read at teacher distance
- support copy should be compact and calm
- labels should not shout
- avoid decorative typography in dense workflow areas
- every screen should scan in under three seconds

## 6) Color Strategy

### Brand behavior
The platform should have one shared neutral and support palette, plus distinct accent identities for each flagship game.

Recommended model:
- sophisticated warm-neutral shell colors
- premium ink/readability colors
- one shared success/warning/error language
- one accent family per flagship experience

Suggested accent direction:
- Word Quest: ember, gold, deep slate, electric mint accents
- Word Clue: cobalt, soft coral, paper cream, audio-reactive highlights
- Typing Quest: marine blue, neon lime, graphite, focused signal tones

### Color rules
- use high contrast where reading or interaction matters
- reserve strongest chroma for focal states and success moments
- teacher routes should feel controlled and high-trust
- game routes can be more saturated, but never chaotic

## 7) Motion System

### Motion philosophy
Motion should explain change, guide attention, and reward success.
It should not exist just to prove the page is modern.

### Motion families to use
- page-enter fades with slight vertical drift
- staggered dashboard reveals
- shared-element transitions where a preview becomes the live play surface
- state-change pulses on key objects only
- spring-based expand/collapse for secondary panels
- short success bloom effects on achievements, streaks, or checkpoints
- subtle parallax or atmospheric drift on selected hero/game backgrounds

### Motion families to avoid
- constant floating idle animation on everything
- large, slow page choreography
- bouncing interactions in serious specialist workflows
- decorative confetti for routine actions
- motion that causes layout reflow

### Product-specific motion tone
- teacher tools: restrained, quiet, confidence-building
- homepage/gallery: welcoming, premium, staged
- games: expressive, tactile, rewarding

### Reduced motion
Every motion concept must degrade cleanly for reduced-motion users:
- no required motion for comprehension
- no looping animation needed to understand state
- no hidden information revealed only through motion

## 8) Illustration Direction

### Illustration role
Illustration should create emotional coherence, not fill space.

Use illustration for:
- homepage hero scenes
- empty states
- category or game banners
- onboarding moments
- milestone and celebration states

Do not let illustration dominate:
- dense teacher workflows
- reports where data clarity matters
- core gameplay interactions

### Recommended art direction
Best-fit direction for Cornerstone:
- editorial geometric illustration for platform surfaces
- richer immersive scene art for game intros and milestone moments
- premium vector or semi-3D treatment with controlled lighting and depth

Avoid:
- random stock vector libraries
- inconsistent icon/illustration styles
- childish mascot-heavy branding
- busy educational poster energy

### Illustration system rules
- one consistent line/shape logic
- one consistent shadow and highlight treatment
- a limited set of recurring metaphors
- game-specific scenes that still belong to the same world

## 9) UX Standards For A Professional Product

### Progressive disclosure
The best version of this platform shows less by default.

Rules:
- only the most relevant action should dominate
- secondary support should stay collapsed until needed
- repeated framing and helper copy should be cut aggressively
- instructional overload should be replaced with clearer structure

### One dominant artifact
Every route must have one unmistakable focal object.

Examples:
- homepage: hero narrative plus one daily action panel
- reports: main insight canvas
- Word Quest: board and keyboard
- Word Clue: clue stage
- Typing Quest: typing lane and path

If multiple modules compete equally, the page will not feel premium.

### Smart defaults
Professional products reduce decision fatigue.

Use:
- recommended next activity
- preselected sensible options
- default collapsed advanced controls
- one-click resume or continue states
- contextual suggestions tied to recent student activity

### Empty, loading, and success states
These states should feel designed, not incidental.

Each should have:
- clear purpose
- beautiful hierarchy
- one next action
- emotional tone appropriate to the route

## 10) Industry-Leading Features Worth Building

### Specialist workspace intelligence
Add:
- priority cards driven by recent student activity
- recommended next-step launch actions
- simple intervention summaries
- change-since-last-session callouts
- student attention alerts

### World-class reports
Add:
- mastery heatmaps
- progress arcs
- skill cluster summaries
- confidence bands
- session snapshots
- plain-language “what changed” summaries

### Premium session builder
Add:
- drag-to-build session planning
- recommended intervention sequences
- time-budgeted session templates
- quick launch to game or activity
- saved routines by student need

### Cross-game progression layer
Add:
- shared mastery map across flagship games
- consistent goal and streak logic
- cross-game skill clusters
- learner growth milestones

This is one of the strongest long-term differentiators for the platform.

## 11) Page-By-Page Redesign Priorities

### Homepage
Needs to become a staged product entry, not a list of modules.

Upgrade goals:
- one cinematic top surface
- one clear daily action zone
- stronger game/gallery preview language
- fewer same-weight cards
- better contrast and depth

### Reports
Should feel executive-grade and fast to scan.

Upgrade goals:
- stronger headline insight
- cleaner metric grouping
- more visual storytelling through charts and summaries
- better hierarchy between primary and secondary data

### Student profile
Should feel like a premium learner dossier.

Upgrade goals:
- clearer growth story
- stronger intervention context
- better balance between academic seriousness and warmth

### Shared game shell
Should feel like one curated premium arcade for literacy and language intervention.

Upgrade goals:
- stronger feature staging
- more immersive previews
- clearer game personalities
- more elegant transition into runtime play

## 12) Flagship Game Direction

### Word Quest
Role:
- fluency and pattern-recognition flagship

Should feel:
- tactile
- focused
- fast
- elegant
- satisfying

Must emphasize:
- board and keyboard as the dominant objects
- clean fit at laptop height
- strong input clarity
- subtle but rich scoring and streak feedback

Upgrade ideas:
- slightly smaller tile footprint for breathing room
- slightly larger, more tactile keys
- richer valid-state glow and press behavior
- cleaner score celebration and streak feedback
- one atmospheric play backdrop behind the stage

### Word Clue
Role:
- speaking and small-group flagship

Should feel:
- theatrical
- social
- focused
- high-trust

Must emphasize:
- one dominant clue stage
- strong reveal pacing
- clearer participant states
- audio/listening affordances with premium visual feedback

Upgrade ideas:
- cinematic clue-card reveal
- better turn-taking and prompt visualization
- less repeated framing around the runtime
- more premium voice/listening treatment

### Typing Quest
Role:
- skill-course flagship

Should feel:
- aspirational
- precise
- motivating
- mastery-driven

Must emphasize:
- one strong typing arena
- visible course progression
- premium lesson-path presentation
- cleaner start-state ownership

Upgrade ideas:
- immersive path map
- refined lesson preview cards
- stronger milestone visuals
- less “course document,” more “training product”

## 13) Recommended Tooling And Workflow

### Design workflow
Best-practice stack:
- Figma variables for tokens and modes
- component variants with clear property logic
- prototype flows for high-value motion
- screenshot references and visual audits at laptop sizes

### Frontend workflow
Implementation should use:
- CSS variables as the source of truth
- route-scoped layout ownership
- minimal JS for motion unless interaction requires it
- Playwright validation for real layout checks
- versioned assets and cache-busted verification

### Motion and illustration tooling
Use selectively:
- CSS transitions and keyframes for most UI motion
- canvas or lightweight particle effects for game success states
- Rive or Lottie only for high-value onboarding, mascot, or milestone moments

Do not turn motion tooling into a dependency-driven styling shortcut.

## 14) Rollout Order

### Phase 1: Design-language lock
- finalize shell mood, type pairing, color structure, surface depth rules, and motion principles

### Phase 2: Shared shell upgrade
- homepage top surface
- game gallery
- reports high-level framing

### Phase 3: Flagship runtime polish
- Word Quest first
- Word Clue second
- Typing Quest third

### Phase 4: Platform unification
- align student profile, reports, shared components, and route transitions to the flagship quality bar

### Phase 5: Advanced polish
- illustration rollout
- richer milestone states
- cross-game progression layer
- premium onboarding and empty-state system

## 15) Hard Rules
- Do not add more UI chrome when clarity is the real problem.
- Do not use motion to hide weak hierarchy.
- Do not use illustration as filler.
- Do not let support tools crowd the main learning object.
- Do not let every page become a dashboard.
- Do not unify the platform by making every route look the same.

## 16) Immediate Next Recommendation
The best next move is not a broad redesign.

The best next move is:
1. lock the premium visual direction for the shell
2. complete a controlled Word Quest polish pass from the current stable baseline
3. then redesign Word Clue into a true flagship runtime composition

That order gives the platform a real showpiece quickly and reduces regression risk.
