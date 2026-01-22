"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Droplets, User, Waves, Hand } from "lucide-react";
import Link from 'next/link';
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function HostGamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuestion = parseInt(searchParams.get("q") || "1");
  const totalQuestions = parseInt(searchParams.get("total") || "12");
  
  const [gameState, setGameState] = useState<'reading' | 'answering'>('reading');
  const [timeLeft, setTimeLeft] = useState(10);

  // Initial sequence: Read question (5s) -> Answer phase (starts timer)
  useEffect(() => {
    if (gameState === 'reading') {
        const timer = setTimeout(() => {
            setGameState('answering');
        }, 5000); // 5 seconds to read
        return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Timer logic - only runs during 'answering'
  useEffect(() => {
    if (gameState === 'answering' && timeLeft > 0) {
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }
    // Auto-advance when time is up - go to leaderboard
    if (timeLeft === 0) {
        router.push(`/host/leaderboard?q=${currentQuestion}&total=${totalQuestions}`);
    }
  }, [gameState, timeLeft, router, currentQuestion, totalQuestions]);

  const handleManualNext = () => {
    router.push(`/host/leaderboard?q=${currentQuestion}&total=${totalQuestions}`);
  };

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
                    <span className="text-xs font-bold uppercase tracking-widest text-white/70">Question {currentQuestion} of {totalQuestions}</span>
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
                        General Knowledge
                    </span>
                    <h1 className={`${gameState === 'answering' ? 'text-4xl' : 'text-5xl md:text-7xl'} font-black tracking-tight text-[#1a1a1a] leading-tight transition-all duration-500`}>
                        What is the capital of France?
                    </h1>
                </div>
            </motion.div>
        </div>

        {/* Answer Options - Only revealed in 'answering' state */}
        <AnimatePresence>
            {gameState === 'answering' && (
                 <motion.div 
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="w-full max-w-7xl grid grid-cols-2 gap-4 h-64"
                 >
                    <AnswerCard 
                        icon={<Waves className="w-12 h-12 fill-current" />} 
                        label="London" 
                        color="bg-[#A59A9A]" // Theme color
                    />
                    <AnswerCard 
                        icon={<div className="w-12 h-12 rounded-full border-8 border-current" />} 
                        label="Berlin" 
                        color="bg-[#A59A9A]" 
                    />
                    <AnswerCard 
                        icon={<Hand className="w-12 h-12 fill-current" />} 
                        label="Paris" 
                        color="bg-[#A59A9A]"
                        isCorrect // Metadata for later
                    />
                    <AnswerCard 
                        icon={<svg className="w-12 h-12 fill-current" viewBox="0 0 64 64" fill="currentColor"><path d="M50 16h-8v-4a6 6 0 00-12 0v4H18a6 6 0 00-6 6v4a6 6 0 006 6h2v18a6 6 0 006 6h12a6 6 0 006-6V32h2a6 6 0 006-6v-4a6 6 0 00-6-6zm-20-4a2 2 0 114 0v4h-4v-4zm18 14a2 2 0 01-2 2h-4v20a2 2 0 01-2 2H28a2 2 0 01-2-2V28h-4a2 2 0 01-2-2v-4a2 2 0 012-2h24a2 2 0 012 2v4z" /></svg>} 
                        label="Madrid" 
                        color="bg-[#A59A9A]" 
                    />
                 </motion.div>
            )}
        </AnimatePresence>

        {/* Timer - Only active in 'answering' state */}
        <div className="absolute left-8 bottom-8 md:scale-125 origin-bottom-left">
            {gameState === 'answering' && (
                 <motion.div 
                    initial={{ scale: 0 }} 
                    animate={{ scale: 1 }}
                    className="w-24 h-24 rounded-full bg-[#3D3030] border-8 border-[#A59A9A] flex items-center justify-center shadow-lg"
                >
                    <span className={`text-4xl font-black ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                        {timeLeft}
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
