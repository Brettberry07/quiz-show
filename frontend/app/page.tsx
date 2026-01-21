"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Droplets, Waves, Hand, LogIn, User2 } from "lucide-react";
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#f1f1f1] text-[#111]">
      {/* Top Bar */}
      <header className="w-full bg-[#7a7a7a] text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15">
              <Droplets className="h-6 w-6" />
            </div>
            <span className="text-xl font-black tracking-tight">QuizSink</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium md:inline">Mhiki</span>
            <div className="h-10 w-10 rounded-full bg-white/80" />
          </div>
        </div>
      </header>

      {/* Centered Login */}
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-xl text-center"
        >
          <h1 className="mb-6 text-5xl font-black tracking-tight text-[#1a1a1a]">
            QuizSink
          </h1>

          <Card className="mx-auto w-full max-w-sm border-[#bdbdbd] bg-[#9e9e9e] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
            <div className="space-y-4">
              <Input
                placeholder="Game PIN"
                className="h-12 rounded-xl bg-[#d9d9d9] text-center text-base font-semibold text-[#222] placeholder:text-[#888]"
              />
               <Link href="/play" className="w-full">
                  <Button
                    className="h-12 w-full rounded-xl bg-[#2b2b2b] text-white hover:bg-black"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    Enter
                  </Button>
              </Link>
            </div>

            <div className="mt-6 space-y-3">
              <Input
                placeholder="Username"
                className="h-12 rounded-xl bg-[#d9d9d9] text-center text-base font-semibold text-[#222] placeholder:text-[#888]"
              />
              <Link href="/home" className="w-full">
                <Button
                    className="h-12 w-full rounded-xl bg-[#2b2b2b] text-white hover:bg-black"
                >
                    <User2 className="mr-2 h-4 w-4" />
                    Login
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

