import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const { data: quizzes } = await db
    .from("Quiz")
    .select("*, module:Module(*, section:Section(*)), questions:QuizQuestion(*)");

  return NextResponse.json(quizzes || []);
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user || !["SUPER_ADMIN", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const data = await request.json();

  // Create quiz first
  const { data: quiz, error: quizError } = await db
    .from("Quiz")
    .insert({
      moduleId: data.moduleId,
      title: data.title,
      description: data.description || "",
      passingScore: data.passingScore || 70,
      retryLimit: data.retryLimit || 0,
      isRequired: data.isRequired || false,
    })
    .select()
    .single();

  if (quizError) return NextResponse.json({ error: quizError.message }, { status: 500 });

  // Create questions separately
  if (data.questions && data.questions.length > 0) {
    const { data: questions, error: questionsError } = await db
      .from("QuizQuestion")
      .insert(
        data.questions.map((q: any, i: number) => ({
          quizId: quiz.id,
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          sortOrder: i,
        }))
      )
      .select();

    if (!questionsError) {
      quiz.questions = questions;
    }
  } else {
    quiz.questions = [];
  }

  return NextResponse.json(quiz);
}
