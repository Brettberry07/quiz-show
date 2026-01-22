"use client";

import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Check, Trash2, Save, Layout, Type, User } from "lucide-react";
import { QuestionBuilder, Question } from "@/components/QuestionBuilder";
import { useQuizzes } from "@/context/QuizContext";
import { useRouter, useSearchParams } from "next/navigation";

export default function CreatePage() {
  const [quizName, setQuizName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const { addQuiz, updateQuiz, getQuiz } = useQuizzes();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  // Load quiz data when editing
  useEffect(() => {
    if (editId) {
      const quiz = getQuiz(editId);
      if (quiz) {
        setQuizName(quiz.name);
        setDescription(quiz.description);
        setQuestions(quiz.questions);
      }
    }
  }, [editId, getQuiz]);

  const handleAddQuestion = (newQuestion: Question) => {
    setQuestions([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleSubmitQuiz = () => {
    if (!quizName.trim()) {
      alert("Please enter a quiz name");
      return;
    }

    if (questions.length === 0) {
      alert("Please add at least one question");
      return;
    }

    if (isEditing && editId) {
      updateQuiz(editId, {
        name: quizName,
        description,
        questions,
      });
    } else {
      addQuiz({
        name: quizName,
        description,
        questions,
      });
    }

    // Redirect to home page after saving
    router.push("/home");
  };

  return (
    <Shell>
      <div className="min-h-screen pb-20">
        {/* Header Bar */}
        <div className="bg-white border-b border-[#A59A9A] sticky top-0 z-10 px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <div className="bg-[#3D3030] p-2 rounded-lg">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-[#3D3030] tracking-tight">
              {isEditing ? "Edit Quiz" : "Quiz Creator"}
            </h1>
          </div>
          <Button
            onClick={handleSubmitQuiz}
            className="bg-[#202020] hover:bg-[#333] text-white font-bold px-6 py-2 rounded-lg shadow-sm border-b-4 border-[#111] active:border-b-0 active:translate-y-1 transition-all"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Update Quiz" : "Save Quiz"}
          </Button>
        </div>

        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Quiz Details Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-[#A59A9A] overflow-hidden"
          >
            <div className="bg-[#A59A9A] px-6 py-4 border-b border-[#8B8080]">
              <h2 className="text-lg font-bold text-[#333] flex items-center gap-2">
                <Type className="w-5 h-5" />
                Quiz Details
              </h2>
            </div>
            <div className="p-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="font-bold text-[#3D3030] text-sm uppercase tracking-wide">Title</label>
                <Input
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="e.g., Mathematics 101"
                  className="bg-[#e5e5e5] border-2 border-[#cfcfcf] focus:border-[#3D3030] rounded-xl h-12 font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="font-bold text-[#3D3030] text-sm uppercase tracking-wide">Description</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this quiz about?"
                  className="bg-[#e5e5e5] border-2 border-[#cfcfcf] focus:border-[#3D3030] rounded-xl h-12 font-medium"
                />
              </div>
            </div>
          </motion.div>

          {/* Add Question Visual Builder */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-[#3D3030]">Add Question</h2>
            </div>
            
            <QuestionBuilder onAddQuestion={handleAddQuestion} creatorName="Me" />
          </motion.div>

          {/* Question List */}
          {questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-black text-[#3D3030] ml-2">Your Questions ({questions.length})</h2>
              <div className="grid gap-3">
                {questions.map((q, index) => (
                  <Card key={q.id} className="p-0 overflow-hidden bg-white border-[#A59A9A] shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 flex items-start gap-4">
                      <div className="w-12 h-12 bg-[#A59A9A] rounded-xl flex flex-col items-center justify-center border border-[#8B8080] shrink-0">
                        <span className="text-xs font-bold text-[#3D3030] uppercase">Q</span>
                        <span className="text-xl font-black text-[#3D3030] leading-none">{index + 1}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-[#3D3030] text-lg">{q.question}</p>
                           {q.creator && (
                             <span className="text-xs font-bold bg-[#A59A9A] text-[#3D3030] px-2 py-0.5 rounded-full border border-[#8B8080] flex items-center gap-1">
                               <User className="w-3 h-3" />
                               {q.creator}
                             </span>
                           )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                              optIndex === q.correctAnswer 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-[#e5e5e5] border-[#cfcfcf] text-[#555]'
                            }`}>
                              {optIndex === q.correctAnswer && <Check className="w-4 h-4 shrink-0" />}
                              <span className="truncate">{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Button
                        onClick={() => handleRemoveQuestion(q.id)}
                        variant="ghost"
                        className="text-[#888] hover:text-red-500 hover:bg-red-50 h-10 w-10 p-0 rounded-full"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </Shell>
  );
}
