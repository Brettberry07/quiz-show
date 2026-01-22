"use client";

import { Card } from "@/components/ui/Card";
import { motion, AnimatePresence } from "framer-motion";
import { Waves, Hand, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuestionBuilder, Question } from "@/components/QuestionBuilder";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/context/UserContext";

export default function PlayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username } = useUser();
  const currentQuestion = parseInt(searchParams.get("q") || "1");
  const totalQuestions = parseInt(searchParams.get("total") || "12");
  
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'adding_question'>('waiting');

  useEffect(() => {
    if (gameState !== 'waiting') return;
    
    // Simulate waiting for host to start game - Longer wait now to allow adding questions
    const timer = setTimeout(() => {
      setGameState('playing');
    }, 10000); // 10 seconds wait

    return () => clearTimeout(timer);
  }, [gameState]);

  const handleAnswer = (isCorrect: boolean) => {
    // Calculate points based on speed (simulated)
    const points = isCorrect ? Math.floor(Math.random() * 500) + 500 : 0;
    router.push(`/play/leaderboard?q=${currentQuestion}&total=${totalQuestions}&points=${points}&correct=${isCorrect}`);
  };

  const handleSuggestQuestion = () => {
    setGameState('adding_question');
  };

  const handleQuestionAdded = (q: Question) => {
    // In a real app, this would send the suggestion to the server
    console.log("Suggestion added:", q);
    alert("Thanks for your suggestion! The host might include it.");
    setGameState('waiting');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
       {/* Top Bar */}
       <header className="sticky top-0 z-40 w-full bg-[#3D3030] text-white h-16 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
            <span className="hidden md:inline font-medium ml-4">{username || "Player"}</span>
            <div className="h-10 w-10 rounded-full bg-white/80" />
        </div>
      </header>

       <div className="flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {gameState === 'waiting' && (
             <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-6 w-full max-w-md"
             >
                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black text-[#1a1a1a]">You&apos;re In!</h1>
                    <p className="text-xl font-medium text-[#666]">See your nickname on screen</p>
                </div>

                <div className="flex justify-center py-4">
                     <div className="h-16 w-16 border-4 border-[#A59A9A] border-t-[#3D3030] rounded-full animate-spin" />
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <Card className="p-6 bg-white border-none shadow-lg">
                        <h3 className="font-bold text-lg mb-2">Got a good question?</h3>
                        <Button 
                            onClick={handleSuggestQuestion}
                            className="w-full bg-[#202020] text-white hover:bg-[#333] font-bold h-12 border-b-4 border-[#111] active:border-b-0 active:translate-y-1 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Suggest a Question
                        </Button>
                    </Card>
                </motion.div>
             </motion.div>
          )}

          {gameState === 'adding_question' && (
             <motion.div
                key="adding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="w-full max-w-2xl"
             >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-2xl font-black">Suggest Question</h2>
                    <Button 
                        variant="ghost" 
                        onClick={() => setGameState('waiting')}
                        className="hover:bg-gray-200"
                    >
                        <X className="w-5 h-5" />
                        Cancel
                    </Button>
                </div>
                <QuestionBuilder 
                    onAddQuestion={handleQuestionAdded}
                    creatorName={username || "Player"} 
                />
             </motion.div>
          )}

          {gameState === 'playing' && (
             <motion.div
                key="question"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full flex flex-col flex-1 h-full"
             >
                 {/* Question Area (Placeholder) */}
                 <div className="flex-1 flex items-center justify-center w-full mb-8">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full text-center min-h-50 flex items-center justify-center"
                    >
                        <h2 className="text-4xl font-black text-black">What is the capital of France?</h2>
                    </motion.div>
                 </div>

                 {/* Answer Grid */}
                 <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto sm:h-96 pb-8">
                    <GameButton 
                        onClick={() => handleAnswer(false)}
                        icon={<Waves className="w-16 h-16 md:w-24 md:h-24 fill-current" />} 
                        color="bg-[#A59A9A]" // Theme color
                        delay={0}
                    />
                    <GameButton 
                        onClick={() => handleAnswer(false)}
                        icon={<div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-8 border-current" />} 
                        color="bg-[#A59A9A]" 
                        delay={0.1}
                    />
                    <GameButton 
                        onClick={() => handleAnswer(true)}
                        icon={<Hand className="w-16 h-16 md:w-24 md:h-24 fill-current" />} 
                        color="bg-[#A59A9A]" 
                        delay={0.2}
                    />
                    <GameButton 
                        onClick={() => handleAnswer(false)}
                        icon={
                            <svg
                            className="w-16 h-16 md:w-24 md:h-24 fill-current"
                            viewBox="0 0 64 64"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M50 16h-8v-4a6 6 0 00-12 0v4H18a6 6 0 00-6 6v4a6 6 0 006 6h2v18a6 6 0 006 6h12a6 6 0 006-6V32h2a6 6 0 006-6v-4a6 6 0 00-6-6zm-20-4a2 2 0 114 0v4h-4v-4zm18 14a2 2 0 01-2 2h-4v20a2 2 0 01-2 2H28a2 2 0 01-2-2V28h-4a2 2 0 01-2-2v-4a2 2 0 012-2h24a2 2 0 012 2v4z" />
                        </svg>
                        } 
                        color="bg-[#A59A9A]" 
                        delay={0.3}
                    />
                 </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function GameButton({ icon, color, delay, onClick }: { icon: React.ReactNode, color: string, delay: number, onClick: () => void }) {
    return (
        <motion.button
            onClick={onClick}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay, type: "spring" }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            className={`${color} rounded-xl shadow-[0_8px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center p-8 text-black`}
        >
            {icon}
        </motion.button>
    )
}
