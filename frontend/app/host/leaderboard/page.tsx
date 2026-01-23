"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ArrowRight, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";

// Simulated player data with scores
const SIMULATED_LEADERBOARD = [
  { name: "QuizWhiz", score: 2450, previousRank: 2, change: "up" },
  { name: "Big Brain", score: 2200, previousRank: 1, change: "down" },
  { name: "FastFingers", score: 1980, previousRank: 3, change: "same" },
  { name: "TriviaMaster", score: 1750, previousRank: 5, change: "up" },
  { name: "KnowledgeKing", score: 1600, previousRank: 4, change: "down" },
  { name: "SmartyPants", score: 1450, previousRank: 6, change: "same" },
  { name: "Guesser", score: 1200, previousRank: 8, change: "up" },
  { name: "TheWinner", score: 950, previousRank: 7, change: "down" },
];

export default function LeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuestion = parseInt(searchParams.get("q") || "1");
  const totalQuestions = parseInt(searchParams.get("total") || "12");
  const isLastQuestion = currentQuestion >= totalQuestions;
  
  const [showAll, setShowAll] = useState(false);

  // Auto-reveal animation
  useEffect(() => {
    const timer = setTimeout(() => setShowAll(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (isLastQuestion) {
      router.push("/host/winner");
    } else {
      router.push(`/host/game?q=${currentQuestion + 1}&total=${totalQuestions}`);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900";
    if (rank === 2) return "bg-gray-300 text-gray-700";
    if (rank === 3) return "bg-amber-600 text-amber-100";
    return "bg-[#3D3030] text-white";
  };

  const getChangeIcon = (change: string) => {
    if (change === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col overflow-hidden"
      style={{
        backgroundImage: "url('/TileBG.svg')",
        backgroundRepeat: "repeat",
        backgroundSize: "auto",
      }}
    >
      {/* Header */}
      <header className="w-full h-16 bg-[#3D3030] flex items-center justify-between px-6 shadow-md z-10 shrink-0">
        <div className="flex items-center gap-3 text-white">
          <Link href="/home">
            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
          </Link>
        </div>
        <div className="flex flex-col items-center text-white">
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">
            After Question {currentQuestion} of {totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-3 text-white opacity-0">
          <span className="text-xl font-medium">Spacer</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-8 px-4 overflow-y-auto">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <h1 className="text-4xl md:text-5xl font-black text-[#1a1a1a]">Leaderboard</h1>
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <p className="text-lg text-[#666] font-medium">See who&apos;s leading the pack!</p>
        </motion.div>

        {/* Leaderboard List */}
        <div className="w-full max-w-2xl space-y-3">
          {SIMULATED_LEADERBOARD.map((player, index) => (
            <motion.div
              key={player.name}
              initial={{ opacity: 0, x: -50 }}
              animate={showAll ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 300, damping: 25 }}
              className={`bg-white rounded-xl shadow-md overflow-hidden border-2 ${
                index === 0 ? "border-yellow-400 shadow-yellow-200" : "border-transparent"
              }`}
            >
              <div className="flex items-center p-4 gap-4">
                {/* Rank Badge */}
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl shrink-0 ${getRankBadge(
                    index + 1
                  )}`}
                >
                  {index + 1}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#1a1a1a] truncate">{player.name}</span>
                    {index === 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                        LEADER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getChangeIcon(player.change)}
                    <span className="text-sm text-[#666]">
                      {player.change === "up" && "Moved up!"}
                      {player.change === "down" && "Dropped"}
                      {player.change === "same" && "Holding steady"}
                    </span>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-[#3D3030]">
                    {player.score.toLocaleString()}
                  </div>
                  <div className="text-xs text-[#999] font-medium uppercase tracking-wide">points</div>
                </div>
              </div>

              {/* Progress Bar (relative to leader) */}
              <div className="h-1 bg-[#e5e5e5]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={showAll ? { width: `${(player.score / SIMULATED_LEADERBOARD[0].score) * 100}%` } : {}}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  className={`h-full ${index === 0 ? "bg-yellow-400" : "bg-[#A59A9A]"}`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Next Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-8"
        >
          <Button
            onClick={handleNext}
            className="h-14 px-12 bg-[#202020] text-white text-xl font-black hover:bg-[#333] hover:scale-105 active:scale-95 transition-all shadow-xl rounded-full border-b-4 border-[#111] active:border-b-0 active:translate-y-1"
          >
            {isLastQuestion ? "See Final Results" : "Next Question"}
            <ArrowRight className="ml-2 w-6 h-6" />
          </Button>
        </motion.div>
      </main>
    </div>
  );
}
