import { useCallback } from 'react';
import { useLessonStore } from '../store/useLessonStore';
import { showToast } from '../components/Toast';

export const useLessonLogic = () => {
  const { lesson, state, updateProgress, setLessonState } = useLessonStore();
  
  const getNextUnlearnedTask = useCallback((exIdx: number, taskIdx: number) => {
    if (!lesson?.exercises) return null;
    let nextEx = exIdx;
    let nextTask = taskIdx + 1;

    while (nextEx < lesson.exercises.length) {
      const ex = lesson.exercises[nextEx];
      while (nextTask < (ex.tasks?.length || 0)) {
        const taskId = `${nextEx}_${nextTask}`;
        if (!state?.progress?.learnedTasks?.includes(taskId)) {
          return { exIdx: nextEx, taskIdx: nextTask };
        }
        nextTask++;
      }
      nextEx++;
      nextTask = 0;
    }
    return null;
  }, [lesson, state?.progress?.learnedTasks]);

  const getPrevUnlearnedTask = useCallback((exIdx: number, taskIdx: number) => {
    if (!lesson?.exercises) return null;
    let prevEx = exIdx;
    let prevTask = taskIdx - 1;

    while (prevEx >= 0) {
      const ex = lesson.exercises[prevEx];
      while (prevTask >= 0) {
        const taskId = `${prevEx}_${prevTask}`;
        if (!state?.progress?.learnedTasks?.includes(taskId)) {
          return { exIdx: prevEx, taskIdx: prevTask };
        }
        prevTask--;
      }
      prevEx--;
      if (prevEx >= 0) {
        prevTask = (lesson.exercises[prevEx].tasks?.length || 1) - 1;
      }
    }
    return null;
  }, [lesson, state?.progress?.learnedTasks]);

  const handleNextTask = useCallback(() => {
    if (!state || !lesson) return;
    const next = getNextUnlearnedTask(state.progress.currentExerciseIdx, state.progress.currentTaskIdx);
    if (next) {
      updateProgress({ 
        currentExerciseIdx: next.exIdx, 
        currentTaskIdx: next.taskIdx 
      });
    } else {
      updateProgress({ completed: true });
      showToast('🎉 Урок завершен! Отличная работа.', 'success');
    }
  }, [state, lesson, getNextUnlearnedTask, updateProgress]);

  const handlePrevTask = useCallback(() => {
    if (!state || !lesson) return;
    const prev = getPrevUnlearnedTask(state.progress.currentExerciseIdx, state.progress.currentTaskIdx);
    if (prev) {
      updateProgress({ 
        currentExerciseIdx: prev.exIdx, 
        currentTaskIdx: prev.taskIdx,
        completed: false
      });
    }
  }, [state, lesson, getPrevUnlearnedTask, updateProgress]);

  const onFeedback = useCallback((isCorrect: boolean, userAnswer: string) => {
    if (!state) return;
    
    const { currentExerciseIdx, currentTaskIdx } = state.progress;
    const statsKey = `${currentExerciseIdx}-${currentTaskIdx}`;
    
    const stats = state.progress.statistics || { correct: 0, incorrect: 0, skipped: 0, answers: {} };
    
    updateProgress({
      statistics: {
        ...stats,
        correct: (stats.correct || 0) + (isCorrect ? 1 : 0),
        incorrect: (stats.incorrect || 0) + (isCorrect ? 0 : 1),
        answers: {
          ...(stats.answers || {}),
          [statsKey]: { userAnswer, correct: isCorrect }
        }
      }
    });

    if (isCorrect) {
      setTimeout(handleNextTask, 1500);
    }
  }, [state, updateProgress, handleNextTask]);

  const handleExerciseAttempt = useCallback((isCorrect: boolean, isFirstAttempt: boolean) => {
    if (!state) return;
    const { currentExerciseIdx, currentTaskIdx, learnedTasks } = state.progress;
    const taskId = `${currentExerciseIdx}_${currentTaskIdx}`;
    
    if (isCorrect && isFirstAttempt && !learnedTasks?.includes(taskId)) {
       updateProgress({
         learnedTasks: [...(learnedTasks || []), taskId]
       });
    }
  }, [state, updateProgress]);

  return {
    handleNextTask,
    handlePrevTask,
    onFeedback,
    handleExerciseAttempt,
    getNextUnlearnedTask,
    getPrevUnlearnedTask
  };
};
