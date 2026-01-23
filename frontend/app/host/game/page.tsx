"use client";

import { motion, AnimatePresence } from "framer-motion";
import { User, Waves, Hand } from "lucide-react";
import Link from 'next/link';
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";

const ANSWER_ICONS = [
  <Waves key="wave" className="w-12 h-12 fill-current" />,
  <div key="circle" className="w-12 h-12 rounded-full border-8 border-current" />,
  <Hand key="hand" className="w-12 h-12 fill-current" />,
  <svg key="svg" className="w-12 h-12 fill-current" viewBox="0 0 64 64" fill="currentColor"><path d="M50 16h-8v-4a6 6 0 00-12 0v4H18a6 6 0 00-6 6v4a6 6 0 006 6h2v18a6 6 0 006 6h12a6 6 0 006-6V32h2a6 6 0 006-6v-4a6 6 0 00-6-6zm-20-4a2 2 0 114 0v4h-4v-4zm18 14a2 2 0 01-2 2h-4v20a2 2 0 01-2 2H28a2 2 0 01-2-2V28h-4a2 2 0 01-2-2v-4a2 2 0 012-2h24a2 2 0 012 2v4z" /></svg>
];

export default function HostGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
  const { fetchWithAuth } = useUser();

  interface GameQuestion {
    text: string;
    options: string[];
    correctOptionIndex?: number;
    category?: string;
  }

  const [question, setQuestion] = useState<GameQuestion | null>(null);
  const [timeRemainingMs, setTimeRemainingMs] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gameState, setGameState] = useState<string>("LOBBY");

  useEffect(() => {
    if (!pin) return;
    let mounted = true;
    const pollQuestion = async () => {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5200"}/game/${pin}/question`);
      const payload = await response.json();
      if (!mounted) return;
      if (response.ok) {
        setQuestion(payload.data.question);
        setTimeRemainingMs(payload.data.timeRemainingMs ?? null);
        setCurrentQuestionIndex(payload.data.currentQuestionIndex ?? 0);
        setTotalQuestions(payload.data.totalQuestions ?? 0);
        setGameState(payload.data.state || "LOBBY");
        if (payload.data.state === "PROCESSING") {
          router.push(`/host/leaderboard?pin=${pin}`);
        }
      }
    };

    const interval = setInterval(pollQuestion, 1000);
    void pollQuestion();
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pin, fetchWithAuth, router]);

  const handleManualNext = async () => {
    if (!pin) return;
    await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5200"}/game/${pin}/question/end`, { method: "POST" });
    await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5200"}/game/${pin}/leaderboard/show`, { method: "POST" });
    router.push(`/host/leaderboard?pin=${pin}`);
  };

  if (!pin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-4">No game PIN provided</h2>
          <Link href="/home" className="text-blue-500 underline">Go back home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-[#111] flex flex-col overflow-hidden" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
       {/* Host Header */}
       <div className="bg-[#3D3030] text-white shadow-md relative overflow-hidden h-20 shrink-0 z-20">
            <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-6 relative z-10">
                    <div className="flex items-center gap-4">
                    <Link href="/home">
                        <div className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
                        </div>
                    </Link>
                </div>

                <div className="flex flex-col items-center">
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70">Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                </div>
                    
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2">
                        <User className="w-5 h-5" />
                        <span className="font-bold">8</span>
                    </div>
                    <button onClick={handleManualNext} className="ml-4 text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">
                        Skip
                    </button>
                </div>
            </div>
            {/* Countdown Bar */}
             {gameState === 'reading' && (
                 <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 5, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-white/50"
                 />
             )}
        </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-between px-6 py-8 relative">
        
        {/* Question Card - Moves up when options appear */}
        <div className="flex-1 w-full flex items-center justify-center transition-all duration-500">
             <motion.div
                layout
                className={`w-full max-w-5xl bg-white shadow-2xl rounded-3xl flex items-center justify-center text-center p-8 transition-all duration-500 ${gameState === 'answering' ? 'min-h-62.5 scale-90 mb-4' : 'min-h-100'}`}
                >
                <div className="space-y-6">
                    <span className="inline-block px-4 py-1 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-full mb-4">
                        {question?.category || "Question"}
                    </span>
                      <h1 className={`${gameState === 'QUESTION_ACTIVE' ? 'text-4xl' : 'text-5xl md:text-7xl'} font-black tracking-tight text-[#1a1a1a] leading-tight transition-all duration-500`}>
                        {question?.text || "Waiting for question..."}
                    </h1>
                </div>
            </motion.div>
        </div>

        {/* Answer Options - Only revealed in 'answering' state */}
        <AnimatePresence>
              {gameState === 'QUESTION_ACTIVE' && question && (
                 <motion.div 
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full max-w-7xl grid grid-cols-2 gap-4 h-64"
                 >
                    {question.options.map((option: string, index: number) => (
                      <AnswerCard 
                        key={index}
                        icon={ANSWER_ICONS[index % ANSWER_ICONS.length]} 
                        label={option} 
                        color="bg-[#A59A9A]"
                        isCorrect={
                          typeof question.correctOptionIndex === "number"
                            ? index === question.correctOptionIndex
                            : false
                        }
                      />
                    ))}
                 </motion.div>
            )}
        </AnimatePresence>

        {/* Timer - Only active in 'answering' state */}
        <div className="absolute left-8 bottom-8 md:scale-125 origin-bottom-left">
              {gameState === 'QUESTION_ACTIVE' && (
                 <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="w-24 h-24 rounded-full bg-[#3D3030] border-8 border-[#A59A9A] flex items-center justify-center shadow-lg"
                >
                    <span className={`text-4xl font-black ${timeRemainingMs !== null && timeRemainingMs <= 5000 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      {timeRemainingMs !== null ? Math.ceil(timeRemainingMs / 1000) : "--"}
                    </span>
                </motion.div>
            )}
        </div>
        
      </main>
    </div>
  );
}

function AnswerCard({ icon, label, color }: { icon: React.ReactNode, label: string, color: string, isCorrect?: boolean }) {
    return (
        <div className={`${color} rounded-xl shadow-md p-6 flex items-center gap-6 text-black`}>
            <div className="shrink-0 opacity-50">
                {icon}
            </div>
            <span className="text-3xl font-bold truncate">{label}</span>
        </div>
    )
}
