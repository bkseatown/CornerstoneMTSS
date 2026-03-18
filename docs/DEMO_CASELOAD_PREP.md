# DEMO CASELOAD PREPARATION

**Status**: READY TO PREPARE
**Date**: March 18, 2026
**Purpose**: Provide realistic student data for teacher testing without using real student PII

---

## DEMO CASELOAD OVERVIEW

Each teacher tester will receive a demo caseload with **5-8 realistic student profiles**. These are fictional students designed to exercise the platform's recommendation engine and features across different competency levels and gap types.

---

## SAMPLE STUDENT PROFILES

### Student 1: Marcus (Grade 2, EMERGING across all areas)

**Demographics**:
- Grade: 2
- Reading Level: Emergent Reader
- Fluency: 35 WCPM (well below grade level)

**Assessment Data** (Sample Scores):
- Letter Knowledge: 38/54 (EMERGING)
- Phonemic Awareness: 12/22 (EMERGING)
- Phonics: 8/20 (EMERGING)
- Fluency: 35 WCPM (EMERGING; grade 2 benchmark ~55-60)
- Comprehension: 3/8 (EMERGING)

**Gaps Identified by System**:
- Primary Gap: Letter/Sound Correspondence
- Secondary: Phonemic Awareness
- Tertiary: Fluency Foundation

**Recommended Interventions**:
- Primary: Intensive Phonics Sequence (high confidence)
- Alternatives: Phonemic Awareness Intensive, Sound-Symbol Mastery

**Teaching Context**:
- Receives 30 min daily small group instruction
- Mixed reading ability classroom (2-3 other EMERGING students)
- Teacher: Bilingual (student's first language is Spanish)

**Story**: Marcus is a second grader new to English who needs foundational phonological awareness and phonics work. Strong candidate for systematic phonics program + daily games.

---

### Student 2: Jasmine (Grade 3, DEVELOPING with fluency focus)

**Demographics**:
- Grade: 3
- Reading Level: Early Fluent
- Fluency: 58 WCPM (below benchmark of 75+)

**Assessment Data**:
- Letter Knowledge: 48/54 (PROFICIENT)
- Phonemic Awareness: 20/22 (PROFICIENT)
- Phonics: 16/20 (DEVELOPING, 90% accuracy)
- Fluency: 58 WCPM (DEVELOPING; grade 3 benchmark 75-85)
- Comprehension: 6/8 (DEVELOPING)

**Gaps Identified**:
- Primary Gap: Reading Fluency
- Secondary: Prosody/Expression
- Tertiary: Comprehension (likely secondary to fluency)

**Recommended Interventions**:
- Primary: Fluency & Automaticity (moderate-high confidence)
- Alternatives: Phonics Review + Fluency, Comprehension Through Fluency

**Teaching Context**:
- Receives 20 min 3x/week intervention
- Can stay for classroom-based fluency work
- Responds well to: partner reading, games, technology
- Strong at: phonics, letter recognition

**Story**: Jasmine has solid decoding skills but reads slowly. A perfect candidate for fluency-focused interventions and rhythm/speed games. Good progress trajectory.

---

### Student 3: DeAndre (Grade 1, EMERGING + behavior factor)

**Demographics**:
- Grade: 1
- Reading Level: Emergent
- Behavior: Often off-task, needs frequent redirects

**Assessment Data**:
- Letter Knowledge: 32/54 (EMERGING)
- Phonemic Awareness: 8/22 (EMERGING)
- Phonics: 5/20 (EMERGING)
- Fluency: Not yet assessed (pre-fluency stage)
- Comprehension: 2/8 (EMERGING)
- Focus Duration: ~8 minutes before needing break

**Gaps Identified**:
- Primary: Phonemic Awareness + Engagement
- Secondary: Letter Knowledge
- Tertiary: Sustained Attention

**Recommended Interventions**:
- Primary: Phonemic Awareness with Movement (high-engagement version)
- Alternatives: Multi-Sensory Phonics, Gamified PA Practice

**Teaching Context**:
- 30 min daily 1:1 instruction (high need)
- Responds to: movement, games, immediate rewards
- Struggles with: sitting still, pencil tasks
- Strong with: oral activities, physical games

**Story**: DeAndre is a first grader with significant foundational gaps who also has attention/engagement challenges. Platform should recommend high-engagement games (Word Quest, Typing Quest) to sustain interest while building skills.

---

### Student 4: Sophia (Grade 4, PROFICIENT with enrichment potential)

**Demographics**:
- Grade: 4
- Reading Level: Independent Reader
- Fluency: 105 WCPM (above benchmark)

**Assessment Data**:
- Letter Knowledge: 54/54 (PROFICIENT)
- Phonemic Awareness: 22/22 (PROFICIENT)
- Phonics: 20/20 (PROFICIENT)
- Fluency: 105 WCPM (PROFICIENT; grade 4 benchmark 85-100)
- Comprehension: 7/8 (PROFICIENT)

**Gaps Identified**:
- Primary: None (all proficient)
- Secondary: Potential for enrichment in higher-level comprehension

**Recommended Interventions**:
- Primary: Enrichment/Advanced Comprehension Strategies
- Alternatives: Vocabulary Expansion, Literary Analysis

**Teaching Context**:
- No need for intervention services (placed for enrichment)
- Interested in: deep reading, chapter books, poetry
- Goal: Advanced literacy skills, confidence

**Story**: Sophia is an advanced reader. Platform should recognize mastery and recommend enrichment rather than remediation. Good case for testing "success plateau" scenarios.

---

### Student 5: Ethan (Grade 5, DEVELOPING multiple areas)

**Demographics**:
- Grade: 5
- Reading Level: Developing Fluent Reader
- Fluency: 72 WCPM (below grade 5 benchmark of 90+)

**Assessment Data**:
- Letter Knowledge: 52/54 (PROFICIENT)
- Phonemic Awareness: 21/22 (PROFICIENT)
- Phonics: 14/20 (DEVELOPING, 70% accuracy)
- Fluency: 72 WCPM (DEVELOPING, inconsistent accuracy)
- Comprehension: 4/8 (DEVELOPING)

**Gaps Identified**:
- Primary: Multi-skill (fluency + accuracy + comprehension)
- Pattern: Decoding breakdown under reading rate pressure

**Recommended Interventions**:
- Primary: Fluency with Accuracy Focus
- Alternatives: Guided Reading Groups, Comprehension-First Reading

**Teaching Context**:
- Receives 30 min 4x/week intervention
- Responds well to: structured guided reading
- Challenges with: timed reading, pressure situations
- Strength: phonemic awareness (foundation solid)

**Story**: Ethan represents the common "mixed picture" student - proficient in some areas but struggling when multiple skills must work together. Great case for testing platform's ability to recommend appropriate combinations.

---

### Student 6 (Optional): Isabella (Grade K, EMERGING awareness)

**Demographics**:
- Grade: K
- Stage: Pre-Reader
- Assessment: EMERGING across all foundational areas

**Assessment Data**:
- Letter Recognition: 12/26 (EMERGING)
- Phonemic Awareness: 3/22 (EMERGING)
- Print Concepts: 6/10 (EMERGING)
- Oral Language: Age-appropriate (no gap)

**Gaps Identified**:
- Primary: Letter Recognition + PA foundation
- Secondary: Print Concepts

**Recommended Interventions**:
- Primary: Alphabet Knowledge + PA Games
- Alternatives: Multi-Sensory Letter Learning, Songs & Movement

**Teaching Context**:
- K classroom (whole group + small group)
- Receives 20 min 3x/week small group
- Responds to: songs, movement, play-based learning
- Strength: oral language, following directions

**Story**: Isabella is a kindergartner needing foundational skills. Good case for testing platform's K-specific features and progress tracking from early stages.

---

## DEMO DATA STRUCTURE

### For Each Student, Provide:

```json
{
  "studentId": "DEMO_[InitialAndNumber]",
  "firstName": "[First Name]",
  "lastName": "[Fictional Last Name]",
  "gradeLevel": "K|1|2|3|4|5|6|7|8|9|10|11|12",
  "school": "Demo School 2026",
  "teacher": "[Teacher Testing Name]",

  "assessmentData": {
    "letterKnowledge": { "score": ##, "outOf": 54, "date": "2026-03-10" },
    "phonemicAwareness": { "score": ##, "outOf": 22, "date": "2026-03-10" },
    "phonics": { "score": ##, "outOf": 20, "date": "2026-03-10" },
    "fluency": { "score": ##, "wcpm": true, "date": "2026-03-10" },
    "comprehension": { "score": ##, "outOf": 8, "date": "2026-03-10" }
  },

  "currentInterventions": [
    {
      "type": "Intensive Phonics | Fluency Focus | etc",
      "frequency": "3x/week",
      "duration": "20-30 minutes",
      "startDate": "2026-02-15"
    }
  ],

  "notes": "Marcus is a bilingual second grader new to English...",
  "demoNotes": "Tests the primary recommendation engine with EMERGING student. Expect Intensive Phonics recommendation."
}
```

---

## IMPLEMENTATION CHECKLIST

### Data Entry
- [ ] Create student profiles in platform (5-8 per teacher)
- [ ] Enter assessment scores manually or via import
- [ ] Add current intervention history
- [ ] Add teacher notes for context

### Verification
- [ ] Each student appears in teacher's caseload
- [ ] Assessment data displays correctly in student profile
- [ ] Recommendations generate for each student
- [ ] Recommendations align with assessment profile
- [ ] Alternative recommendations show appropriately

### Teacher Prep
- [ ] Print or email student roster to teachers
- [ ] Include brief background for each student
- [ ] Suggest 1-2 features to try with each student
- [ ] Encourage teachers to log evidence during testing

---

## DEMO CASELOAD DISTRIBUTION

### By Teacher:
- **Cohort 1 (teachers 1-5)**: Each gets all 6 students (common baseline for comparison)
- **Cohort 2 (teachers 6-10)**: Each gets 5 students (reduces redundancy if larger cohort)

### Advantages of Common Baseline:
- All teachers see same recommendations (easier to compare feedback)
- Can discuss specific students in group debrief calls
- Reduces variation in recommendation feedback

### Alternative: Unique Caseloads
- Each teacher gets different 5-8 students
- Broader coverage of edge cases
- Fewer teachers discussing same students

**Recommendation**: Start with common baseline for cohort 1, consider unique for cohort 2

---

## STUDENT PROFILE TEMPLATE

Use this template to document each demo student for easy reference:

```
STUDENT PROFILE: [NAME]
─────────────────────────────────────────

Grade Level: [X]
Reading Level: [Emergent | Early Fluent | Fluent | Independent]
Primary Gap: [Specific Gap]

ASSESSMENT SNAPSHOT:
  Letter Knowledge:  [X]/54 (EMERGING | DEVELOPING | PROFICIENT)
  Phonemic Awareness: [X]/22 (...)
  Phonics:           [X]/20 (...)
  Fluency:           [X] WCPM (...)
  Comprehension:     [X]/8 (...)

TEACHING CONTEXT:
  Intervention Frequency: [X times/week]
  Duration per session: [X minutes]
  Classroom setup: [Description]
  Responds well to: [List]
  Challenges: [List]

PRIMARY RECOMMENDATION:
  [Intervention Type] - High Confidence

ALTERNATIVES:
  [Alt 1] - Medium Confidence
  [Alt 2] - Lower Confidence

WHY THIS STUDENT:
[2-3 sentences explaining what this student tests]

NOTES FOR TEACHER:
[Any specific things to watch for or try]
```

---

## NEXT STEPS

1. **Choose caseload size**: 5 vs 6 students per teacher?
2. **Enter data**: Create student profiles in platform
3. **Test recommendations**: Verify each student generates appropriate recommendations
4. **Print materials**: Create student roster + brief bios for each teacher
5. **Share with teachers**: Include in welcome packet before testing starts

---

## EXPECTED OUTCOMES

After setting up demo caseload, each teacher tester will be able to:

✅ Log into platform and see realistic caseload
✅ View student assessments and current performance
✅ See AI recommendations for each student
✅ Explore alternative recommendations
✅ Practice logging evidence with sample students
✅ Test features without risk to real student data
✅ Provide feedback based on realistic scenarios

---

**Status**: Ready to prepare upon teacher cohort confirmation

**Timeline**: Complete demo data entry by March 28 (before March 31 launch)

