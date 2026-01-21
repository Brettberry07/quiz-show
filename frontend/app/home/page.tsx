"use client";

import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import Link from 'next/link';

export default function HomePage() {
  return (
    <Shell>
      <div className="p-8 max-w-6xl mx-auto space-y-8">
        <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl font-bold text-black border-b-2 border-black/10 pb-4 mb-8"
        >
          Your Quizzes
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mock Existing Quiz */}
           <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.1 }}
           >
            <Card className="min-h-48 bg-[#d4d4d4] border-none shadow-md hover:shadow-lg transition-all flex flex-col p-6 justify-between relative overflow-hidden group">
                <div className="space-y-2 z-10">
                     <div className="w-12 h-12 bg-black/10 rounded-lg flex items-center justify-center mb-2">
                         <span className="text-2xl">🌍</span>
                     </div>
                     <h3 className="text-2xl font-black text-[#333] leading-tight">General Knowledge</h3>
                     <p className="text-[#666] font-bold">12 Questions</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-black/10 flex gap-2">
                    <Link href="/host" className="flex-1">
                        <Button className="w-full bg-[#333] text-white hover:bg-black font-bold shadow-sm">
                            Host
                        </Button>
                    </Link>
                     <Button variant="ghost" className="px-3 hover:bg-black/5 text-[#333]">
                        Edit
                    </Button>
                </div>
                {/* Decoration */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none transition-transform group-hover:scale-150" />
            </Card>
           </motion.div>

          {/* Create New Quiz Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ delay: 0.2 }}
          >
              <Link href="/create">
                <Card className="h-48 bg-[#a3a3a3] border-none shadow-none flex items-center justify-center hover:brightness-95 transition-all cursor-pointer group">
                    <Plus className="w-16 h-16 text-black group-hover:scale-110 transition-transform" />
                </Card>
              </Link>
          </motion.div>
        </div>
      </div>
    </Shell>
  );
}
