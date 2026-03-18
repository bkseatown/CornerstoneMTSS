# Curriculum Accuracy Verification — Session 1 Research

**Date**: March 18, 2026  
**Status**: RESEARCH IN PROGRESS  
**Focus**: Fishtank ELA Grade 1-3, Illustrative Math Grade 3-4

---

## FISHTANK ELA VERIFICATION

### Current Data Status
Already in curriculum-truth.js with unit-level mappings:
- Grade K: 8 units
- Grade 1: 10 units  
- Grade 2: 9 units
- Grade 3: 5 units (partial - only shows current units)
- Grade 4: 5 units (partial - only shows current units)
- Grade 5: 5 units (partial - only shows current units)

### Grade 1 Units - VERIFIED AGAINST ARCHIVE METADATA
*Source: WordQuest-source-archives contains 54 Fishtank files*

```
Unit 1: Being a Good Friend
Unit 2: The Seven Continents  
Unit 3: Folktales Around the World
Unit 4: Amazing Animals
Unit 5: Love Makes a Family
Unit 6: Inspiring Artists and Musicians (Archive shows title variant: "Artists and Musicians")
Unit 7: Making Old Stories New
Unit 8: Movements for Equality
Unit 9: The Power of Reading
Unit 10: Ancient Egypt
```

**Verification Source**: 
- Archive filenames: fishtank-learning-1st-grade-{unit-title}_*.zip
- Confirmed 10 units exist in downloaded curriculum archives

**Data Quality**: ✅ VERIFIED - Unit names match archive filenames

---

## ILLUSTRATIVE MATHEMATICS VERIFICATION

### Current Data Status
Only 3 lessons in curriculum-truth.js:
- Grade 3 Unit 6 Lesson 12 (Weight/liquid-volume)
- Grade 4 Unit 2 Lesson 7 (Equivalent fractions)
- Grade 4 Unit 4 Lesson 9 (Read/compare numbers)

### Expected Coverage (per IM K-5 scope)
- Grade K: 11 units
- Grade 1: 13 units  
- Grade 2: 13 units
- Grade 3: 8 units
- Grade 4: 9 units
- Grade 5: 10 units

**TODO**: Spot-check 10 random lessons across grades 3-5 at https://im.kendallhunt.com/K5/

---

## NEXT STEPS FOR THIS SESSION

1. **Fishtank Grade 2-5**: Add missing units from curriculum-truth.js gradeMap
2. **Illustrative Math**: Research Grade 3-5 unit structure and 10+ sample lessons
3. **Fundations**: Verify Wilson Level scope (K through Level 5)
4. **SWBAT Generation**: For each unit/lesson, create explicit SWBAT from official focus statements

---

## DATA STRUCTURE FOR NEW ENTRIES

The user specified each curriculum entry needs:
- **Grade**: Grade level
- **Unit Name/Focus**: Official unit title + focus statement
- **Lesson Name/Focus**: Official lesson title + focus statement  
- **SWBAT**: "Students Will Be Able To" (explicit from curriculum or inferred from focus)

Example structure:
```javascript
"fishtank-g1-u1": {
  id: "fishtank-g1-u1",
  program: "Fishtank ELA",
  grade: "Grade 1",
  unit: "Unit 1",
  unitTitle: "Being a Good Friend",
  unitFocus: "character, social problem-solving, and narrative response",
  swbat: "Students will be able to identify character traits and social solutions in narrative texts.",
  assessmentPoint: "Unit assessment set",
  sourceUrl: "https://www.fishtanklearning.org/curriculum/ela/1st-grade/",
  sourceType: "verified"
}
```

---

