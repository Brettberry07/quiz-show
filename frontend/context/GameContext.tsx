"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { Question } from "@/components/QuestionBuilder";
import { Quiz } from "./QuizContext";
import { useUser } from "./UserContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://quizsink.duckdns.org";

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
  socket: Socket | null;
  connectSocket: () => Promise<Socket>;
  disconnectSocket: () => void;
  emitWithAck: <T = unknown>(event: string, payload?: unknown) => Promise<T>;
  onEvent: (event: string, handler: (...args: unknown[]) => void) => void;
  offEvent: (event: string, handler: (...args: unknown[]) => void) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [socketState, setSocketState] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const { accessToken } = useUser();

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

  const connectSocket = useCallback((): Promise<Socket> => {
    return new Promise((resolve, reject) => {
      const token = accessToken || localStorage.getItem("quizsink_access_token");
      if (!token) {
        reject(new Error("Missing access token for socket connection"));
        return;
      }

      if (socketRef.current && socketRef.current.connected) {
        resolve(socketRef.current);
        return;
      }

      const socket = io(`${API_BASE_URL}/game`, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      socketRef.current = socket;

      const cleanupError = (error: Error) => {
        if (socketRef.current === socket) {
          setSocketState(null);
        }
        reject(error);
      };

      socket.once("connect", () => {
        setSocketState(socket);
        resolve(socket);
      });

      socket.once("connect_error", cleanupError);
      socket.on("disconnect", () => {
        if (socketRef.current === socket) {
          setSocketState(null);
        }
      });
    });
  }, [accessToken]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocketState(null);
    }
  }, []);

  const emitWithAck = useCallback(
    async <T,>(event: string, payload?: unknown): Promise<T> => {
      const socket = await connectSocket();
      const response = await socket.timeout(8000).emitWithAck(event, payload);
      return response as T;
    },
    [connectSocket]
  );

  const onEvent = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler as (...args: unknown[]) => void);
  }, []);

  const offEvent = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler as (...args: unknown[]) => void);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    void connectSocket().catch(() => null);
    return () => {
      disconnectSocket();
    };
  }, [accessToken, connectSocket, disconnectSocket]);

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
        socket: socketState,
        connectSocket,
        disconnectSocket,
        emitWithAck,
        onEvent,
        offEvent,
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
