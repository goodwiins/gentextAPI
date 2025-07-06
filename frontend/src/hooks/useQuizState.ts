import { useState, useCallback, useRef } from 'react';
import { QuizQuestion } from '@/components/quiz';

export interface QuizState {
  text: string;
  responseData: QuizQuestion[] | null;
  isLoading: boolean;
  error: string | null;
  activeSection: 'input' | 'quiz';
  quizTitle: string;
  isSaving: boolean;
  saveError: string | null;
}

export interface UseQuizStateReturn {
  quizState: QuizState;
  actions: {
    setText: (text: string) => void;
    setResponseData: (data: QuizQuestion[] | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setActiveSection: (section: 'input' | 'quiz') => void;
    setQuizTitle: (title: string) => void;
    setSaving: (saving: boolean) => void;
    setSaveError: (error: string | null) => void;
    resetQuiz: () => void;
    clearErrors: () => void;
  };
  refs: {
    inputSectionRef: React.RefObject<HTMLDivElement>;
    quizSectionRef: React.RefObject<HTMLDivElement>;
  };
}

const initialState: QuizState = {
  text: '',
  responseData: null,
  isLoading: false,
  error: null,
  activeSection: 'input',
  quizTitle: '',
  isSaving: false,
  saveError: null,
};

export const useQuizState = (): UseQuizStateReturn => {
  const [quizState, setQuizState] = useState<QuizState>(initialState);
  
  // Refs for smooth scrolling
  const inputSectionRef = useRef<HTMLDivElement>(null);
  const quizSectionRef = useRef<HTMLDivElement>(null);

  // Optimized state setters with useCallback for performance
  const setText = useCallback((text: string) => {
    setQuizState(prev => ({ ...prev, text }));
  }, []);

  const setResponseData = useCallback((responseData: QuizQuestion[] | null) => {
    setQuizState(prev => ({ ...prev, responseData }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setQuizState(prev => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setQuizState(prev => ({ ...prev, error }));
  }, []);

  const setActiveSection = useCallback((activeSection: 'input' | 'quiz') => {
    setQuizState(prev => ({ ...prev, activeSection }));
  }, []);

  const setQuizTitle = useCallback((quizTitle: string) => {
    setQuizState(prev => ({ ...prev, quizTitle }));
  }, []);

  const setSaving = useCallback((isSaving: boolean) => {
    setQuizState(prev => ({ ...prev, isSaving }));
  }, []);

  const setSaveError = useCallback((saveError: string | null) => {
    setQuizState(prev => ({ ...prev, saveError }));
  }, []);

  const resetQuiz = useCallback(() => {
    setQuizState(prev => ({
      ...prev,
      text: '',
      responseData: null,
      error: null,
      activeSection: 'input',
      quizTitle: '',
      saveError: null,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setQuizState(prev => ({ ...prev, error: null, saveError: null }));
  }, []);

  return {
    quizState,
    actions: {
      setText,
      setResponseData,
      setLoading,
      setError,
      setActiveSection,
      setQuizTitle,
      setSaving,
      setSaveError,
      resetQuiz,
      clearErrors,
    },
    refs: {
      inputSectionRef,
      quizSectionRef,
    },
  };
};