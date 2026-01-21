"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Check, Plus, UserCircle2 } from "lucide-react";

export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  creator?: string;
}

interface QuestionBuilderProps {
  onAddQuestion: (question: Question) => void;
  creatorName?: string;
}

export function QuestionBuilder({ onAddQuestion, creatorName = "You" }: QuestionBuilderProps) {
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState<number | null>(null);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
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

    const newQuestion: Question = {
      id: Date.now().toString(),
      question: currentQuestion,
      options: [...options],
      correctAnswer: correctOption,
      creator: creatorName,
    };

    onAddQuestion(newQuestion);
    
    // Reset form
    setCurrentQuestion("");
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
    <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Question Input Area */}
      <div className="p-8 bg-white flex flex-col items-center justify-center min-h-40 border-b border-slate-100 shadow-sm relative z-0">
         
         {/* Creator Badge */}
         <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <UserCircle2 className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              Creator: {creatorName}
            </span>
         </div>

         <Input
           value={currentQuestion}
           onChange={(e) => setCurrentQuestion(e.target.value)}
           placeholder="Start typing your question here..."
           className="bg-slate-50 border-2 border-slate-200 shadow-inner text-center text-xl md:text-2xl font-bold h-20 rounded-xl max-w-3xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400"
         />
      </div>

      {/* Answer Options Area */}
      <div className="p-6 md:p-8 bg-slate-50/50">
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
                               <span className="font-black text-slate-400/50 text-2xl">{optionLabels[index]}</span>
                            </div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                correctOption === index 
                                  ? 'bg-green-500 text-white shadow-md rotate-0' 
                                  : 'bg-black/5 text-transparent scale-0 group-hover:scale-100'
                            }`}>
                                <Check className="w-5 h-5 stroke-3" />
                            </div>
                        </div>
                        <Input
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            placeholder={`Answer option ${index + 1}`}
                            className="bg-white/90 border-transparent shadow-sm focus:border-slate-300 font-semibold text-lg py-6"
                            onClick={(e) => e.stopPropagation()} 
                        />
                    </div>
                 </div>
             ))}
         </div>
         
         <div className="flex justify-end pt-2 border-t border-slate-200">
           <Button 
             onClick={handleAddQuestion}
             className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-10 py-4 rounded-xl shadow-lg border-b-4 border-black active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2 text-lg"
           >
             <Plus className="w-6 h-6" />
             Add Question
           </Button>
         </div>
      </div>
    </div>
  );
}
