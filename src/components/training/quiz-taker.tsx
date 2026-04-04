"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  sortOrder: number;
}

interface QuizTakerProps {
  quizId: string;
  questions: Question[];
  passingScore: number;
}

export function QuizTaker({ quizId, questions, passingScore }: QuizTakerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; feedback: Record<string, { correct: boolean; correctAnswer: string; explanation: string }> } | null>(null);
  const router = useRouter();

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="space-y-6">
        <Card className={result.passed ? "border-ditch-green/30 bg-green-50/50" : "border-red-300 bg-red-50/50"}>
          <div className="text-center py-4">
            {result.passed ? (
              <CheckCircle2 className="w-16 h-16 text-ditch-green mx-auto mb-4" />
            ) : (
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {result.passed ? "You Passed! 🎉" : "Not Quite 😅"}
            </h2>
            <p className="text-4xl font-bold mt-2 mb-1">{result.score}%</p>
            <p className="text-gray-500">
              {result.passed
                ? "Great job! You've demonstrated your knowledge."
                : `You need ${passingScore}% to pass. Keep studying and try again!`}
            </p>
          </div>
        </Card>

        {/* Review answers */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Review Your Answers</h3>
          {questions.map((q, i) => {
            const fb = result.feedback[q.id];
            return (
              <Card key={q.id} className={fb?.correct ? "border-l-4 border-l-ditch-green" : "border-l-4 border-l-red-500"}>
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-gray-400">Q{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{q.questionText}</p>
                    <p className="text-sm mt-1">
                      Your answer: <span className="font-medium">{answers[q.id] || "—"}</span>
                    </p>
                    {!fb?.correct && (
                      <p className="text-sm text-ditch-green mt-1">
                        Correct answer: <span className="font-medium">{fb?.correctAnswer}</span>
                      </p>
                    )}
                    {fb?.explanation && (
                      <p className="text-sm text-gray-500 mt-1 italic">{fb.explanation}</p>
                    )}
                  </div>
                  {fb?.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-ditch-green shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button onClick={() => { setResult(null); setAnswers({}); setCurrentIndex(0); }} variant="outline">
            Try Again
          </Button>
          <Button onClick={() => router.push("/quizzes")} variant="secondary">
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>{Object.keys(answers).length} answered</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-ditch-orange h-2 rounded-full transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <Card className="p-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">
          {currentQuestion.questionText}
        </h2>

        {currentQuestion.questionType === "MULTIPLE_CHOICE" && currentQuestion.options && (
          <div className="space-y-3">
            {(currentQuestion.options as string[]).map((option, i) => (
              <button
                key={i}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  answers[currentQuestion.id] === option
                    ? "border-ditch-orange bg-ditch-orange/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion.id] === option
                      ? "border-ditch-orange bg-ditch-orange"
                      : "border-gray-300"
                  }`}>
                    {answers[currentQuestion.id] === option && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <span className="text-gray-900">{option}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {currentQuestion.questionType === "TRUE_FALSE" && (
          <div className="flex gap-4">
            {["True", "False"].map((opt) => (
              <button
                key={opt}
                onClick={() => handleAnswer(currentQuestion.id, opt)}
                className={`flex-1 p-4 rounded-lg border-2 text-center font-medium transition-colors ${
                  answers[currentQuestion.id] === opt
                    ? "border-ditch-orange bg-ditch-orange/5 text-ditch-orange"
                    : "border-gray-200 hover:border-gray-300 text-gray-700"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {currentQuestion.questionType === "SHORT_ANSWER" && (
          <textarea
            value={answers[currentQuestion.id] || ""}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
            placeholder="Type your answer here..."
            className="w-full p-4 rounded-lg border-2 border-gray-200 focus:border-ditch-orange focus:ring-0 focus:outline-none min-h-[120px] resize-none"
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          Previous
        </Button>

        <div className="flex gap-1">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-3 h-3 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-ditch-orange"
                  : answers[questions[i].id]
                  ? "bg-ditch-green"
                  : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {currentIndex < questions.length - 1 ? (
          <Button onClick={() => setCurrentIndex(currentIndex + 1)} className="flex items-center gap-1">
            Next <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < questions.length}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}
