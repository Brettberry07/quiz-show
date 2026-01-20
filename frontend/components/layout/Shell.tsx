"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, Home, Library, Plus, Search, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-header-bg text-white h-16 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2">
            <Droplets className="h-8 w-8" />
            <span className="text-2xl font-black tracking-tight">QuizSink</span>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
            <Link href="/home" className={cn("px-4 py-2 bg-secondary/20 rounded-md font-bold hover:bg-secondary/40 transition", pathname === '/home' && "bg-white/20")}>
                Join
            </Link>
            <Link href="/create" className={cn("px-4 py-2 bg-secondary/20 rounded-md font-bold hover:bg-secondary/40 transition", pathname.includes('/create') && "bg-white/20")}>
                Create
            </Link>

            <span className="hidden md:inline font-medium ml-4">Berrybr</span>
            <div className="h-10 w-10 rounded-full bg-white/80" />
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 bg-[#a3a3a3] flex-col p-4 gap-2 text-black">
           <nav className="space-y-2">
                <Link href="/home">
                    <span className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors",
                        pathname === "/home" ? "bg-white/50 text-black shadow-sm" : "hover:bg-white/20"
                    )}>
                        <Home className="w-5 h-5" />
                        Home
                    </span>
                </Link>
                <Link href="/home"> {/* Usually a different route, but kept as dashboard for now */}
                    <span className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors",
                         pathname === "/library" ? "bg-white/50 text-black shadow-sm" : "hover:bg-white/20"
                    )}>
                        <Library className="w-5 h-5" />
                        Library
                    </span>
                </Link>
           </nav>
           
           <div className="mt-auto pt-4 border-t border-black/10">
                 <Link href="/">
                    <span className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold hover:bg-white/20 transition-colors text-black/70">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </span>
                </Link>
           </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-h-0 bg-[#f0f0f0]">
             {children}
        </main>
      </div>
    </div>
  );
}
