"use client";

import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";

export default function CreatePage() {
  return (
    <Shell>
      <div className="p-8 max-w-5xl mx-auto space-y-8">
        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-black">Quiz Information:</h2>
            
            <div className="grid gap-4 max-w-3xl pl-4">
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="font-bold text-black text-right">Quiz Name:</label>
                <div className="bg-[#a3a3a3] rounded-md h-10 w-full" />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="font-bold text-black text-right">Description:</label>
                <div className="bg-[#a3a3a3] rounded-md h-10 w-full" />
              </div>
            </div>
          </div>
        </motion.section>

        <hr className="border-black/20" />

        <motion.section 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
           <h2 className="text-2xl font-bold text-black">Add Questions:</h2>

           <div className="bg-[#a3a3a3] rounded-xl p-8 space-y-4 max-w-4xl shadow-inner">
                <div className="space-y-2">
                    <label className="font-bold text-black">Question:</label>
                    {/* Placeholder for question input visualization from image */}
                </div>
                
                 <div className="space-y-2 mt-4">
                    <label className="font-bold text-black">Answer:</label>
                     <div className="h-32"></div> {/* Spacer for the big gray block */}
                </div>
           </div>

           <div className="flex justify-end max-w-4xl">
              <Button className="bg-[#a3a3a3] text-black font-bold uppercase tracking-wider hover:bg-[#999] px-8 rounded-md shadow-sm">
                Add
              </Button>
           </div>
        </motion.section>
      </div>
    </Shell>
  );
}
