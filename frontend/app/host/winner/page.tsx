"use client";

import { motion } from "framer-motion";
import Link from 'next/link';
import Image from "next/image";
import { Crown, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/context/UserContext";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function WinnerPage() {
    const { username, fetchWithAuth } = useUser();
    const searchParams = useSearchParams();
    const pin = searchParams.get("pin") || "";
    const [leaders, setLeaders] = useState<string[]>(["Player 1", "Player 2", "Player 3"]);

    useEffect(() => {
        if (!pin || pin.length !== 6) return;
        let mounted = true;
        const loadLeaderboard = async () => {
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5200"}/game/${pin}/leaderboard?limit=3`).catch(() => null);
            if (!response || !response.ok) return;
            const payload = await response.json();
            if (mounted) {
                const entries = payload.data.entries || [];
                setLeaders([
                    entries[0]?.nickname || "Player 1",
                    entries[1]?.nickname || "Player 2",
                    entries[2]?.nickname || "Player 3",
                ]);
            }
        };
        void loadLeaderboard();
        return () => {
            mounted = false;
        };
    }, [pin, fetchWithAuth]);
  // Winner Page Implementation
  return (
    <div className="min-h-screen w-full flex flex-col overflow-hidden" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
      
      {/* Top Header */}
      <header className="w-full h-16 bg-[#3D3030] flex items-center justify-between px-6 shadow-md z-10">
        <div className="flex items-center gap-3 text-white">
            <Image src="/text.svg" alt="QuizSink Logo" width={144} height={144} className="w-36 h-36" />
        </div>
        <div className="flex items-center gap-3 text-white">
            <span className="text-xl font-medium">{username || "Host"}</span>
            <div className="h-10 w-10 rounded-full bg-[#d9d9d9]" />
        </div>
      </header>

      {/* Podium Section */}
      <main className="flex-1 flex items-end justify-center pb-0 px-4 relative">
        <div className="absolute top-8 right-8 z-20 flex gap-3">
            <Link href={`/host/review?pin=${pin}`}>
                <Button variant="secondary" className="bg-[#A59A9A] text-[#333] hover:bg-[#958A8A] border-b-4 border-[#857A7A] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Review Questions
                </Button>
            </Link>
            <Link href="/home">
                <Button variant="secondary" className="bg-[#3D3030] text-white hover:bg-[#2D2020] border-b-4 border-[#1D1010] active:border-b-0 active:translate-y-1 transition-all">
                    Back Home
                </Button>
            </Link>
        </div>
        
         <div className="flex items-end justify-center w-full max-w-4xl gap-4 md:gap-8 h-full pb-0">
            
            {/* 3rd Place (Left) */}
            <div className="flex flex-col items-center w-1/4 max-w-50">
                 <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.4 }}
                    className="mb-4 text-center"
                >
                    <span className="text-xl font-bold text-[#444] block">{leaders[2]}</span>
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
                    <span className="text-2xl font-black text-[#222] block">{leaders[0]}</span>
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
                    <span className="text-xl font-bold text-[#444] block">{leaders[1]}</span>
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
