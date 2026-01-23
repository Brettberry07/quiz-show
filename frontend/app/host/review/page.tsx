"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Check, User, ArrowLeft, Home } from "lucide-react";

export default function ReviewQuestionsPage() {
  const { currentQuiz } = useGame();

  if (!currentQuiz) {
    return (
      <div
        className="min-h-screen w-full flex flex-col"
        style={{
          backgroundImage: "url('/TileBG.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "auto",
        }}
      >
        <header className="w-full h-16 bg-[#3D3030] flex items-center justify-between px-6 shadow-md z-10">
          <div className="flex items-center gap-3 text-white">
            <Link href="/home">
              <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
            </Link>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
            <h2 className="text-2xl font-bold mb-4">No quiz data available</h2>
            <Link href="/home" className="text-blue-500 underline">
              Go back home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col"
      style={{
        backgroundImage: "url('/TileBG.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      {/* Header */}
      <header className="w-full h-16 bg-[#3D3030] flex items-center justify-between px-6 shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3 text-white">
          <Link href="/home">
            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/host/winner">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Results
            </Button>
          </Link>
          <Link href="/home">
            <Button className="bg-white/20 text-white hover:bg-white/30 flex items-center gap-2">
              <Home className="w-4 h-4" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-4xl font-black text-[#1a1a1a] mb-2">
              Question Review
            </h1>
            <p className="text-lg text-[#666]">
              {currentQuiz.title} • {currentQuiz.questions.length} Questions
            </p>
          </motion.div>

          {/* Questions List */}
          <div className="space-y-6">
            {currentQuiz.questions.map((question, qIndex) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: qIndex * 0.1 }}
              >
                <Card className="bg-white border-none shadow-lg overflow-hidden">
                  {/* Question Header */}
                  <div className="bg-[#3D3030] text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg">
                        {qIndex + 1}
                      </div>
                      <span className="font-bold text-lg">Question {qIndex + 1}</span>
                    </div>
                    {question.author && (
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full">
                        <User className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Created by: {question.author}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Question Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-[#1a1a1a] mb-6">
                      {question.text}
                    </h3>

                    {/* Answer Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {question.options.map((option, optIndex) => {
                        const isCorrect = optIndex === question.correctOptionIndex;
                        return (
                          <div
                            key={optIndex}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                              isCorrect
                                ? "bg-green-50 border-green-400 text-green-800"
                                : "bg-gray-50 border-gray-200 text-gray-600"
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                isCorrect
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-300 text-gray-600"
                              }`}
                            >
                              {isCorrect ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <span className="font-bold text-sm">
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                              )}
                            </div>
                            <span
                              className={`font-medium text-lg ${
                                isCorrect ? "font-bold" : ""
                              }`}
                            >
                              {option}
                            </span>
                            {isCorrect && (
                              <span className="ml-auto text-sm font-bold text-green-600 bg-green-200 px-2 py-0.5 rounded-full">
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Bottom Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: currentQuiz.questions.length * 0.1 + 0.2 }}
            className="mt-8 flex justify-center gap-4"
          >
            <Link href="/host/winner">
              <Button
                variant="secondary"
                className="bg-[#A59A9A] text-[#333] hover:bg-[#958A8A] font-bold px-8 py-3 h-auto border-b-4 border-[#857A7A] active:border-b-0 active:translate-y-1 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Podium
              </Button>
            </Link>
            <Link href="/home">
              <Button className="bg-[#202020] text-white hover:bg-[#333] font-bold px-8 py-3 h-auto border-b-4 border-[#111] active:border-b-0 active:translate-y-1 transition-all">
                <Home className="w-4 h-4 mr-2" />
                Back Home
              </Button>
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
