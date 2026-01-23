"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Question } from "@/components/QuestionBuilder";
import { Quiz } from "./QuizContext";

interface GameContextType {
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  getCurrentQuestion: () => Question | null;
  getTotalQuestions: () => number;
  isLastQuestion: () => boolean;
  nextQuestion: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const getCurrentQuestion = (): Question | null => {
    if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
      return null;
    }
    return currentQuiz.questions[currentQuestionIndex];
  };

  const getTotalQuestions = (): number => {
    return currentQuiz?.questions.length || 0;
  };

  const isLastQuestion = (): boolean => {
    if (!currentQuiz) return true;
    return currentQuestionIndex >= currentQuiz.questions.length - 1;
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex((prev) => prev + 1);
  };

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setCurrentQuiz(null);
  };

  return (
    <GameContext.Provider
      value={{
        currentQuiz,
        currentQuestionIndex,
        setCurrentQuiz,
        setCurrentQuestionIndex,
        getCurrentQuestion,
        getTotalQuestions,
        isLastQuestion,
        nextQuestion,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
