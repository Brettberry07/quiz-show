"use client";

import { motion } from "framer-motion";
import Link from 'next/link';
import { Droplets, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function WinnerPage() {
  // Winner Page Implementation
  return (
    <div className="min-h-screen w-full flex flex-col overflow-hidden" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
      
      {/* Top Header */}
      <header className="w-full h-16 bg-[#3D3030] flex items-center justify-between px-6 shadow-md z-10">
        <div className="flex items-center gap-3 text-white">
            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
        </div>
        <div className="flex items-center gap-3 text-white">
            <span className="text-xl font-medium">Mhiki</span>
            <div className="h-10 w-10 rounded-full bg-[#d9d9d9]" />
        </div>
      </header>

      {/* Podium Section */}
      <main className="flex-1 flex items-end justify-center pb-0 px-4 relative">
        <Link href="/home" className="absolute top-8 right-8 z-20">
            <Button variant="secondary" className="bg-[#3D3030] text-white hover:bg-[#2D2020] border-b-4 border-[#1D1010] active:border-b-0 active:translate-y-1 transition-all">
                Back Home
            </Button>
        </Link>
        
         <div className="flex items-end justify-center w-full max-w-4xl gap-4 md:gap-8 h-full pb-0">
            
            {/* 3rd Place (Left) */}
            <div className="flex flex-col items-center w-1/4 max-w-50">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="mb-4 text-center"
                >
                    <span className="text-xl font-bold text-[#444] block">Player 3</span>
                 </motion.div>
                 <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "30vh" }} 
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="w-full bg-[#3D3030] shadow-lg"
                 />
            </div>

            {/* 1st Place (Center) */}
            <div className="flex flex-col items-center w-1/3 max-w-60 z-10">
                 <motion.div 
                    initial={{ opacity: 0, scale: 0, y: 50 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 1.0, type: "spring", stiffness: 200 }}
                    className="mb-6 flex flex-col items-center"
                >
                    <div className="relative">
                        <Crown className="w-20 h-20 text-[#cfa92d] fill-[#cfa92d] drop-shadow-md" />
                    </div>
                </motion.div>
                 
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    className="mb-4 text-center"
                >
                    <span className="text-2xl font-black text-[#222] block">Mhiki</span>
                 </motion.div>

                 <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "55vh" }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="w-full bg-[#3D3030] shadow-xl"
                 />
            </div>

            {/* 2nd Place (Right) */}
            <div className="flex flex-col items-center w-1/4 max-w-50">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    className="mb-4 text-center"
                >
                    <span className="text-xl font-bold text-[#444] block">Player 2</span>
                 </motion.div>
                 <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: "40vh" }} 
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="w-full bg-[#3D3030] shadow-lg"
                 />
            </div>
         </div>
      </main>
    </div>
  );
}
