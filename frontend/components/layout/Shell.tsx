"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, Home, Library, Plus, Search, Settings, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/UserContext";

interface ShellProps {
  children: React.ReactNode;
}

export function Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const { username } = useUser();

  return (
    <div className="min-h-screen text-foreground flex flex-col" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full bg-[#3D3030] text-white h-16 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/home" className="flex items-center gap-2">
            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
            <Link href="/join" className={cn("px-4 py-2 bg-white/10 rounded-md font-bold hover:bg-white/20 transition", pathname === '/join' && "bg-white/20")}>
                Join
            </Link>
            <Link href="/create" className={cn("px-4 py-2 bg-white/10 rounded-md font-bold hover:bg-white/20 transition", pathname.includes('/create') && "bg-white/20")}>
                Create
            </Link>

            <div className="flex items-center gap-2 ml-4">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <span className="hidden md:inline font-medium">{username || "Guest"}</span>
            </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 bg-[#A59A9A] flex-col p-4 gap-2 text-black">
           <nav className="space-y-2">
                <Link href="/home">
                    <span className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors",
                        pathname === "/home" ? "bg-white/50 text-black shadow-sm" : "hover:bg-white/30"
                    )}>
                        <Home className="w-5 h-5" />
                        Home
                    </span>
                </Link>
                <Link href="/home"> {/* Usually a different route, but kept as dashboard for now */}
                    <span className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-colors",
                         pathname === "/library" ? "bg-white/50 text-black shadow-sm" : "hover:bg-white/30"
                    )}>
                        <Library className="w-5 h-5" />
                        Library
                    </span>
                </Link>
           </nav>
           
           <div className="mt-auto pt-4 border-t border-black/10">
                 <Link href="/">
                    <span className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold hover:bg-white/30 transition-colors text-black/70">
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </span>
                </Link>
           </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto min-h-0">
             {children}
        </main>
      </div>
    </div>
  );
}
