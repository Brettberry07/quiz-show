"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Droplets } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate network delay
    setTimeout(() => {
        router.push("/home");
    }, 800);
  };

  return (
    <div className="min-h-screen w-full bg-[#f1f1f1] text-[#111]">
      {/* Top Bar - Clean, just branding */}
      <header className="w-full bg-[#7a7a7a] text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <Droplets className="h-6 w-6" />
            </div>
            <span className="text-xl font-black tracking-tight">QuizSink</span>
          </div>
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
            <h1
              className="text-6xl font-bold tracking-tight text-[#1a1a1a] drop-shadow-sm uppercase"
              style={{ fontFamily: "Jaro" }}
            >
              QuizSink
            </h1>
          </div>

          <Card className="border-none bg-[#9ca3af] p-6 shadow-xl rounded-md">
            <form onSubmit={handleLogin} className="space-y-4">
              
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="Username"
                  className="h-14 rounded-md border-b-4 border-[#cfcfcf] bg-[#e5e5e5] px-4 text-center text-xl font-bold text-[#555] placeholder:text-[#999] focus-visible:ring-0 focus-visible:border-[#555] transition-all"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-14 w-full rounded-md border-b-4 border-[#111] bg-[#333] text-xl font-bold text-white hover:bg-[#222] hover:border-black active:border-b-0 active:translate-y-1 transition-all disabled:opacity-70"
                >
                  <span className="flex items-center justify-center">
                    {loading ? "Logging in..." : "Login"}
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

