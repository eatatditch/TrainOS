"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

interface Question {
  id: string;
  questionText: string;
  questionType: string;
  options: string[] | null;
  sortOrder: number;
}

interface QuizFeedback {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
}

interface QuizResult {
  score: number;
  passed: boolean;
  feedback: Record<string, QuizFeedback>;
  attemptsRemaining: number | null;
  canRetry: boolean;
}

interface QuizTakerProps {
  quizId: string;
  questions: Question[];
  passingScore: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseQuizResult(value: unknown): QuizResult | null {
  if (
    !isRecord(value) ||
    typeof value.score !== "number" ||
    typeof value.passed !== "boolean" ||
    !isRecord(value.feedback) ||
    (value.attemptsRemaining !== null &&
      typeof value.attemptsRemaining !== "number") ||
    typeof value.canRetry !== "boolean"
  ) {
    return null;
  }

  return value as unknown as QuizResult;
}

async function readResponseBody(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function QuizTaker({ quizId, questions, passingScore }: QuizTakerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const router = useRouter();

  const answeredCount = questions.reduce(
    (count, question) =>
      answers[question.id]?.trim() ? count + 1 : count,
    0,
  );
  const allAnswered =
    questions.length > 0 && answeredCount === questions.length;

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((previous) => ({ ...previous, [questionId]: answer }));
    setSubmissionError(null);
  };

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;

    setSubmitting(true);
    setSubmissionError(null);
    try {
      const response = await fetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });
      const responseBody = await readResponseBody(response);

      if (!response.ok) {
        const message =
          isRecord(responseBody) && typeof responseBody.error === "string"
            ? responseBody.error
            : "Your quiz could not be submitted. Please try again.";
        setSubmissionError(message);
        return;
      }

      const parsedResult = parseQuizResult(responseBody);
      if (!parsedResult) {
        setSubmissionError(
          "The quiz was submitted, but the result could not be displayed. Refresh your quiz history before trying again.",
        );
        return;
      }
      setResult(parsedResult);
    } catch {
      setSubmissionError(
        "We could not reach the training server. Check your connection and submit again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForRetry = () => {
    if (!result?.canRetry) return;
    setResult(null);
    setAnswers({});
    setCurrentIndex(0);
    setSubmissionError(null);
  };

  if (questions.length === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/70 p-6 text-center sm:p-8">
        <AlertCircle className="mx-auto mb-3 size-10 text-amber-700" />
        <h2 className="text-xl font-black text-ditch-ink">Quiz not ready</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ditch-navy/65">
          This knowledge check does not have any questions yet. No attempt has
          been used. Let a manager know so it can be completed.
        </p>
        <Button
          className="mt-5"
          variant="secondary"
          onClick={() => router.push("/quizzes")}
        >
          Back to Quizzes
        </Button>
      </Card>
    );
  }

  if (result) {
    const failedWithoutRetry = !result.passed && !result.canRetry;

    return (
      <div className="space-y-6">
        <Card
          className={
            result.passed
              ? "border-ditch-green/20 bg-ditch-seafoam/20"
              : "border-red-200 bg-red-50/60"
          }
        >
          <div className="py-4 text-center">
            {result.passed ? (
              <CheckCircle2 className="mx-auto mb-4 size-16 text-ditch-green" />
            ) : (
              <XCircle className="mx-auto mb-4 size-16 text-red-500" />
            )}
            <h2 className="text-2xl font-black tracking-tight text-ditch-ink">
              {result.passed
                ? "You nailed it."
                : failedWithoutRetry
                  ? "Review with a leader."
                  : "Another rep."}
            </h2>
            <p className="mb-1 mt-2 text-5xl font-black tracking-[-0.05em] text-ditch-ink">
              {result.score}%
            </p>
            <p className="text-sm leading-6 text-ditch-navy/60">
              {result.passed
                ? "Locked in. Take that confidence to the floor."
                : failedWithoutRetry
                  ? `You need ${passingScore}% to pass and have used all available attempts. Review the misses with a manager.`
                  : `You need ${passingScore}% to pass. Review the misses and run it back.`}
            </p>
            {!result.passed && result.canRetry ? (
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.1em] text-ditch-navy/45">
                {result.attemptsRemaining === null
                  ? "Another attempt is available"
                  : `${result.attemptsRemaining} ${result.attemptsRemaining === 1 ? "attempt" : "attempts"} remaining`}
              </p>
            ) : null}
          </div>
        </Card>

        <div className="space-y-3">
          <h3 className="text-lg font-extrabold text-ditch-ink">
            Review your answers
          </h3>
          {questions.map((question, index) => {
            const feedback = result.feedback[question.id];
            return (
              <Card
                key={question.id}
                className={
                  feedback?.correct
                    ? "border-l-4 border-l-ditch-green"
                    : "border-l-4 border-l-red-500"
                }
              >
                <div className="flex items-start gap-3">
                  <span className="text-sm font-semibold text-gray-400">
                    Q{index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {question.questionText}
                    </p>
                    <p className="mt-1 text-sm">
                      Your answer:{" "}
                      <span className="font-medium">
                        {answers[question.id] || "—"}
                      </span>
                    </p>
                    {!feedback?.correct ? (
                      <p className="mt-1 text-sm text-ditch-green">
                        Correct answer:{" "}
                        <span className="font-medium">
                          {feedback?.correctAnswer}
                        </span>
                      </p>
                    ) : null}
                    {feedback?.explanation ? (
                      <p className="mt-1 text-sm italic text-gray-500">
                        {feedback.explanation}
                      </p>
                    ) : null}
                  </div>
                  {feedback?.correct ? (
                    <CheckCircle2 className="size-5 shrink-0 text-ditch-green" />
                  ) : (
                    <XCircle className="size-5 shrink-0 text-red-500" />
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          {result.canRetry ? (
            <Button onClick={resetForRetry} variant="outline">
              Try Again
            </Button>
          ) : null}
          <Button
            onClick={() => router.push("/quizzes")}
            variant="secondary"
          >
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="space-y-6" aria-busy={submitting}>
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.1em] text-ditch-navy/50">
        <span>
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span>{answeredCount} answered</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-ditch-navy/10">
        <div
          className="h-2 rounded-full bg-ditch-orange transition-all"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <Card className="p-5 sm:p-8">
        <p className="page-kicker">Question {currentIndex + 1}</p>
        <h2 className="mb-6 text-xl font-extrabold leading-8 tracking-tight text-ditch-ink">
          {currentQuestion.questionText}
        </h2>

        {currentQuestion.questionType === "MULTIPLE_CHOICE" &&
        currentQuestion.options ? (
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                aria-pressed={answers[currentQuestion.id] === option}
                className={`w-full rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ditch-orange focus-visible:ring-offset-2 ${
                  answers[currentQuestion.id] === option
                    ? "border-ditch-orange bg-ditch-orange/[0.06] shadow-sm"
                    : "border-ditch-navy/10 bg-white hover:border-ditch-orange/30 hover:bg-ditch-sand/15"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={`flex size-6 items-center justify-center rounded-full border-2 ${
                      answers[currentQuestion.id] === option
                        ? "border-ditch-orange bg-ditch-orange"
                        : "border-gray-300"
                    }`}
                  >
                    {answers[currentQuestion.id] === option ? (
                      <span className="size-2 rounded-full bg-white" />
                    ) : null}
                  </span>
                  <span className="text-gray-900">{option}</span>
                </span>
              </button>
            ))}
          </div>
        ) : null}

        {currentQuestion.questionType === "TRUE_FALSE" ? (
          <div className="flex gap-4">
            {["True", "False"].map((option) => (
              <button
                type="button"
                key={option}
                onClick={() => handleAnswer(currentQuestion.id, option)}
                aria-pressed={answers[currentQuestion.id] === option}
                className={`min-h-12 flex-1 rounded-2xl border p-4 text-center font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ditch-orange focus-visible:ring-offset-2 ${
                  answers[currentQuestion.id] === option
                    ? "border-ditch-orange bg-ditch-orange/5 text-ditch-orange"
                    : "border-gray-200 text-gray-700 hover:border-gray-300"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}

        {currentQuestion.questionType === "SHORT_ANSWER" ? (
          <textarea
            aria-label={`Answer to question ${currentIndex + 1}`}
            value={answers[currentQuestion.id] || ""}
            onChange={(event) =>
              handleAnswer(currentQuestion.id, event.target.value)
            }
            placeholder="Type your answer here..."
            className="min-h-[140px] w-full resize-none rounded-2xl border border-ditch-navy/15 bg-white p-4 text-ditch-ink outline-none transition-colors placeholder:text-ditch-navy/35 focus:border-ditch-orange focus:ring-2 focus:ring-ditch-orange/20"
          />
        ) : null}
      </Card>

      {submissionError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <span>{submissionError}</span>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() =>
            setCurrentIndex((index) => Math.max(0, index - 1))
          }
          disabled={currentIndex === 0 || submitting}
        >
          Previous
        </Button>

        <nav
          aria-label="Quiz questions"
          className="flex max-w-full overflow-x-auto py-1 sm:max-w-[55%]"
        >
          {questions.map((question, index) => (
            <button
              type="button"
              key={question.id}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to question ${index + 1}${answers[question.id]?.trim() ? ", answered" : ""}`}
              aria-current={index === currentIndex ? "step" : undefined}
              className="grid size-11 shrink-0 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ditch-orange focus-visible:ring-offset-1"
            >
              <span
                aria-hidden="true"
                className={`size-3 rounded-full transition-colors ${
                  index === currentIndex
                    ? "bg-ditch-orange"
                    : answers[question.id]?.trim()
                      ? "bg-ditch-green"
                      : "bg-gray-300"
                }`}
              />
            </button>
          ))}
        </nav>

        {currentIndex < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentIndex((index) => index + 1)}
            className="flex items-center gap-1"
            disabled={submitting}
          >
            Next <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting || !allAnswered}
          >
            {submitting ? "Submitting..." : "Submit Quiz"}
          </Button>
        )}
      </div>
    </div>
  );
}
