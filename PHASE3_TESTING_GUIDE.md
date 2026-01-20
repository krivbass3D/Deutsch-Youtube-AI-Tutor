# Phase 3 Testing Guide

## 🧪 Complete Testing Instructions for Phase 3

**Implementation Date:** January 20, 2026  
**Testing Framework:** Manual Testing (Browser DevTools)  
**Estimated Testing Time:** 30-45 minutes

---

## Pre-Testing Setup

### Step 1: Clear All Data
```javascript
// Open browser Console and run:
localStorage.clear();
location.reload();
```

### Step 2: Verify progressService Is Loaded
```javascript
// Check if progressService is accessible
console.log('Testing progressService...');
// You should see the service initialized with empty progress
```

---

## Test Suite 1: ExamMode Component

### Test 1.1: Initialization on First Open
**Objective:** Verify lesson progress initializes when entering ExamMode

**Steps:**
1. Open the application
2. Click on any lesson from dashboard
3. Click "Начать экзамен" (Start Exam) button
4. Open DevTools → Application → localStorage → userProgress

**Expected Result:**
```javascript
// localStorage should contain:
{
  "stats": {
    "totalWordsLearned": 0,
    "wordsLearnedThisWeek": 0,
    "totalExerciseAttempts": 0,
    "exerciseAttemptsCorrect": 0,
    "lessonsInProgress": 1,
    "lessonsCompleted": 0
  },
  "lessons": {
    "lesson_id": {
      "status": "in_progress",
      "vocabulary": {
        "word_0": {...},
        "word_1": {...},
        // etc.
      }
    }
  }
}
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 1.2: Word Attempt Recording - Correct Answer
**Objective:** Verify correct word answers are recorded

**Steps:**
1. In ExamMode, see a German word
2. Enter the correct translation
3. Click "Проверить" (Check)
4. Check localStorage

**Expected Result:**
- Word should be marked as correct: `correctAttempts: 1`
- Word should show `examPassed: true`
- Dashboard wordsLearnedThisWeek should increase by 1

**Verification:**
```javascript
// In Console:
let progress = JSON.parse(localStorage.getItem('userProgress'));
console.log(progress.stats.wordsLearnedThisWeek); // Should be 1
console.log(progress.lessons[lesson_id].vocabulary.word_0); 
// Should show: {examPassed: true, correctAttempts: 1, ...}
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 1.3: Word Attempt Recording - Wrong Answer
**Objective:** Verify incorrect word answers are recorded but not marked as learned

**Steps:**
1. In ExamMode, see another word
2. Enter an INCORRECT translation
3. Click "Проверить" (Check)
4. Check localStorage

**Expected Result:**
- Word should NOT be marked as learned: `examPassed: false`
- Attempt count should increase: `attempts: 1`
- Dashboard wordsLearnedThisWeek should NOT increase

**Verification:**
```javascript
let progress = JSON.parse(localStorage.getItem('userProgress'));
console.log(progress.lessons[lesson_id].vocabulary.word_1);
// Should show: {examPassed: false, attempts: 1, correctAttempts: 0, ...}
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 1.4: Complete Vocabulary Exam
**Objective:** Verify stats update correctly after completing all words

**Steps:**
1. Complete the entire vocabulary exam (answer all words)
2. Let's say: 8 correct, 2 wrong
3. Check dashboard after finishing

**Expected Result:**
- Dashboard KPI card "Слов выучено за неделю" should show: 8
- Dashboard KPI card "Всего слов выучено" should show: 8
- Weekly stats should update correctly

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test Suite 2: TutorChat Component

### Test 2.1: First Attempt Tracking
**Objective:** Verify first-attempt flag is set when exercise loads

**Steps:**
1. Click "Этап 3: Практика" (Practice)
2. Start the practice exercises
3. TutorChat should load
4. Check first-attempt tracking state

**Expected Result:**
- Exercise is ready to be answered
- First-attempt tracker should be initialized for this exercise
- localStorage shows exercise with `firstAttemptCorrect: false` (initial state)

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 2.2: Correct Answer on First Attempt
**Objective:** Verify exercise is marked as learned when correct on first try

**Steps:**
1. In practice mode, answer an exercise CORRECTLY on first try
2. Send the answer
3. Verify the response
4. Check localStorage

**Expected Result:**
- Exercise should be marked: `firstAttemptCorrect: true`
- Exercise should be marked: `isLearned: true`
- Dashboard accuracy should increase
- localStorage exerciseAttemptsCorrect should increase

**Verification:**
```javascript
let progress = JSON.parse(localStorage.getItem('userProgress'));
let exerciseData = progress.lessons[lesson_id].exercises['exercise_SampleTitle_task_0'];
console.log(exerciseData);
// Should show: {
//   firstAttemptCorrect: true,
//   isLearned: true,
//   correctAttempts: 1,
//   ...
// }
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 2.3: Correct Answer on Second Attempt
**Objective:** Verify exercise updates but not marked as "learned"

**Steps:**
1. Answer an exercise INCORRECTLY on first attempt
2. See correction feedback
3. Send correct answer on second attempt
4. Check localStorage

**Expected Result:**
- Exercise should have: `firstAttemptCorrect: false` (not changed)
- Exercise should have: `attempts: 2`
- Exercise should have: `correctAttempts: 1`
- Exercise should NOT be marked as isLearned
- Dashboard accuracy should increase

**Verification:**
```javascript
let progress = JSON.parse(localStorage.getItem('userProgress'));
let exerciseData = progress.lessons[lesson_id].exercises['exercise_AnotherTitle_task_0'];
console.log(exerciseData.firstAttemptCorrect); // Should be FALSE
console.log(exerciseData.isLearned); // Should be FALSE
console.log(exerciseData.attempts); // Should be 2
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 2.4: Exercise ID Format Verification
**Objective:** Verify exercise IDs follow correct format

**Steps:**
1. Complete several exercises in practice mode
2. Check localStorage exercise IDs

**Expected Format:**
```
exercise_ExerciseTitle_task_0
exercise_ExerciseTitle_task_1
exercise_NextExercise_task_0
```

**Verification:**
```javascript
let progress = JSON.parse(localStorage.getItem('userProgress'));
let exercises = Object.keys(progress.lessons[lesson_id].exercises);
console.log(exercises);
// Should output something like:
// ["exercise_Satz1_task_0", "exercise_Satz1_task_1", ...]
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test Suite 3: GlobalDashboard Component

### Test 3.1: KPI Card 1 - Words Learned This Week
**Objective:** Verify weekly word count displays correctly

**Steps:**
1. Complete vocabulary exam (learned 8 words, for example)
2. Look at dashboard KPI Card 1

**Expected Result:**
- Card shows: "8"
- Label: "слов выучено за неделю"
- Should match vocabulary learning progress

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 3.2: KPI Card 2 - Total Words Learned
**Objective:** Verify total word count persists

**Steps:**
1. After learning words, check dashboard
2. Refresh the page
3. Check again

**Expected Result:**
- Shows total words learned across all time
- Persists after page refresh
- Matches cumulative vocabulary progress

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 3.3: KPI Card 3 - Exercise Accuracy
**Objective:** Verify exercise accuracy percentage calculation

**Steps:**
1. Complete several exercises (mix of correct/incorrect)
2. Check dashboard accuracy percentage
3. Manually calculate: (correct_exercises / total_exercises) * 100

**Expected Result:**
- Dashboard shows correct percentage
- Matches manual calculation
- Color coding: 
  - Green (≥80%): "✅ Отлично!"
  - Yellow (60-79%): "🟡 Хорошо"
  - Red (<60%): "⚠️ Нужна работа"

**Example:**
```
If 10 exercises correct out of 12:
Expected: (10/12) * 100 = 83%
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 3.4: KPI Card 4 - Lessons in Progress
**Objective:** Verify lesson counting

**Steps:**
1. Start 3 different lessons (just open them, no need to complete)
2. Check KPI card 4
3. Complete 1 lesson
4. Check again

**Expected Result:**
- Initially: Shows 3
- After completion: Shows 2 in progress, +1 completed message

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 3.5: Hardest Lesson Identification
**Objective:** Verify lowest-accuracy lesson is identified

**Steps:**
1. Work on multiple lessons with different accuracy levels:
   - Lesson A: 90% accuracy
   - Lesson B: 40% accuracy
   - Lesson C: 75% accuracy
2. Check dashboard "Самый сложный урок" section

**Expected Result:**
- Should show Lesson B (lowest accuracy: 40%)
- Shows accuracy percentage
- Shows progress stats

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 3.6: Best Lesson Identification
**Objective:** Verify highest-accuracy lesson is identified

**Steps:**
1. Check dashboard "Лучший прогресс" section

**Expected Result:**
- Should show Lesson A (highest accuracy: 90%)
- Shows accuracy percentage
- Shows progress stats

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 3.7: Recommendations Algorithm
**Objective:** Verify smart recommendations appear

**Steps:**
1. Complete exercises with low accuracy (<60%)
2. Check dashboard "Методические рекомендации" section

**Expected Recommendations:**
- If accuracy < 60%: Warning to practice more
- If accuracy ≥ 80%: Success message
- If no words learned this week: Suggestion to start

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test Suite 4: Data Persistence

### Test 4.1: localStorage Persistence
**Objective:** Verify data survives page refresh

**Steps:**
1. Complete some exercises
2. Note the stats on dashboard
3. Refresh the page (F5)
4. Check dashboard again

**Expected Result:**
- All stats remain the same
- No data loss
- Progress intact

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 4.2: Multiple Lesson Independence
**Objective:** Verify lessons track separately

**Steps:**
1. Complete Lesson 1 (8/10 exercises correct)
2. Complete Lesson 2 (5/10 exercises correct)
3. Check dashboard

**Expected Result:**
- Lesson 1 shows 80% accuracy
- Lesson 2 shows 50% accuracy
- Dashboard shows separate metrics
- Recommendations based on each lesson

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 4.3: Storage Size Verification
**Objective:** Verify localStorage usage is reasonable

**Steps:**
1. Complete 3-5 full lessons
2. Check localStorage size

**Expected Result:**
- Total storage < 500KB
- Typical usage: 50-100KB for 5 lessons

**Verification:**
```javascript
let progress = localStorage.getItem('userProgress');
console.log('Storage size:', (progress.length / 1024).toFixed(2), 'KB');
// Should be < 500KB
```

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test Suite 5: Edge Cases

### Test 5.1: Clear All Progress
**Objective:** Verify clearing works

**Steps:**
1. Complete some lessons
2. Open Console
3. Run: `localStorage.removeItem('userProgress'); location.reload();`
4. Check dashboard

**Expected Result:**
- All stats reset to 0
- No errors in console
- Dashboard shows empty state

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 5.2: Rapid Answer Submission
**Objective:** Verify system handles quick clicks

**Steps:**
1. In practice mode, rapidly submit multiple answers
2. Check if tracking is accurate

**Expected Result:**
- No data corruption
- All attempts recorded
- Counts are correct

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 5.3: Multiple Browser Tabs
**Objective:** Verify behavior with multiple tabs

**Steps:**
1. Open lesson in Tab 1
2. Open another lesson in Tab 2
3. Complete exercises in both tabs
4. Check dashboard

**Expected Result:**
- Data from both tabs appears in dashboard
- No conflicts or overwrites
- Stats are cumulative

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Test Suite 6: Browser Compatibility

### Test 6.1: Chrome/Edge
**Steps:**
1. Run through all tests above
2. Check console for errors

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 6.2: Firefox
**Steps:**
1. Run through all tests above
2. Check console for errors

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 6.3: Safari
**Steps:**
1. Run through all tests above
2. Check console for errors

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 6.4: Mobile (iOS Safari)
**Steps:**
1. Access app on iPad/iPhone
2. Complete one lesson
3. Check dashboard displays correctly

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

### Test 6.5: Mobile (Android Chrome)
**Steps:**
1. Access app on Android device
2. Complete one lesson
3. Check dashboard displays correctly

**Pass/Fail:** ☐ PASS / ☐ FAIL

---

## Summary Report

### Tests Passed: _____ / _____
### Tests Failed: _____ / _____
### Pass Rate: _____% 

### Critical Issues Found:
```
(List any blocking issues)
```

### Minor Issues Found:
```
(List non-blocking issues)
```

### Notes:
```
(Additional observations)
```

---

## Sign-Off

**Tested By:** _________________  
**Date Tested:** ________________  
**Status:** ☐ Ready for Deployment / ☐ Needs Fixes  

**Approval:** 
- [ ] Code Review Approved
- [ ] Functionality Verified
- [ ] Performance Acceptable
- [ ] No Regressions

---

**Testing Complete!** ✅
