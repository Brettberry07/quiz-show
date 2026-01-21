"use client";

import { motion } from "framer-motion";
import { Droplets, Settings, Music, User } from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function HostGamePage() {
  const router = useRouter();

  const handleQuestionClick = () => {
    router.push("/host/winner");
  };

  return (
    <div className="min-h-screen w-full bg-[#f1f1f1] text-[#111] flex flex-col">
       {/* Host Header */}
       <div className="bg-[#7a7a7a] text-white shadow-md relative overflow-hidden h-20 shrink-0">
                <div className="max-w-7xl mx-auto flex items-center justify-between h-full px-6 relative z-10">
                     <div className="flex items-center gap-4">
                        <Link href="/home">
                            <div className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                                <Droplets className="h-8 w-8" />
                                <span className="text-xl font-black tracking-tight">QuizSink</span>
                            </div>
                        </Link>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold uppercase tracking-widest text-white/70">Question 1 of 12</span>
                    </div>
                     
                    <div className="flex items-center gap-4">
                        <div className="bg-black/20 px-4 py-2 rounded-lg flex items-center gap-2">
                            <User className="w-5 h-5" />
                            <span className="font-bold">8</span>
                        </div>
                    </div>
                </div>
        </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-8">
        
        {/* Question Card */}
        <motion.div
          onClick={handleQuestionClick}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="w-full max-w-5xl bg-white shadow-2xl rounded-3xl p-12 min-h-[400px] flex items-center justify-center text-center cursor-pointer hover:scale-[1.01] transition-transform active:scale-[0.99] group"
        >
            <div className="space-y-6">
                <span className="inline-block px-4 py-1 bg-black text-white text-sm font-bold uppercase tracking-widest rounded-full mb-4">
                    General Knowledge
                </span>
                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-[#1a1a1a] leading-tight group-hover:text-black">
                    What is the capital of France?
                </h1>
            </div>
        </motion.div>

        {/* Floating Controls / Timer (Visual only) */}
        <div className="flex items-center gap-8">
            <div className="w-20 h-20 rounded-full bg-[#333] border-8 border-[#ccc] flex items-center justify-center shadow-lg">
                <span className="text-3xl font-black text-white">20</span>
            </div>
        </div>
        
      </main>
    </div>
  );
}
