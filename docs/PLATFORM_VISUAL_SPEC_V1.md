# Cornerstone MTSS Visual Spec v1

This document translates the master redesign brief into concrete visual decisions that can be used for Figma work, frontend implementation, and art direction.

It is the practical companion to:
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PLATFORM_MASTER_REDESIGN_BRIEF.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PLATFORM_DESIGN_SYSTEM.md`
- `/Users/robertwilliamknaus/Desktop/Cornerstone MTSS/docs/PLATFORM_EXCELLENCE_PLAYBOOK.md`

## 1) Visual Positioning
Cornerstone MTSS should read as:
- premium educational platform
- specialist-first workspace
- flagship game ecosystem
- calm, credible, and visually authored

The design target is:
- more premium product than school software
- more cinematic than dashboard-generic
- more disciplined than playful-chaotic

## 2) Typography Pairing

### Primary recommendation
Use:
- `Sora` for display and high-importance headings
- `Inter` for interface, body, controls, metrics, and utility text

Why this pairing:
- `Sora` gives the platform a modern, confident, product-led voice
- `Inter` remains highly legible for dense teacher workflows and gameplay labels
- together they feel more intentional than an all-Inter system without becoming decorative

### Fallback pairing
If `Sora` is not available:
- `Plus Jakarta Sans` for display
- `Inter` for body and UI

### Role map
- Display hero: `Sora` 600
- Page title: `Sora` 600
- Section title: `Sora` 600 or `Inter` 600 depending on density
- Body: `Inter` 400
- Control label: `Inter` 500
- Meta/assistive text: `Inter` 400

### Type scale
Recommended starting scale:
- Hero: `clamp(3rem, 6vw, 5.25rem)`
- Page title: `clamp(2rem, 3vw, 3rem)`
- Section title: `clamp(1.25rem, 1.8vw, 1.75rem)`
- Card title: `1.125rem`
- Body: `0.95rem`
- Helper/meta: `0.82rem`

### Typography rules
- Headings should be short enough to scan immediately
- Body copy should be cut aggressively
- Use sentence case almost everywhere
- Avoid decorative all-caps except restrained micro-labels
- Prefer weight and spacing changes over color-only hierarchy

## 3) Color Architecture

### Platform shell palette
These colors should define the shared platform frame.

- `Canvas Mist`: `#e8edf4`
- `Canvas Steel`: `#dce4ee`
- `Paper Warm`: `#f7f3ec`
- `Panel Ivory`: `#fcfaf6`
- `Panel Cloud`: `#eef3f8`
- `Ink Deep`: `#1a2430`
- `Ink Slate`: `#425466`
- `Ink Soft`: `#6f7c89`

### Interaction palette
- `Action Blue`: `#295fa4`
- `Action Blue Hover`: `#204d87`
- `Focus Halo`: `#8cb8ff`
- `Success Emerald`: `#2f8f6b`
- `Warning Amber`: `#c48a2c`
- `Alert Rose`: `#b85a63`

### Flagship accent families

#### Word Quest
- `Quest Ember`: `#d46b2a`
- `Quest Gold`: `#efb44c`
- `Quest Slate`: `#243247`
- `Quest Mint`: `#85d7c5`

#### Word Clue
- `Clue Cobalt`: `#3768d8`
- `Clue Coral`: `#e17b6a`
- `Clue Paper`: `#f7efe4`
- `Clue Signal`: `#9fd2ff`

#### Typing Quest
- `Typing Marine`: `#18629b`
- `Typing Lime`: `#9dd94d`
- `Typing Graphite`: `#22303f`
- `Typing Ice`: `#9fdcf5`

### Usage rules
- teacher-facing routes should use shell neutrals first and accent colors second
- gameplay routes can use accent-led staging, but semantic states must remain readable
- bright colors should appear in moments of intention, not as full-screen defaults
- each flagship game should feel related, not recolored copies

## 4) Surface Recipes

### Canvas
Use layered atmospheric gradients.

Recommended treatment:
- background gradient from `Canvas Mist` to `Canvas Steel`
- one soft radial wash in a game or route accent
- one subtle noise or texture layer only if performance stays clean

### Shell panel
Use:
- warm light surface
- very subtle border
- soft shadow
- internal highlight

Recommended look:
- premium paper-meets-product surface
- never flat white
- never gray enough to feel dull

### Stage surface
Use:
- darker, richer, mood-setting backdrop
- stronger elevation than standard panels
- slightly deeper radius
- restrained edge light

This is where game identity should live.

### Card surface
Use:
- lighter, concise information framing
- one visual emphasis point
- strong spacing rhythm
- minimal strokes

## 5) Motion Spec

### Timing tokens
Use these timings consistently:
- `motion-xs`: `120ms`
- `motion-sm`: `180ms`
- `motion-md`: `240ms`
- `motion-lg`: `320ms`
- `motion-xl`: `480ms`

### Easing tokens
Use:
- standard: `cubic-bezier(0.22, 0.61, 0.36, 1)`
- emphasized: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- spring-feel substitute: `cubic-bezier(0.16, 1, 0.3, 1)`

### Motion patterns

#### Page intro
- opacity from `0` to `1`
- translateY from `10px` to `0`
- duration `240ms`
- stagger cards by `30ms` to `50ms`

#### Hover lift
- translateY `-2px` to `-4px`
- scale `1.01`
- duration `180ms`

#### Press state
- translateY `1px`
- reduced shadow
- duration `120ms`

#### Panel expansion
- opacity + clip/transform
- duration `240ms`
- emphasized easing

#### Success moment
- target element only
- short glow + scale pulse
- duration `320ms`
- no page-wide celebration unless it is a real milestone

### Motion restrictions
- no animation should be required to understand meaning
- no auto-playing motion loops on dense teacher surfaces
- no more than one “attention-demanding” animation in view at once

## 6) Illustration Spec

### Art direction
Use a hybrid illustration system:
- editorial geometric illustration for platform and dashboard routes
- richer premium scene art for game hero moments

### Style characteristics
- layered vector shapes
- soft depth and light
- crisp edges
- limited but rich color fields
- educational metaphors expressed through objects, paths, signals, and discovery

### Avoid
- school clip-art
- cartoon mascot overload
- over-detailed isometric scene clutter
- mixed icon packs and illustration languages

### Illustration prompts

#### Homepage hero
"Premium educational platform illustration with editorial geometric forms, layered warm neutrals, cool blue environmental gradients, subtle gold accents, specialist workspace energy, literacy and progress metaphors, polished vector depth, clean negative space, modern high-end product marketing style."

#### Word Quest banner art
"Flagship word puzzle game scene with tactile tiles, glowing keyboard signals, ember and gold highlights, deep slate stage backdrop, premium vector or semi-3D illustration, elegant motion-ready composition, focused and sophisticated rather than childish."

#### Word Clue banner art
"Collaborative speaking and clue-solving scene with theatrical card reveal energy, cobalt and coral highlights, paper-like premium surfaces, audio/listening visual cues, refined educational game illustration, cinematic but calm."

#### Typing Quest banner art
"Skill-building typing experience with marine and lime accent lighting, precision training atmosphere, focused path and progression metaphors, premium tech-learning illustration, sleek, motivating, modern."

## 7) Iconography

### Direction
Use one icon system only.

Ideal characteristics:
- slightly rounded geometry
- medium stroke weight
- readable at small sizes
- calm and modern, not playful-cartoon

### Rules
- icons should support scanning, not replace labels
- use filled or duotone accents sparingly
- keep status icons semantically consistent across routes

## 8) Page Makeover Targets

### Homepage
Target composition:
- left: cinematic platform narrative with one strong heading and short support line
- right: “Today” panel with one dominant recommended action and two secondary items
- below: featured flagship shelf, not flat module cards

Must feel:
- leadership-ready
- premium
- welcoming
- fast to understand

### Reports
Target composition:
- top: one main insight summary
- middle: growth and mastery visualization
- lower: detailed breakdowns behind cleaner framing

Must feel:
- executive-grade
- trustworthy
- visually quiet but rich

### Student profile
Target composition:
- profile and context left/top
- current priorities and growth story central
- intervention actions and notes secondary

Must feel:
- personal
- credible
- organized

### Shared game gallery
Target composition:
- immersive featured flagship hero
- curated secondary shelf
- distinct game identities with shared shell framing

Must feel:
- like a premium literacy arcade
- like one designed family

## 9) Flagship Runtime Targets

### Word Quest
Visual target:
- tactile board
- larger-feeling input confidence
- elegant keyboard feedback
- compact but premium top chrome

Immediate polish target:
- slightly reduce tile footprint
- slightly increase key presence
- improve key press depth and valid-state polish
- keep support UI collapsed unless explicitly opened

### Word Clue
Visual target:
- one dramatic clue stage
- premium reveal rhythm
- stronger turn-taking presence
- richer listening and voice feedback states

### Typing Quest
Visual target:
- one clear typing arena
- visible growth path
- less document-like framing
- more aspirational training-product energy

## 10) Frontend Token Mapping

Recommended token additions or refinements:
- display font token separate from body token
- per-flagship accent token groups
- stage-background tokens by game
- success pulse and hover timing tokens
- premium radial/ambient background tokens

Recommended naming model:
- `--font-display`
- `--font-body`
- `--color-shell-canvas`
- `--color-shell-panel`
- `--color-ink-strong`
- `--color-accent-wordquest-*`
- `--color-accent-wordclue-*`
- `--color-accent-typingquest-*`
- `--motion-hover`
- `--motion-success`
- `--easing-standard`
- `--easing-emphasis`

## 11) Build Order

### First
- lock typography pairing
- lock shell palette
- define stage recipes
- define motion tokens

### Second
- redesign homepage top surface and shared gallery framing

### Third
- ship Word Quest controlled premium polish from the current stable baseline

### Fourth
- redesign Word Clue as a theatrical flagship runtime

### Fifth
- redesign Typing Quest as a premium course-and-practice flagship

## 12) Success Criteria
This visual spec is successful when:
- the platform no longer looks like generic dashboard software
- the homepage feels like an authored product entry
- each flagship game feels distinct at a glance
- motion adds confidence rather than clutter
- illustration supports identity without crowding workflows
- teachers can scan major routes quickly at laptop size
