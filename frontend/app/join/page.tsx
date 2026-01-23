"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/context/UserContext";

export default function JoinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { username, fetchWithAuth } = useUser();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5200";

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 7) return; // Basic validation for xxx-xxx
    setLoading(true);
    setErrorMessage(null);

    try {
      const pin = code.replace("-", "");
      const response = await fetchWithAuth(`${API_BASE_URL}/game/${pin}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: username || "Player" }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to join game");
      }

      router.push(`/play?pin=${pin}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to join game";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }
    if (value.length > 7) {
      value = value.slice(0, 7);
    }
    
    setCode(value);
  };

  return (
    <div className="min-h-screen w-full text-[#111]" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
      {/* Top Bar - Same as Shell */}
      <header className="sticky top-0 z-40 w-full bg-[#3D3030] text-white h-16 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-14">
        
        {/* Animated Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-2xl"
        >
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8 text-center">
            <img src="/QuizSink.svg" alt="QuizSink Logo" className="w-90 mx-auto mb-4" />
            <h2 className="text-3xl font-black tracking-tight text-[#1a1a1a] uppercase">
              JOIN GAME
            </h2>
          </div>

          <Card className="border-none bg-[#A59A9A] p-6 shadow-xl rounded-md">
            <form onSubmit={handleJoin} className="space-y-4">
              
              <div className="space-y-2">
                <Input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="XXX-XXX"
                  className="h-14 rounded-md border-b-4 border-[#cfcfcf] bg-[#e5e5e5] px-4 text-center text-2xl font-black tracking-wider text-[#555] placeholder:text-[#999] focus-visible:ring-0 focus-visible:border-[#555] transition-all uppercase"
                />
              </div>

              {errorMessage && (
                <div className="rounded-md bg-red-100 text-red-700 px-4 py-2 text-sm font-semibold text-center">
                  {errorMessage}
                </div>
              )}

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading || code.length < 7}
                  className="h-14 w-full rounded-md border-b-4 border-[#111] bg-[#202020] text-xl font-bold text-white hover:bg-[#222] hover:border-black active:border-b-0 active:translate-y-1 transition-all disabled:opacity-70"
                >
                  <span className="flex items-center justify-center">
                    {loading ? "Joining..." : "Enter"}
                  </span>
                </Button>
              </div>

            </form>
          </Card>
        </div>
        </motion.div>
      </main>
    </div>
  );
}
