"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Plus, Edit2, Trash2, ClipboardCheck, ChevronDown, ChevronUp,
  X,
} from "lucide-react";

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
  moduleName?: string;
  passingScore: number;
  retryLimit: number;
  isRequired: boolean;
  questions: Question[];
}

interface Module {
  id: string;
  title: string;
}

const emptyQuestion: Question = {
  questionText: "",
  questionType: "MULTIPLE_CHOICE",
  options: ["", "", "", ""],
  correctAnswer: "",
  explanation: "",
};

const emptyForm = {
  title: "",
  description: "",
  moduleId: "",
  passingScore: 70,
  retryLimit: 3,
  isRequired: false,
  questions: [{ ...emptyQuestion }] as Question[],
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [quizRes, modRes] = await Promise.all([
      fetch("/api/admin/quizzes"),
      fetch("/api/admin/modules"),
    ]);
    const quizData = await quizRes.json();
    const modData = await modRes.json();
    setQuizzes(quizData);
    setModules(modData);
    setLoading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, questions: [{ ...emptyQuestion }] });
    setShowModal(true);
  };

  const openEdit = (quiz: Quiz) => {
    setEditing(quiz);
    setForm({
      title: quiz.title,
      description: quiz.description,
      moduleId: quiz.moduleId || "",
      passingScore: quiz.passingScore,
      retryLimit: quiz.retryLimit,
      isRequired: quiz.isRequired,
      questions: quiz.questions.length > 0 ? quiz.questions.map((q) => ({ ...q })) : [{ ...emptyQuestion }],
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/admin/quizzes/${editing.id}` : "/api/admin/quizzes";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    setShowModal(false);
    setEditing(null);
    setForm({ ...emptyForm });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz? This cannot be undone.")) return;
    await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
    fetchData();
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const questions = [...form.questions];
    questions[index] = { ...questions[index], ...updates };
    setForm({ ...form, questions });
  };

  const addQuestion = () => {
    setForm({ ...form, questions: [...form.questions, { ...emptyQuestion }] });
  };

  const removeQuestion = (index: number) => {
    const questions = form.questions.filter((_, i) => i !== index);
    setForm({ ...form, questions: questions.length > 0 ? questions : [{ ...emptyQuestion }] });
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
    if (!moduleId) return "Unlinked";
    const mod = modules.find((m) => m.id === moduleId);
    return mod ? mod.title : "Unknown";
  };

  const moduleOptions = [
    { value: "", label: "-- No Module --" },
    ...modules.map((m) => ({ value: m.id, label: m.title })),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ditch-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Builder</h1>
          <p className="text-gray-500 mt-1">Create and manage quizzes for training modules</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Create Quiz
        </Button>
      </div>

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
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-ditch-orange/10 rounded-lg">
                    <ClipboardCheck className="w-5 h-5 text-ditch-orange" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                      {quiz.isRequired && <Badge variant="required">Required</Badge>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{quiz.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>Module: {getModuleName(quiz.moduleId)}</span>
                      <span>{quiz.questions.length} questions</span>
                      <span>Passing: {quiz.passingScore}%</span>
                      <span>Retries: {quiz.retryLimit}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setExpandedId(expandedId === quiz.id ? null : quiz.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="View questions"
                  >
                    {expandedId === quiz.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(quiz)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(quiz.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
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
            label="Linked Module"
            value={form.moduleId}
            onChange={(e) => setForm({ ...form, moduleId: e.target.value })}
            options={moduleOptions}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Passing Score (%)"
              type="number"
              value={form.passingScore}
              onChange={(e) => setForm({ ...form, passingScore: Number(e.target.value) })}
            />
            <Input
              label="Retry Limit"
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
              <h3 className="text-sm font-semibold text-gray-900">Questions</h3>
              <button
                type="button"
                onClick={addQuestion}
                className="text-sm text-ditch-orange hover:underline flex items-center gap-1"
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
                      className="p-1 hover:bg-red-50 rounded transition-colors"
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
                      placeholder="Enter the correct answer"
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
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
