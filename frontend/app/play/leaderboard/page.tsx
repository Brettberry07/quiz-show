"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trophy, TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

// Simulated player data with scores (player's perspective)
const SIMULATED_LEADERBOARD = [
  { name: "QuizWhiz", score: 2450, change: "up" },
  { name: "Big Brain", score: 2200, change: "down" },
  { name: "FastFingers", score: 1980, change: "same" },
  { name: "TriviaMaster", score: 1750, change: "up" },
  { name: "KnowledgeKing", score: 1600, change: "down" },
];

export default function PlayerLeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username } = useUser();
  const currentQuestion = parseInt(searchParams.get("q") || "1");
  const totalQuestions = parseInt(searchParams.get("total") || "12");
  const pointsEarned = parseInt(searchParams.get("points") || "0");
  const wasCorrect = searchParams.get("correct") === "true";
  const isLastQuestion = currentQuestion >= totalQuestions;

  const [showAll, setShowAll] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);

  // Create player's leaderboard entry
  const playerEntry = {
    name: username || "You",
    score: 1850 + pointsEarned, // Base score + points from this question
    change: wasCorrect ? "up" : "same",
    isPlayer: true,
  };

  // Insert player into leaderboard at appropriate position
  const fullLeaderboard = [...SIMULATED_LEADERBOARD, playerEntry].sort(
    (a, b) => b.score - a.score
  );

  // Auto-reveal animation
  useEffect(() => {
    const timer = setTimeout(() => setShowAll(true), 500);
    return () => clearTimeout(timer);
  }, []);

  // Simulate waiting for host to advance (in real app, this would be a socket event)
  useEffect(() => {
    const timer = setTimeout(() => {
      setWaitingForNext(true);
    }, 3000);

    // Auto-advance after some time (simulating host advancing)
    const advanceTimer = setTimeout(() => {
      if (isLastQuestion) {
        router.push("/host/winner");
      } else {
        router.push(`/play?q=${currentQuestion + 1}&total=${totalQuestions}`);
      }
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(advanceTimer);
    };
  }, [currentQuestion, totalQuestions, isLastQuestion, router]);

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

  const playerRank = fullLeaderboard.findIndex((p) => "isPlayer" in p) + 1;

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
        <div className="flex items-center gap-3 text-white">
          <span className="text-xl font-medium">{username || "Player"}</span>
          <div className="h-10 w-10 rounded-full bg-white/80" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-6 px-4 overflow-y-auto">
        {/* Points Earned Banner */}
        {pointsEarned > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 bg-green-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg"
          >
            +{pointsEarned} points! 🎉
          </motion.div>
        )}

        {/* Your Rank Highlight */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <p className="text-lg text-[#666] font-medium mb-1">You&apos;re currently in</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-6xl font-black text-[#1a1a1a]">#{playerRank}</span>
            <span className="text-2xl text-[#666]">place</span>
          </div>
        </motion.div>

        {/* Leaderboard List */}
        <div className="w-full max-w-md space-y-2">
          {fullLeaderboard.slice(0, 5).map((player, index) => {
            const isCurrentPlayer = "isPlayer" in player;
            return (
              <motion.div
                key={player.name}
                initial={{ opacity: 0, x: -30 }}
                animate={showAll ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 300, damping: 25 }}
                className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                  isCurrentPlayer
                    ? "ring-2 ring-[#3D3030] shadow-md"
                    : ""
                }`}
              >
                <div className="flex items-center p-3 gap-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${getRankBadge(
                      index + 1
                    )}`}
                  >
                    {index + 1}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold truncate ${
                          isCurrentPlayer ? "text-[#3D3030]" : "text-[#1a1a1a]"
                        }`}
                      >
                        {isCurrentPlayer ? "You" : player.name}
                      </span>
                      {isCurrentPlayer && (
                        <span className="text-xs bg-[#3D3030] text-white px-2 py-0.5 rounded-full font-bold">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    {getChangeIcon(player.change)}
                    <span className="text-xl font-black text-[#3D3030]">
                      {player.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Waiting Message */}
        {waitingForNext && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 flex flex-col items-center gap-3 text-[#666]"
          >
            <Clock className="w-8 h-8 animate-pulse" />
            <p className="font-medium">Waiting for next question...</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
