"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Question } from "@/components/QuestionBuilder";

export interface Quiz {
  id: string;
  name: string;
  description: string;
  questions: Question[];
  createdAt: string;
  emoji?: string;
}

interface QuizContextType {
  quizzes: Quiz[];
  addQuiz: (quiz: Omit<Quiz, "id" | "createdAt">) => void;
  updateQuiz: (id: string, quiz: Omit<Quiz, "id" | "createdAt">) => void;
  removeQuiz: (id: string) => void;
  getQuiz: (id: string) => Quiz | undefined;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const EMOJI_OPTIONS = ["📚", "🧠", "🎯", "💡", "🔬", "🌍", "🎨", "🎵", "⚽", "🚀", "🎮", "📐"];

export function QuizProvider({ children }: { children: ReactNode }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  // Load quizzes from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("quizsink_quizzes");
    if (stored) {
      try {
        setQuizzes(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored quizzes:", e);
      }
    }
  }, []);

  // Save quizzes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("quizsink_quizzes", JSON.stringify(quizzes));
  }, [quizzes]);

  const addQuiz = (quizData: Omit<Quiz, "id" | "createdAt">) => {
    const newQuiz: Quiz = {
      ...quizData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      emoji: quizData.emoji || EMOJI_OPTIONS[Math.floor(Math.random() * EMOJI_OPTIONS.length)],
    };
    setQuizzes((prev) => [...prev, newQuiz]);
  };

  const removeQuiz = (id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuiz = (id: string, quizData: Omit<Quiz, "id" | "createdAt">) => {
    setQuizzes((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, ...quizData }
          : q
      )
    );
  };

  const getQuiz = (id: string) => {
    return quizzes.find((q) => q.id === id);
  };

  return (
    <QuizContext.Provider value={{ quizzes, addQuiz, updateQuiz, removeQuiz, getQuiz }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuizzes() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuizzes must be used within a QuizProvider");
  }
  return context;
}
