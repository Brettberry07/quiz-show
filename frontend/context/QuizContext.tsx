"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { Question } from "@/components/QuestionBuilder";
import { useUser } from "@/context/UserContext";

export interface QuizSummary {
  id: string;
  title: string;
  hostId: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz extends QuizSummary {
  questions: Question[];
}

interface QuizContextType {
  quizzes: QuizSummary[];
  isLoading: boolean;
  addQuiz: (quiz: { title: string; questions: Question[] }) => Promise<void>;
  updateQuiz: (id: string, quiz: { title: string; questions: Question[] }) => Promise<void>;
  removeQuiz: (id: string) => Promise<void>;
  getQuiz: (id: string) => Promise<Quiz | undefined>;
  refreshQuizzes: () => Promise<void>;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://quizsink.duckdns.org";

export function QuizProvider({ children }: { children: ReactNode }) {
  const { fetchWithAuth, accessToken } = useUser();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refreshQuizzes = useCallback(async () => {
    if (!accessToken) {
      setQuizzes([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/quiz/my`);
      const payload = await response.json();
      setQuizzes(payload.data || []);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, fetchWithAuth]);

  useEffect(() => {
    void refreshQuizzes();
  }, [refreshQuizzes]);

  const addQuiz = useCallback(
    async (quizData: { title: string; questions: Question[] }) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizData.title,
          questions: quizData.questions.map((q) => ({
            text: q.text,
            category: q.category,
            author: q.author,
            type: q.type,
            timeLimitSeconds: q.timeLimitSeconds,
            pointsMultiplier: q.pointsMultiplier,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || "Failed to create quiz");
      }

      await refreshQuizzes();
    },
    [fetchWithAuth, refreshQuizzes]
  );

  const updateQuiz = useCallback(
    async (id: string, quizData: { title: string; questions: Question[] }) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/quiz/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quizData.title,
          questions: quizData.questions.map((q) => ({
            id: q.id,
            text: q.text,
            category: q.category,
            author: q.author,
            type: q.type,
            timeLimitSeconds: q.timeLimitSeconds,
            pointsMultiplier: q.pointsMultiplier,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || "Failed to update quiz");
      }

      await refreshQuizzes();
    },
    [fetchWithAuth, refreshQuizzes]
  );

  const removeQuiz = useCallback(
    async (id: string) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/quiz/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || "Failed to delete quiz");
      }

      await refreshQuizzes();
    },
    [fetchWithAuth, refreshQuizzes]
  );

  const getQuiz = useCallback(
    async (id: string) => {
      const response = await fetchWithAuth(`${API_BASE_URL}/quiz/${id}`);
      if (!response.ok) {
        return undefined;
      }
      const payload = await response.json();
      return payload.data as Quiz;
    },
    [fetchWithAuth]
  );

  return (
    <QuizContext.Provider value={{ quizzes, isLoading, addQuiz, updateQuiz, removeQuiz, getQuiz, refreshQuizzes }}>
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
