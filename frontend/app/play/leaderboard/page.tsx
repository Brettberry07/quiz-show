"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TrendingUp, TrendingDown, Minus, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useGame } from "@/context/GameContext";

interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
}

export default function PlayerLeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, fetchWithAuth } = useUser();
  const { connectSocket, onEvent, offEvent } = useGame();
  const pin = searchParams.get("pin") || "";
  const pointsEarned = parseInt(searchParams.get("points") || "0");
  const wasCorrect = searchParams.get("correct") === "true";

  const [showAll, setShowAll] = useState(false);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    if (!pin) return;
    let mounted = true;
    const pollLeaderboard = async () => {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5200"}/game/${pin}/leaderboard?limit=10`);
      const payload = await response.json();
      if (mounted && response.ok) {
        setEntries(payload.data.entries || []);
      }
    };
    void pollLeaderboard();
    const interval = setInterval(pollLeaderboard, 2000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [pin, fetchWithAuth]);

  // Auto-reveal animation
  useEffect(() => {
    const timer = setTimeout(() => setShowAll(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!pin) return;
    const timer = setTimeout(() => {
      setWaitingForNext(true);
    }, 2000);

    const onQuestion = () => {
      router.push(`/play?pin=${pin}`);
    };

    const onEnded = () => {
      router.push(`/host/winner?pin=${pin}`);
    };

    const onLeaderboard = (data: { entries?: LeaderboardEntry[] }) => {
      if (data?.entries) {
        setEntries(data.entries);
      }
    };

    void connectSocket();
    onEvent("question_active", onQuestion);
    onEvent("game_ended", onEnded);
    onEvent("leaderboard", onLeaderboard);

    return () => {
      clearTimeout(timer);
      offEvent("question_active", onQuestion);
      offEvent("game_ended", onEnded);
      offEvent("leaderboard", onLeaderboard);
    };
  }, [pin, router, connectSocket, onEvent, offEvent]);

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

  const playerRank = entries.findIndex((p) => p.nickname === (username || "You")) + 1;

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
          {entries.slice(0, 5).map((player, index) => {
            const isCurrentPlayer = player.nickname === (username || "You");
            return (
              <motion.div
                key={player.playerId}
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
                    {player.rank}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold truncate ${
                          isCurrentPlayer ? "text-[#3D3030]" : "text-[#1a1a1a]"
                        }`}
                      >
                        {isCurrentPlayer ? "You" : player.nickname}
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
                    {getChangeIcon(wasCorrect ? "up" : "same")}
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
