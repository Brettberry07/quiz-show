"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Waves, Hand, Droplets } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayPage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing'>('waiting');

  useEffect(() => {
    // Simulate waiting for host to start game
    const timer = setTimeout(() => {
      setGameState('playing');
    }, 3000); // 3 seconds wait

    return () => clearTimeout(timer);
  }, []);

  const handleAnswer = () => {
    router.push("/host/winner");
  };

  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col">
       {/* Top Bar */}
       <header className="sticky top-0 z-40 w-full bg-[#6b7280] text-white h-16 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2">
            <Droplets className="h-8 w-8" />
            <span className="text-2xl font-black tracking-tight">QuizSink</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
            <span className="hidden md:inline font-medium ml-4">Berrybr</span>
            <div className="h-10 w-10 rounded-full bg-white/80" />
        </div>
      </header>

       <div className="flex-1 flex flex-col items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {gameState === 'waiting' ? (
             <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center space-y-6"
             >
                <h1 className="text-4xl md:text-6xl font-black text-[#1a1a1a]">You're In!</h1>
                <p className="text-xl font-medium text-[#666]">See your nickname on screen</p>
                <div className="flex justify-center mt-8">
                     <div className="h-16 w-16 border-4 border-[#ccc] border-t-[#333] rounded-full animate-spin" />
                </div>
             </motion.div>
          ) : (
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
                        className="bg-white p-8 rounded-2xl shadow-lg max-w-2xl w-full text-center min-h-[200px] flex items-center justify-center"
                    >
                        <h2 className="text-4xl font-black text-black">What is the capital of France?</h2>
                    </motion.div>
                 </div>

                 {/* Answer Grid */}
                 <div className="w-full max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto sm:h-96 pb-8">
                    <GameButton 
                        onClick={handleAnswer}
                        icon={<Waves className="w-16 h-16 md:w-24 md:h-24 fill-current" />} 
                        color="bg-[#a3a3a3]" // Gray
                        delay={0}
                    />
                    <GameButton 
                        onClick={handleAnswer}
                        icon={<div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-8 border-current" />} 
                        color="bg-[#a3a3a3]" 
                        delay={0.1}
                    />
                    <GameButton 
                        onClick={handleAnswer}
                        icon={<Hand className="w-16 h-16 md:w-24 md:h-24 fill-current" />} 
                        color="bg-[#a3a3a3]" 
                        delay={0.2}
                    />
                    <GameButton 
                        onClick={handleAnswer}
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
                        color="bg-[#a3a3a3]" 
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
            className={`${color} rounded-xl shadow-[0_8px_0_rgba(0,0,0,0.2)] active:shadow-none active:translate-y-[8px] transition-all flex items-center justify-center p-8 text-black`}
        >
            {icon}
        </motion.button>
    )
}
