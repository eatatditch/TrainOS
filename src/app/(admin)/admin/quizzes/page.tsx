"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  MAX_QUIZ_QUESTIONS,
  MIN_QUIZ_QUESTIONS,
} from "@/lib/quiz-integrity";
import {
  AlertCircle,
  Archive,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Edit2,
  Plus,
  X,
} from "lucide-react";

type QuizType = "MODULE" | "SECTION" | "POSITION_FINAL" | "STANDALONE";
type QuizScope = "STANDALONE" | "MODULE" | "SECTION";

interface Question {
  id?: string;
  questionText: string;
  questionType: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER";
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  moduleId: string | null;
  sectionId: string | null;
  quizType: QuizType;
  position: string | null;
  assessmentVersion: number;
  isActive: boolean;
  isSystemManaged: boolean;
  passingScore: number;
  retryLimit: number;
  isRequired: boolean;
  questions: Question[];
  module?: { id: string; title: string } | null;
  section?: { id: string; title: string } | null;
}

interface Module {
  id: string;
  title: string;
  sectionId: string;
  section?: { id: string; title: string } | null;
}

interface QuizForm {
  title: string;
  description: string;
  scope: QuizScope;
  moduleId: string;
  sectionId: string;
  passingScore: number;
  retryLimit: number;
  isRequired: boolean;
  questions: Question[];
}

function createEmptyQuestion(): Question {
  return {
    questionText: "",
    questionType: "MULTIPLE_CHOICE",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
  };
}

function createEmptyForm(): QuizForm {
  return {
    title: "",
    description: "",
    scope: "STANDALONE",
    moduleId: "",
    sectionId: "",
    passingScore: 70,
    retryLimit: 3,
    isRequired: false,
    questions: Array.from(
      { length: MIN_QUIZ_QUESTIONS },
      createEmptyQuestion,
    ),
  };
}

async function readApiError(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }
  } catch {
    // Use the user-facing fallback when the server did not return JSON.
  }
  return fallback;
}

async function loadQuizBuilderData(): Promise<{
  quizzes: Quiz[];
  modules: Module[];
}> {
  const [quizRes, modRes] = await Promise.all([
    fetch("/api/admin/quizzes"),
    fetch("/api/admin/modules"),
  ]);
  if (!quizRes.ok) {
    throw new Error(await readApiError(quizRes, "Unable to load quizzes"));
  }
  if (!modRes.ok) {
    throw new Error(
      await readApiError(modRes, "Unable to load training modules"),
    );
  }

  const quizData: unknown = await quizRes.json();
  const modData: unknown = await modRes.json();
  if (!Array.isArray(quizData) || !Array.isArray(modData)) {
    throw new Error("The quiz builder received an invalid server response");
  }

  return {
    quizzes: quizData as Quiz[],
    modules: modData as Module[],
  };
}

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [form, setForm] = useState<QuizForm>(createEmptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await loadQuizBuilderData();
      setQuizzes(data.quizzes);
      setModules(data.modules);
      setError(null);
    } catch (reason) {
      setError(errorMessage(reason, "Unable to load the quiz builder"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadQuizBuilderData()
      .then((data) => {
        if (cancelled) return;
        setQuizzes(data.quizzes);
        setModules(data.modules);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(errorMessage(reason, "Unable to load the quiz builder"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setError(null);
    setShowModal(true);
  };

  const openEdit = (quiz: Quiz) => {
    if (quiz.isSystemManaged || !quiz.isActive) return;

    const questions = quiz.questions.map((question) => ({
      ...question,
      explanation: question.explanation || "",
      options: Array.isArray(question.options) ? [...question.options] : [],
    }));
    while (questions.length < MIN_QUIZ_QUESTIONS) {
      questions.push(createEmptyQuestion());
    }

    setEditing(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description || "",
      scope: quiz.moduleId ? "MODULE" : quiz.sectionId ? "SECTION" : "STANDALONE",
      moduleId: quiz.moduleId || "",
      sectionId: quiz.sectionId || "",
      passingScore: quiz.passingScore,
      retryLimit: quiz.retryLimit,
      isRequired: quiz.isRequired,
      questions,
    });
    setError(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (saving) return;
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/quizzes/${editing.id}` : "/api/admin/quizzes";

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description,
        moduleId: form.scope === "MODULE" ? form.moduleId : null,
        sectionId: form.scope === "SECTION" ? form.sectionId : null,
        passingScore: form.passingScore,
        retryLimit: form.retryLimit,
        isRequired: form.isRequired,
        questions: form.questions,
      };
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError(
          await readApiError(
            response,
            editing ? "Unable to update quiz" : "Unable to create quiz",
          ),
        );
        return;
      }

      setShowModal(false);
      setEditing(null);
      setForm(createEmptyForm());
      await fetchData();
    } catch {
      setError("Unable to reach the training server. Your quiz was not saved.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Archive this quiz? Employees will no longer see it, but attempts and questions will be retained.",
      )
    ) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/quizzes/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError(await readApiError(response, "Unable to archive quiz"));
        return;
      }
      await fetchData();
    } catch {
      setError("Unable to reach the training server. The quiz was not archived.");
    } finally {
      setDeletingId(null);
    }
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const questions = [...form.questions];
    questions[index] = { ...questions[index], ...updates };
    setForm({ ...form, questions });
  };

  const addQuestion = () => {
    if (form.questions.length >= MAX_QUIZ_QUESTIONS) return;
    setForm({ ...form, questions: [...form.questions, createEmptyQuestion()] });
  };

  const removeQuestion = (index: number) => {
    if (form.questions.length <= MIN_QUIZ_QUESTIONS) return;
    const questions = form.questions.filter((_, i) => i !== index);
    setForm({ ...form, questions });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const questions = [...form.questions];
    const options = [...questions[qIndex].options];
    options[oIndex] = value;
    questions[qIndex] = { ...questions[qIndex], options };
    setForm({ ...form, questions });
  };

  const addOption = (qIndex: number) => {
    const questions = [...form.questions];
    questions[qIndex] = { ...questions[qIndex], options: [...questions[qIndex].options, ""] };
    setForm({ ...form, questions });
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const questions = [...form.questions];
    const options = questions[qIndex].options.filter((_, i) => i !== oIndex);
    questions[qIndex] = { ...questions[qIndex], options };
    setForm({ ...form, questions });
  };

  const getModuleName = (moduleId: string | null) => {
    if (!moduleId) return "Standalone";
    const mod = modules.find((m) => m.id === moduleId);
    return mod ? mod.title : "Unknown";
  };

  const sections = Array.from(
    new Map(
      modules.flatMap((module) =>
        module.section
          ? [[module.section.id, module.section] as const]
          : [],
      ),
    ).values(),
  ).sort((left, right) => left.title.localeCompare(right.title));

  const getAssessmentLabel = (quiz: Quiz) => {
    if (quiz.quizType === "POSITION_FINAL") {
      return quiz.position ? `${quiz.position} final` : "Position final";
    }
    if (quiz.quizType === "SECTION") {
      return quiz.section?.title || "Section checkpoint";
    }
    if (quiz.quizType === "MODULE") {
      return quiz.module?.title || getModuleName(quiz.moduleId);
    }
    return "Standalone";
  };

  const moduleOptions = [
    { value: "", label: "-- Select Module --" },
    ...modules.map((m) => ({ value: m.id, label: m.title })),
  ];
  const sectionOptions = [
    { value: "", label: "-- Select Section --" },
    ...sections.map((section) => ({
      value: section.id,
      label: section.title,
    })),
  ];
  const visibleQuizzes = showArchived
    ? quizzes
    : quizzes.filter((quiz) => quiz.isActive);
  const archivedCount = quizzes.filter((quiz) => !quiz.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="shell-card flex flex-col gap-5 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div>
          <p className="page-kicker">Verify the details</p>
          <h1 className="page-title">Knowledge checks</h1>
          <p className="page-subtitle">Build focused checks that prove the team can recall what matters.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {archivedCount > 0 && (
            <label className="flex min-h-10 items-center gap-2 rounded-xl border border-ditch-navy/10 bg-white px-3 text-xs font-bold text-ditch-navy/70">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(event) => setShowArchived(event.target.checked)}
                className="rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
              />
              Show archived ({archivedCount})
            </label>
          )}
          <Button onClick={openNew} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Quiz
          </Button>
        </div>
      </div>

      {error && !showModal && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No Quizzes Yet"
          description="Create your first quiz to assess employee knowledge."
          action={
            <Button onClick={openNew}>
              <Plus className="w-4 h-4 mr-2" /> Create Quiz
            </Button>
          }
        />
      ) : visibleQuizzes.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No Active Quizzes"
          description="Archived quizzes are retained for assessment history. Turn on Show archived to review them."
        />
      ) : (
        <div className="space-y-4">
          {visibleQuizzes.map((quiz) => (
            <Card key={quiz.id} className={!quiz.isActive ? "opacity-75" : undefined}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-ditch-orange/10 rounded-lg">
                    <ClipboardCheck className="w-5 h-5 text-ditch-orange" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      {quiz.isRequired && <Badge variant="required">Required</Badge>}
                      {quiz.isSystemManaged && <Badge>Curriculum managed</Badge>}
                      {!quiz.isActive && <Badge variant="optional">Archived</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{quiz.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>{quiz.quizType.replaceAll("_", " ")}: {getAssessmentLabel(quiz)}</span>
                      <span>{quiz.questions.length} questions</span>
                      <span>Passing: {quiz.passingScore}%</span>
                      <span>
                        Attempts: {quiz.retryLimit === 0 ? "Unlimited" : quiz.retryLimit}
                      </span>
                      <span>Version {quiz.assessmentVersion}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedId(expandedId === quiz.id ? null : quiz.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View questions"
                    aria-label={`${expandedId === quiz.id ? "Hide" : "View"} questions for ${quiz.title}`}
                  >
                    {expandedId === quiz.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {!quiz.isSystemManaged && quiz.isActive && (
                    <>
                      <button
                        onClick={() => openEdit(quiz)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label={`Edit ${quiz.title}`}
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Archive ${quiz.title}`}
                        disabled={deletingId === quiz.id}
                      >
                        <Archive className="w-4 h-4 text-red-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {expandedId === quiz.id && quiz.questions.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                  {quiz.questions.map((q, i) => (
                    <div key={q.id || i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-gray-400 mt-0.5">Q{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{q.questionText}</p>
                          <Badge className="mt-1">{q.questionType.replace("_", " ")}</Badge>
                          {q.options.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {q.options.map((opt, j) => (
                                <li
                                  key={j}
                                  className={`text-xs px-2 py-1 rounded ${
                                    opt === q.correctAnswer
                                      ? "bg-green-100 text-green-700 font-medium"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {opt}
                                  {opt === q.correctAnswer && " (correct)"}
                                </li>
                              ))}
                            </ul>
                          )}
                          {q.explanation && (
                            <p className="text-xs text-gray-400 mt-1">Explanation: {q.explanation}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Edit Quiz" : "New Quiz"}
        size="xl"
      >
        <div className="space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., Food Safety Fundamentals Quiz"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="What does this quiz cover?"
          />
          <Select
            label="Assessment Scope"
            value={form.scope}
            onChange={(event) => {
              const scope = event.target.value as QuizScope;
              setForm({
                ...form,
                scope,
                moduleId: scope === "MODULE" ? form.moduleId : "",
                sectionId: scope === "SECTION" ? form.sectionId : "",
              });
            }}
            options={[
              { value: "STANDALONE", label: "Standalone quiz" },
              { value: "MODULE", label: "Module knowledge check" },
              { value: "SECTION", label: "Section checkpoint" },
            ]}
          />
          {form.scope === "MODULE" && (
            <Select
              label="Linked Module"
              value={form.moduleId}
              onChange={(event) =>
                setForm({ ...form, moduleId: event.target.value })
              }
              options={moduleOptions}
            />
          )}
          {form.scope === "SECTION" && (
            <Select
              label="Linked Section"
              value={form.sectionId}
              onChange={(event) =>
                setForm({ ...form, sectionId: event.target.value })
              }
              options={sectionOptions}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Passing Score (%)"
              type="number"
              value={form.passingScore}
              onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
            />
            <Input
              label="Attempt Limit (0 = unlimited)"
              type="number"
              value={form.retryLimit}
              onChange={(e) => setForm({ ...form, retryLimit: Number(e.target.value) })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isRequired}
              onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
              className="rounded border-gray-300 text-ditch-orange focus:ring-ditch-orange"
            />
            Required quiz
          </label>

          {/* Questions Section */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Questions ({form.questions.length})
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Every assessment requires at least {MIN_QUIZ_QUESTIONS} valid questions.
                </p>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                disabled={form.questions.length >= MAX_QUIZ_QUESTIONS}
                className="flex items-center gap-1 text-sm text-ditch-orange hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="w-3 h-3" /> Add Question
              </button>
            </div>
            <div className="space-y-4">
              {form.questions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Question {qIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIdx)}
                      disabled={form.questions.length <= MIN_QUIZ_QUESTIONS}
                      className="p-1 hover:bg-red-50 rounded transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={`Remove question ${qIdx + 1}`}
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                  <Textarea
                    label="Question Text"
                    value={q.questionText}
                    onChange={(e) => updateQuestion(qIdx, { questionText: e.target.value })}
                    placeholder="Enter your question..."
                  />
                  <Select
                    label="Question Type"
                    value={q.questionType}
                    onChange={(e) => {
                      const questionType = e.target.value as Question["questionType"];
                      const updates: Partial<Question> = { questionType };
                      if (questionType === "TRUE_FALSE") {
                        updates.options = ["True", "False"];
                      } else if (questionType === "MULTIPLE_CHOICE" && q.options.length < 2) {
                        updates.options = ["", "", "", ""];
                      } else if (questionType === "SHORT_ANSWER") {
                        updates.options = [];
                      }
                      updateQuestion(qIdx, updates);
                    }}
                    options={[
                      { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
                      { value: "TRUE_FALSE", label: "True / False" },
                      { value: "SHORT_ANSWER", label: "Short Answer" },
                    ]}
                  />

                  {q.questionType === "MULTIPLE_CHOICE" && (
                    <div className="space-y-2">
                      <span className="text-sm font-medium text-gray-700">Options</span>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                            placeholder={`Option ${oIdx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(qIdx, oIdx)}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                            aria-label={`Remove option ${oIdx + 1} from question ${qIdx + 1}`}
                          >
                            <X className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(qIdx)}
                        className="text-xs text-ditch-orange hover:underline"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  {q.questionType === "TRUE_FALSE" && (
                    <Select
                      label="Correct Answer"
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                      options={[
                        { value: "", label: "-- Select --" },
                        { value: "True", label: "True" },
                        { value: "False", label: "False" },
                      ]}
                    />
                  )}

                  {q.questionType !== "TRUE_FALSE" && (
                    <Input
                      label="Correct Answer"
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(qIdx, { correctAnswer: e.target.value })}
                      placeholder={
                        q.questionType === "SHORT_ANSWER"
                          ? "Separate accepted answers with |"
                          : "Enter the correct answer"
                      }
                    />
                  )}

                  <Input
                    label="Explanation (optional)"
                    value={q.explanation}
                    onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                    placeholder="Why is this the correct answer?"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                form.questions.length < MIN_QUIZ_QUESTIONS ||
                (form.scope === "MODULE" && !form.moduleId) ||
                (form.scope === "SECTION" && !form.sectionId)
              }
            >
              {saving ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
