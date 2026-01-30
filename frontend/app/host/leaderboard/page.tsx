"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useGame } from "@/context/GameContext";
import { ArrowRight, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
}

export default function LeaderboardPageWrapper() {
  return (
    <Suspense>
      <LeaderboardPage />
    </Suspense>
  );
}

function LeaderboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pin = searchParams.get("pin") || "";
  const { fetchWithAuth } = useUser();
  const { emitWithAck, connectSocket, onEvent, offEvent } = useGame();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const isLastQuestion = totalQuestions > 0 ? currentQuestionIndex + 1 >= totalQuestions : false;
  
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!pin || pin.length !== 6) return;
    let mounted = true;

    const sync = async () => {
      try {
        await connectSocket();
        const payload = await emitWithAck<{ data?: { leaderboard?: LeaderboardEntry[]; currentQuestionIndex?: number; totalQuestions?: number; state?: string } }>("sync_state", { pin });
        if (!mounted) return;
        const data = payload?.data ?? {};
        if (data.leaderboard) setEntries(data.leaderboard);
        setCurrentQuestionIndex(data.currentQuestionIndex ?? 0);
        setTotalQuestions(data.totalQuestions ?? 0);
      } catch (error) {
        console.error(error);
      }
    };

    const handleLeaderboard = (data: { entries?: LeaderboardEntry[]; currentQuestionIndex?: number; totalQuestions?: number }) => {
      if (!mounted) return;
      if (data.entries) setEntries(data.entries);
      if (typeof data.currentQuestionIndex === "number") setCurrentQuestionIndex(data.currentQuestionIndex);
      if (typeof data.totalQuestions === "number") setTotalQuestions(data.totalQuestions);
    };

    const handleQuestion = () => {
      router.push(`/host/game?pin=${pin}`);
    };

    const handleEnded = () => {
      router.push(`/host/winner?pin=${pin}`);
    };

    onEvent("leaderboard", handleLeaderboard as any);
    onEvent("question_active", handleQuestion);
    onEvent("game_ended", handleEnded);

    void sync();

    return () => {
      mounted = false;
      offEvent("leaderboard", handleLeaderboard as any);
      offEvent("question_active", handleQuestion);
      offEvent("game_ended", handleEnded);
    };
  }, [pin, emitWithAck, connectSocket, onEvent, offEvent, router]);

  // Auto-reveal animation
  useEffect(() => {
    const timer = setTimeout(() => setShowAll(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = async () => {
    if (!pin || pin.length !== 6) return;

    try {
      await connectSocket();
      const payload = await emitWithAck<{ data?: { hasMore?: boolean } }>("next_question", { pin });
      const hasMore = payload?.data?.hasMore ?? false;
      if (hasMore) {
        router.push(`/host/game?pin=${pin}`);
      } else {
        router.push(`/host/winner?pin=${pin}`);
      }
    } catch (error) {
      console.error(error);
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
            After Question {currentQuestionIndex + 1} of {totalQuestions}
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
          {entries.map((player, index) => (
            <motion.div
              key={player.playerId}
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
                    {player.rank}
                </div>

                {/* Player Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-[#1a1a1a] truncate">{player.nickname}</span>
                    {index === 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold">
                        LEADER
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {getChangeIcon("same")}
                    <span className="text-sm text-[#666]">
                      Holding steady
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
                  animate={showAll && entries[0] ? { width: `${(player.score / entries[0].score) * 100}%` } : {}}
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
