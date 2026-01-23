"use client";

import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from 'next/link';
import { useQuizzes } from "@/context/QuizContext";

export default function HomePage() {
  const { quizzes, removeQuiz } = useQuizzes();

  const handleRemoveQuiz = async (id: string) => {
    try {
      await removeQuiz(id);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete quiz";
      alert(message);
    }
  };

  return (
    <Shell>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold text-black border-b-2 border-black/10 pb-4 mb-8"
          >
            Your Quizzes
          </motion.h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Saved Quizzes */}
            {quizzes.map((quiz, index) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="min-h-48 bg-[#A59A9A] border-none shadow-md hover:shadow-lg transition-all flex flex-col p-6 justify-between relative overflow-hidden group">
                  <button
                    onClick={() => handleRemoveQuiz(quiz.id)}
                    className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/20 hover:bg-red-500 hover:text-white text-[#333] transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="space-y-2 z-10">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-2">
                      <span className="text-2xl">{quiz.emoji || "📚"}</span>
                    </div>
                    <h3 className="text-2xl font-black text-[#333] leading-tight">{quiz.title}</h3>
                    <p className="text-[#555] font-bold">{quiz.questionCount} Question{quiz.questionCount !== 1 ? 's' : ''}</p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-black/10 flex gap-2">
                    <Link href={`/host?quizId=${quiz.id}`} className="flex-1">
                      <Button className="w-full bg-[#202020] text-white hover:bg-black font-bold shadow-sm border-b-4 border-[#111] active:border-b-0 active:translate-y-1 transition-all">
                        Host
                      </Button>
                    </Link>
                    <Link href={`/create?edit=${quiz.id}`}>
                      <Button variant="ghost" className="px-3 hover:bg-white/20 text-[#333]">
                        Edit
                      </Button>
                    </Link>
                  </div>
                  {/* Decoration */}
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none transition-transform group-hover:scale-150" />
                </Card>
              </motion.div>
            ))}

            {/* Create New Quiz Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: quizzes.length * 0.05 + 0.1 }}
            >
              <Link href="/create">
                <Card className="h-48 bg-[#A59A9A]/60 border-none shadow-none flex items-center justify-center hover:brightness-95 transition-all cursor-pointer group">
                  <Plus className="w-16 h-16 text-[#3D3030] group-hover:scale-110 transition-transform" />
                </Card>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
