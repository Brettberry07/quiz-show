"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Droplets, ArrowRight } from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function JoinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 7) return; // Basic validation for xxx-xxx
    setLoading(true);
    // Simulate finding quiz
    setTimeout(() => {
        router.push(`/play?code=${code}`);
    }, 800);
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
    <div className="min-h-screen w-full bg-[#f1f1f1] text-[#111]">
      {/* Top Bar - Clean, just branding */}
      <header className="w-full bg-[#7a7a7a] text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link href="/home" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <Droplets className="h-6 w-6" />
            </div>
            <span className="text-xl font-black tracking-tight">QuizSink</span>
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
          className="w-full max-w-sm"
        >
          <div className="mb-8 text-center">
            <h1 className="text-6xl font-black tracking-tight text-[#1a1a1a] drop-shadow-sm uppercase">
              JOIN GAME
            </h1>
          </div>

          <Card className="border-none bg-[#9ca3af] p-6 shadow-xl rounded-md">
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

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading || code.length < 7}
                  className="h-14 w-full rounded-md border-b-4 border-[#111] bg-[#333] text-xl font-bold text-white hover:bg-[#222] hover:border-[#000] active:border-b-0 active:translate-y-1 transition-all disabled:opacity-70"
                >
                  <span className="flex items-center justify-center">
                    {loading ? "Joining..." : "Enter"}
                  </span>
                </Button>
              </div>

            </form>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
