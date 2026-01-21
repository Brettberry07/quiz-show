"use client";

import { Shell } from "@/components/layout/Shell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";
import { useState } from "react";

interface Question {
  id: string;
  question: string;
  answer: string;
}

export default function CreatePage() {
  const [quizName, setQuizName] = useState("");
  const [description, setDescription] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleAddQuestion = () => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) {
      alert("Please fill in both question and answer");
      return;
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      question: currentQuestion,
      answer: currentAnswer,
    };

    setQuestions([...questions, newQuestion]);
    setCurrentQuestion("");
    setCurrentAnswer("");
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

    const quizData = {
      name: quizName,
      description,
      questions,
    };

    console.log("Quiz created:", quizData);
    // TODO: Send to backend API
    alert("Quiz created successfully!");
  };

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
                <Input
                  value={quizName}
                  onChange={(e) => setQuizName(e.target.value)}
                  placeholder="Enter quiz name"
                  className="bg-white"
                />
              </div>
              <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                <label className="font-bold text-black text-right">Description:</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter quiz description"
                  className="bg-white"
                />
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
                    <Input
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      placeholder="Enter your question"
                      className="bg-white"
                    />
                </div>
                
                 <div className="space-y-2 mt-4">
                    <label className="font-bold text-black">Answer:</label>
                    <textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Enter the answer"
                      className="w-full h-32 p-3 rounded-md border border-gray-300 bg-white resize-none"
                    />
                </div>
           </div>

           <div className="flex justify-end max-w-4xl">
              <Button 
                onClick={handleAddQuestion}
                className="bg-[#a3a3a3] text-black font-bold uppercase tracking-wider hover:bg-[#999] px-8 rounded-md shadow-sm"
              >
                Add
              </Button>
           </div>
        </motion.section>

        {questions.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 max-w-4xl"
          >
            <h2 className="text-2xl font-bold text-black">Questions Added ({questions.length}):</h2>
            <div className="space-y-3">
              {questions.map((q, index) => (
                <Card key={q.id} className="p-4 bg-white">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-2">
                      <p className="font-bold text-black">Q{index + 1}: {q.question}</p>
                      <p className="text-gray-700">A: {q.answer}</p>
                    </div>
                    <Button
                      onClick={() => handleRemoveQuestion(q.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 text-sm"
                    >
                      Remove
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </motion.section>
        )}

        <div className="flex justify-end max-w-4xl">
          <Button
            onClick={handleSubmitQuiz}
            className="bg-green-600 hover:bg-green-700 text-white font-bold uppercase tracking-wider px-12 py-3 rounded-md shadow-md"
          >
            Create Quiz
          </Button>
        </div>
      </div>
    </Shell>
  );
}
