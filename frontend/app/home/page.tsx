"use client";

import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
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
            <Card className="h-48 bg-[#a3a3a3] border-none shadow-none hover:brightness-95 transition-all cursor-pointer">
              {/* Placeholder content for quiz card */}
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
