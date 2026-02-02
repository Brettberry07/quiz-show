"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, Plus, UserCircle2 } from "lucide-react";

const QUESTION_TEXT_MAX_LENGTH = 200;
const ANSWER_OPTION_MAX_LENGTH = 100;
const CATEGORY_MAX_LENGTH = 50;


export interface Question {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  category?: string;
  author?: string;
  type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
  timeLimitSeconds: number;
  pointsMultiplier: number;
}

interface QuestionBuilderProps {
  onAddQuestion: (question: Question) => void;
  creatorName?: string;
}

export function QuestionBuilder({ onAddQuestion, creatorName = "You" }: QuestionBuilderProps) {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [category, setCategory] = useState("");
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(30);
  const [pointsMultiplier, setPointsMultiplier] = useState(1);
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number | null>(null);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value.slice(0, ANSWER_OPTION_MAX_LENGTH);
    setOptions(newOptions);
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.trim()) {
      alert("Please enter a question");
      return;
    }
    
    if (options.some(opt => !opt.trim())) {
      alert("Please fill in all 4 answer choices");
      return;
    }

    if (correctOption === null) {
      alert("Please select the correct answer");
      return;
    }

    if (timeLimitSeconds < 5) {
      alert("Time limit must be at least 5 seconds");
      return;
    }

    if (pointsMultiplier < 0.1) {
      alert("Points multiplier must be at least 0.1");
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      text: currentQuestion,
      category: category.trim() || undefined,
      author: creatorName,
      options: [...options],
      correctOptionIndex: correctOption,
      type: "MULTIPLE_CHOICE",
      timeLimitSeconds,
      pointsMultiplier,
    };

    onAddQuestion(newQuestion);
    
    // Reset form
    setCurrentQuestion("");
    setCategory("");
    setTimeLimitSeconds(30);
    setPointsMultiplier(1);
    setOptions(["", "", "", ""]);
    setCorrectOption(null);
  };

  const optionColors = [
    "bg-red-50 border-red-200",
    "bg-blue-50 border-blue-200",
    "bg-amber-50 border-amber-200",
    "bg-green-50 border-green-200"
  ];

  const optionLabels = ["A", "B", "C", "D"];

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-[#A59A9A] overflow-hidden">
      {/* Question Input Area */}
      <div className="p-8 bg-white flex flex-col items-center justify-center min-h-40 border-b border-[#A59A9A]/30 shadow-sm relative z-0">
         
         {/* Creator Badge */}
         <div className="absolute top-4 left-4 flex items-center gap-2 bg-[#A59A9A] px-3 py-1.5 rounded-full border border-[#8B8080]">
            <UserCircle2 className="w-4 h-4 text-[#3D3030]" />
            <span className="text-xs font-bold text-[#3D3030] uppercase tracking-wide">
              Creator: {creatorName}
            </span>
         </div>

         <div className="w-full max-w-3xl space-y-4">
           <div className="relative">
             <Input
               value={currentQuestion}
               onChange={(e) => setCurrentQuestion(e.target.value.slice(0, QUESTION_TEXT_MAX_LENGTH))}
               placeholder="Start typing your question here..."
               className="bg-[#e5e5e5] border-2 border-[#cfcfcf] shadow-inner text-center text-xl md:text-2xl font-bold h-20 rounded-xl focus:ring-4 focus:ring-[#A59A9A]/30 focus:border-[#3D3030]"
               maxLength={QUESTION_TEXT_MAX_LENGTH}
             />
             <span className={`absolute bottom-2 right-3 text-xs font-semibold ${currentQuestion.length >= QUESTION_TEXT_MAX_LENGTH ? 'text-red-500' : 'text-[#888]'}`}>
               {currentQuestion.length}/{QUESTION_TEXT_MAX_LENGTH}
             </span>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
             <div className="relative">
               <Input
                 value={category}
                 onChange={(e) => setCategory(e.target.value.slice(0, CATEGORY_MAX_LENGTH))}
                 placeholder="Category (optional)"
                 className="bg-[#f7f7f7] border-2 border-[#cfcfcf] rounded-xl h-12 font-semibold"
                 maxLength={CATEGORY_MAX_LENGTH}
               />
               <span className={`absolute bottom-1 right-2 text-xs font-semibold ${category.length >= CATEGORY_MAX_LENGTH ? 'text-red-500' : 'text-[#888]'}`}>
                 {category.length}/{CATEGORY_MAX_LENGTH}
               </span>
             </div>
             <Input
               type="number"
               min={5}
               value={timeLimitSeconds}
              onChange={(e) => {
                const value = Number(e.target.value);
                setTimeLimitSeconds(Number.isNaN(value) ? 0 : value);
              }}
               placeholder="Time limit (sec)"
               className="bg-[#f7f7f7] border-2 border-[#cfcfcf] rounded-xl h-12 font-semibold"
             />
             <Input
               type="number"
               min={0.1}
               step={0.1}
               value={pointsMultiplier}
              onChange={(e) => {
                const value = Number(e.target.value);
                setPointsMultiplier(Number.isNaN(value) ? 0 : value);
              }}
               placeholder="Points multiplier"
               className="bg-[#f7f7f7] border-2 border-[#cfcfcf] rounded-xl h-12 font-semibold"
             />
           </div>
         </div>
      </div>

      {/* Answer Options Area */}
      <div className="p-6 md:p-8 bg-[#f5f5f5]">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
             {options.map((option, index) => (
                 <div 
                   key={index} 
                   onClick={() => setCorrectOption(index)}
                   className={`relative group cursor-pointer transition-all duration-200 transform ${
                       correctOption === index ? 'scale-[1.02] ring-4 ring-green-400 ring-offset-2 z-10' : 'hover:scale-[1.01]'
                   }`}
                 >
                    <div className={`h-full p-4 rounded-xl flex flex-col gap-3 shadow-sm border-b-4 active:border-b-0 active:translate-y-1 transition-all ${
                        optionColors[index]
                    }`}>
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                               <span className="font-black text-[#3D3030]/30 text-2xl">{optionLabels[index]}</span>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                correctOption === index 
                                  ? 'bg-green-500 text-white shadow-md rotate-0' 
                                  : 'bg-black/5 text-transparent scale-0 group-hover:scale-100'
                            }`}>
                                <Check className="w-5 h-5 stroke-3" />
                            </div>
                        </div>
                        <div className="relative">
                          <Input
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Answer option ${index + 1}`}
                              className="bg-white/90 border-transparent shadow-sm focus:border-[#A59A9A] font-semibold text-lg py-6"
                              onClick={(e) => e.stopPropagation()}
                              maxLength={ANSWER_OPTION_MAX_LENGTH}
                          />
                          <span className={`absolute bottom-1 right-2 text-xs font-semibold ${option.length >= ANSWER_OPTION_MAX_LENGTH ? 'text-red-500' : 'text-[#888]'}`}>
                            {option.length}/{ANSWER_OPTION_MAX_LENGTH}
                          </span>
                        </div>
                    </div>
                 </div>
             ))}
         </div>
         
         <div className="flex justify-end pt-2 border-t border-[#A59A9A]/30">
           <Button 
             onClick={handleAddQuestion}
             className="bg-[#202020] hover:bg-[#333] text-white font-bold px-10 py-4 rounded-xl shadow-lg border-b-4 border-[#111] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 text-lg"
           >
             <Plus className="w-6 h-6" />
             Add Question
           </Button>
         </div>
      </div>
    </div>
  );
}
