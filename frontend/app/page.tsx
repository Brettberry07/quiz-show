"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { USERNAME_MAX_LENGTH } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [usernameInput, setUsernameInput] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const { login, isAuthenticating } = useUser();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const result = await login(usernameInput.trim());
    if (!result.ok) {
      setErrorMessage(result.error || "Login failed");
      return;
    }
    router.push("/home");
  };

  return (
    <div className="min-h-screen w-full text-[#111]" style={{ backgroundImage: "url('/TileBG.svg')", backgroundRepeat: "repeat", backgroundSize: "auto" }}>
      {/* Top Bar - Same as Shell */}
      <header className="sticky top-0 z-40 w-full  bg-[#3D3030] text-white h-16 flex items-center justify-between px-6 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/text.svg" alt="QuizSink Logo" className="w-36 h-36" />

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
          className="w-full max-w-2xl"
        >
          
        <div className="bg-white rounded-lg shadow-lg p-8 ">
        <div className="mb-8 text-center">
          <img src="/QuizSink.svg" alt="QuizSink Logo" className="w-90 mx-auto" />
        </div>

        <Card className="border-none bg-[#A59A9A] p-6 shadow-xl rounded-md">
          <form onSubmit={handleLogin} className="space-y-4">
          
          <div className="space-y-2">
            <div className="relative">
              <Input
                type="text"
                placeholder="Username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.slice(0, USERNAME_MAX_LENGTH))}
                className="h-14 rounded-md border-b-4 border-[#cfcfcf] bg-[#e5e5e5] px-4 text-center text-xl font-bold text-[#555] placeholder:text-[#999] focus-visible:ring-0 focus-visible:border-[#555] transition-all"
                maxLength={USERNAME_MAX_LENGTH}
              />
              <span className={`absolute bottom-1 right-3 text-xs font-semibold ${usernameInput.length >= USERNAME_MAX_LENGTH ? 'text-red-500' : 'text-[#888]'}`}>
                {usernameInput.length}/{USERNAME_MAX_LENGTH}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-md bg-red-100 text-red-700 px-4 py-2 text-sm font-semibold text-center">
              {errorMessage}
            </div>
          )}

          <p className="text-center text-sm text-[#333]">
            {mode === "register"
              ? "Create an account with just a username."
              : "New here? Create an account with just a username."}
          </p>

          <div className="pt-2">
            <Button
            type="submit"
            disabled={isAuthenticating || !usernameInput.trim()}
            className="h-14 w-full rounded-md border-b-4 border-[#111] bg-[#202020] text-xl font-bold text-white hover:bg-[#222] hover:border-black active:border-b-0 active:translate-y-1 transition-all disabled:opacity-70"
            >
            <span className="flex items-center justify-center">
          {isAuthenticating ? "Signing in..." : mode === "register" ? "Create Account" : "Login"}
            </span>
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="text-sm font-bold text-[#202020] hover:underline"
            >
              {mode === "login" ? "Need an account? Register" : "Have an account? Login"}
            </button>
          </div>

          </form>
        </Card>
        </div>
        </motion.div>
      </main>
    </div>
  );
}

