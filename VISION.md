# WordQuest - Unified Vision and Design Constitution

## 1. Core Identity

WordQuest is not a Wordle clone.

It is a structured literacy engine wrapped in an interactive quest experience.

It exists to combine:
- Evidence-based structured literacy
- Multi-sensory engagement
- Modern, polished UX
- Teacher-grade reliability
- Student-driven joy and choice

WordQuest should feel:
Structured. Intentional. Evidence-based. Alive. Premium. Expandable.

Not chaotic. Not gimmicky. Not theme-driven chaos.

---

## 2. Educational Foundation

WordQuest is grounded in:
- Science of Reading principles
- Structured literacy
- Explicit sound-symbol mapping
- Syllable awareness
- Morphological awareness
- Gradual release of responsibility
- Immediate corrective feedback
- Multi-modal reinforcement (see, hear, say, type)

The interface must subtly signal structure:
- Word segmentation
- Vowel prominence
- Orthographic awareness
- Morphological clarity
- Phoneme sensitivity

Without explicitly labeling it as "Science of Reading."

---

## 3. Experience Philosophy

WordQuest balances two forces:

1. Structure
- Clear layout
- Consistent hierarchy
- Predictable interaction
- Accessible contrast

2. Joy
- Micro-animations
- Celebration moments
- Theme personalization
- Music options

The experience must always prioritize clarity over decoration.

Fun enhances learning. It never replaces it.

---

## 4. Brand Language and WordMark

Primary format:

Word·Quest

The interpunct (·) subtly signals syllable division.

Visual rules:
- Consonants: deep navy
- Vowels: subtle teal accent (never red)
- Interpunct: same teal accent
- Clean humanist sans-serif
- Slight tracking (0.02em)
- No cartoon styling
- No worksheet beige overload

The goal:

Structured literacy, digitally elevated.

---

## 5. Visual System Architecture

### Token-Based System (Non-Negotiable)

All visual colors must use CSS variables.

No hardcoded hex values in components.

Base tokens (stable across themes):
- --base-bg
- --card-cream
- --text-primary
- --text-secondary
- --success-default
- --present-default
- --absent-default
- --secondary
- --accent
- --theme-success (optional)
- --theme-present (optional)
- --theme-absent (optional)

Themes may NOT:
- Override layout
- Override typography
- Change key shapes
- Modify structural spacing
- Inject decorative clutter

---

## 6. 60-30-10 Visual Rule

All themes must follow:
- 60% neutral base
- 30% structured secondary surface
- 10% accent pop

This prevents monochrome darkness and visual chaos.

Contrast must meet accessibility standards.

---

## 7. Keyboard Design Philosophy

Two modes:

### Default Modern Mode
- Clean
- Subtle hover lift
- Slight bounce press
- Structured depth

### Sound Card Mode (Wilson-inspired but original)
- Cream card base
- Soft drop shadow
- Rounded corners
- Tactile compression on press
- Vowels indicated by subtle accent ring (not dots)

No red vowel highlighting.

No cartoon styling.

---

## 8. Tile and Board Behavior

Tiles must:
- Flip in 3D
- Shift depth on correctness
- Use structured feedback colors

Default feedback:
- Green (correct)
- Gold (present)
- Gray (absent)

Optional themed feedback mode may override green/gold, but must preserve clarity and contrast.

---

## 9. Motion Philosophy

Three modes:

### Fun (Default)
- Key bounce
- Tile pop
- Soft glow pulses
- Star burst
- Confetti (controlled)
- Optional celebration music

### Calm
- Reduced bounce
- Minimal glow
- No confetti

### Reduced
- Essential motion only

Motion must feel alive. Never chaotic.

---

## 10. Audio Philosophy

Audio priority:
1. Recorded human voice (Ava or equivalent)
2. High-quality system voice
3. Word-only fallback

Remove novelty system voices.

Do not expose gimmick voice dropdowns.

Audio must support:
- Pronunciation modeling
- Word meaning reinforcement
- Sentence context

Future direction:
Student voice capture with simple validation feedback.

---

## 11. Architectural Guardrails

Non-negotiable engineering principles:
- No layout overrides in themes
- No inline styling hacks
- Remove dead code instead of layering patches
- No duplicate animation systems
- No duplicate color systems
- All motion centralized
- All tokens centralized
- All modules share base system

AI agents must:
- Read this file before modifying code
- Respect token boundaries
- Refactor instead of stacking

---

## 12. Modular Expansion Vision

WordQuest is the foundation for a larger instructional suite:
- Word Quest (phonics + morphology)
- Read Quest (decodable + comprehension)
- Write Quest (encoding + composition)
- Speak Quest (oral language)
- Listen Quest (auditory processing)
- Math Quest (number sense, fact fluency)

Each module:
- Focused
- Simple
- Structured
- Built on shared token system

---

## 13. Long-Term Goal

WordQuest should become:

A structured literacy operating system for classrooms.

Not just a game.

Not a flashy theme engine.

But a scalable instructional and assessment platform.

---

## 14. Non-Negotiables

- Structure over novelty
- Clarity over decoration
- Pedagogy over gimmicks
- Joy without chaos
- Stable architecture over rapid hacks
- Wilson-inspired discipline without copying proprietary design
- Teal/gold vowel signaling, never red

---

## 15. Implementation Directive

When modifying WordQuest:
- Follow token system
- Preserve structure
- Remove bad code instead of patching
- Do not reinterpret the visual system casually
- Maintain disciplined design hierarchy
- Protect brand integrity

This document is architectural authority for WordQuest.

---

End of Vision Constitution
