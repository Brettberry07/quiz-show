"use client";

import { motion } from "framer-motion";
import { Waves, Hand } from "lucide-react";

export default function PlayPage() {
  return (
    <div className="min-h-screen bg-[#f0f0f0] flex flex-col items-center justify-between p-4 pb-12">
       {/* Top Bar for Game (minimal) */}
       <header className="w-full h-16 flex items-center justify-between pointer-events-none opacity-50">
           <h1 className="text-2xl font-black">QuizSink</h1>
           <div className="h-10 w-10 bg-gray-400 rounded-full" />
       </header>

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
       <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 gap-4 h-auto sm:h-96">
          <GameButton 
            icon={<Waves className="w-16 h-16 md:w-24 md:h-24 fill-current" />} 
            color="bg-[#a3a3a3]" // Gray
            delay={0}
          />
           <GameButton 
            icon={<div className="w-16 h-16 md:w-24 md:h-24 rounded-full border-8 border-current" />} 
            color="bg-[#a3a3a3]" 
            delay={0.1}
          />
           <GameButton 
            icon={<Hand className="w-16 h-16 md:w-24 md:h-24 fill-current" />} 
            color="bg-[#a3a3a3]" 
            delay={0.2}
          />
           <GameButton 
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
    </div>
  );
}

function GameButton({ icon, color, delay }: { icon: React.ReactNode, color: string, delay: number }) {
    return (
        <motion.button
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
