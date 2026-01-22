"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import { User, Copy, ArrowRight, Music, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Droplets } from "lucide-react";
import { useRouter } from "next/navigation";

const SIMULATED_PLAYERS = [
  "Big Brain", "QuizWhiz", "FastFingers", "TriviaMaster", "Guesser", "KnowledgeKing", "SmartyPants", "TheWinner"
];

export default function HostPage() {
    const router = useRouter();
    const [players, setPlayers] = useState<string[]>([]);
    const code = "123-456";

    useEffect(() => {
        let currentIndex = 0;
        const interval = setInterval(() => {
            if (currentIndex < SIMULATED_PLAYERS.length) {
                setPlayers(prev => [...prev, SIMULATED_PLAYERS[currentIndex]]);
                currentIndex++;
            } else {
                clearInterval(interval);
            }
        }, 1500); // New player every 1.5 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen flex flex-col text-[#111]" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
            {/* Header with Branding and Code */}
             <div className="bg-[#3D3030] text-white shadow-md relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between py-4 px-6 relative z-10">
                     <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <Link href="/home">
                            <div className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                                <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
                            </div>
                        </Link>
                    </div>

                    <div className="flex flex-col items-center bg-black/20 px-8 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-1">Game PIN</span>
                        <div className="text-5xl font-black tracking-widest font-mono text-white drop-shadow-md">{code}</div>
                    </div>
                     
                    <div className="flex items-center gap-2 mt-4 md:mt-0 opacity-0 md:opacity-100">
                        {/* Spacer or Settings */}
                         <Button variant="ghost" className="text-white hover:bg-white/10 h-10 w-10 p-0">
                            <Settings className="w-6 h-6" />
                         </Button>
                         <Button variant="ghost" className="text-white hover:bg-white/10 h-10 w-10 p-0">
                            <Music className="w-6 h-6" />
                         </Button>
                    </div>
                </div>
            </div>

            {/* Players Grid */}
            <main className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col">
              <div className="bg-white rounded-lg shadow-lg p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-end mb-8 border-b-2 border-[#A59A9A] pb-4">
                     <div className="flex items-center gap-3">
                        <div className="bg-[#3D3030] p-2 rounded-lg">
                            <User className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-[#333]">Players</h2>
                            <p className="font-bold text-[#666]">Waiting for players to join...</p>
                        </div>
                     </div>
                     <h3 className="text-4xl font-black text-[#333] bg-[#A59A9A] px-4 py-1 rounded-lg">
                        {players.length}
                     </h3>
                </div>
               
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-min flex-1 content-start">
                <AnimatePresence>
                    {players.map((player) => (
                        <motion.div
                            key={player}
                            initial={{ opacity: 0, scale: 0.5, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        >
                            <Card className="bg-[#3D3030] border-none text-white font-bold text-xl h-20 flex items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.2)] hover:scale-105 transition-transform cursor-default">
                                {player}
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {players.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center text-[#999] py-20 animate-pulse">
                         <div className="h-20 w-20 rounded-full border-4 border-[#ccc] border-t-[#666] animate-spin mb-4" />
                        <p className="text-xl font-bold">Waiting for players...</p>
                     </div>
                )}
               </div>

                <div className="mt-8 flex justify-end">
                     <Button
                        onClick={() => router.push('/host/game')} 
                        className="h-14 px-12 bg-[#202020] text-white text-xl font-black hover:bg-[#333] hover:scale-105 active:scale-95 transition-all shadow-xl rounded-full border-b-4 border-[#111] active:border-b-0 active:translate-y-1"
                     >
                        Start Game <ArrowRight className="ml-2 w-6 h-6" />
                     </Button>
                </div>
              </div>
            </main>
        </div>
    )
}
