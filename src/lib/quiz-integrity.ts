const QUESTION_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "SHORT_ANSWER",
] as const;

export const MIN_QUIZ_QUESTIONS = 10;
export const MAX_QUIZ_QUESTIONS = 200;

type QuestionType = (typeof QUESTION_TYPES)[number];

export interface QuizQuestionInput {
  id?: string;
  questionText: string;
  questionType: QuestionType;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
}

export interface QuizWriteInput {
  title?: string;
  description?: string;
  moduleId?: string | null;
  sectionId?: string | null;
  passingScore?: number;
  retryLimit?: number;
  isRequired?: boolean;
  questions?: QuizQuestionInput[];
}

type QuizValidationResult =
  | { ok: true; value: QuizWriteInput }
  | { ok: false; error: string };

const QUESTION_TYPE_SET = new Set<string>(QUESTION_TYPES);
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/;

export function isQuizEntityId(value: string): boolean {
  return ID_PATTERN.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOwn(value: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function requiredText(
  value: unknown,
  label: string,
  maxLength: number,
): { ok: true; value: string } | { ok: false; error: string } {
  if (typeof value !== "string" || value.trim().length === 0) {
    return { ok: false, error: `${label} is required` };
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: `${label} must be ${maxLength} characters or fewer`,
    };
  }

  return { ok: true, value: trimmed };
}

function optionalText(
  value: unknown,
  label: string,
  maxLength: number,
): { ok: true; value: string } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: "" };
  if (typeof value !== "string") {
    return { ok: false, error: `${label} must be text` };
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      error: `${label} must be ${maxLength} characters or fewer`,
    };
  }

  return { ok: true, value: trimmed };
}

function nullableId(
  value: unknown,
  label: string,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value !== "string" || !ID_PATTERN.test(value)) {
    return { ok: false, error: `${label} is invalid` };
  }
  return { ok: true, value };
}

function integerInRange(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number,
): { ok: true; value: number } | { ok: false; error: string } {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum ||
    value > maximum
  ) {
    return {
      ok: false,
      error: `${label} must be a whole number from ${minimum} to ${maximum}`,
    };
  }
  return { ok: true, value };
}

export function normalizeAnswerTokens(value: string): string[] {
  return (
    value
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLocaleLowerCase("en-US")
      .match(/[\p{L}\p{N}]+/gu) || []
  );
}

export function normalizeAnswer(value: string): string {
  return normalizeAnswerTokens(value).join(" ");
}

/**
 * Short-answer alternatives are separated with `|`. An alternative must match
 * whole normalized tokens in order: either the full response, one complete
 * token, or a complete phrase. Substrings inside a word never count.
 */
export function matchesShortAnswer(
  submittedAnswer: string,
  acceptedAnswers: string,
): boolean {
  const submittedTokens = normalizeAnswerTokens(submittedAnswer);
  if (submittedTokens.length === 0) return false;

  return acceptedAnswers.split("|").some((alternative) => {
    const acceptedTokens = normalizeAnswerTokens(alternative);
    if (
      acceptedTokens.length === 0 ||
      acceptedTokens.join("").length < 2 ||
      acceptedTokens.length > submittedTokens.length
    ) {
      return false;
    }

    for (
      let start = 0;
      start <= submittedTokens.length - acceptedTokens.length;
      start += 1
    ) {
      const phraseMatches = acceptedTokens.every(
        (token, offset) => token === submittedTokens[start + offset],
      );
      if (phraseMatches) return true;
    }

    return false;
  });
}

function validateQuestion(
  value: unknown,
  index: number,
): { ok: true; value: QuizQuestionInput } | { ok: false; error: string } {
  const prefix = `Question ${index + 1}`;
  if (!isRecord(value)) {
    return { ok: false, error: `${prefix} is invalid` };
  }

  let id: string | undefined;
  if (hasOwn(value, "id") && value.id !== undefined && value.id !== null) {
    if (typeof value.id !== "string" || !ID_PATTERN.test(value.id)) {
      return { ok: false, error: `${prefix} has an invalid ID` };
    }
    id = value.id;
  }

  const questionText = requiredText(
    value.questionText,
    `${prefix} text`,
    2_000,
  );
  if (!questionText.ok) return questionText;

  if (
    typeof value.questionType !== "string" ||
    !QUESTION_TYPE_SET.has(value.questionType)
  ) {
    return { ok: false, error: `${prefix} has an invalid question type` };
  }
  const questionType = value.questionType as QuestionType;

  const correctAnswer = requiredText(
    value.correctAnswer,
    `${prefix} correct answer`,
    2_000,
  );
  if (!correctAnswer.ok) return correctAnswer;

  const explanation = optionalText(
    value.explanation,
    `${prefix} explanation`,
    5_000,
  );
  if (!explanation.ok) return explanation;

  let options: string[] | null = null;
  let canonicalCorrectAnswer = correctAnswer.value;

  if (questionType === "MULTIPLE_CHOICE") {
    if (!Array.isArray(value.options) || value.options.length < 2 || value.options.length > 10) {
      return {
        ok: false,
        error: `${prefix} must have between 2 and 10 answer options`,
      };
    }

    const parsedOptions: string[] = [];
    for (let optionIndex = 0; optionIndex < value.options.length; optionIndex += 1) {
      const option = requiredText(
        value.options[optionIndex],
        `${prefix} option ${optionIndex + 1}`,
        500,
      );
      if (!option.ok) return option;
      parsedOptions.push(option.value);
    }

    const normalizedOptions = parsedOptions.map(normalizeAnswer);
    if (normalizedOptions.some((option) => option.length === 0)) {
      return { ok: false, error: `${prefix} has an invalid answer option` };
    }
    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      return { ok: false, error: `${prefix} has duplicate answer options` };
    }

    const correctIndex = normalizedOptions.indexOf(
      normalizeAnswer(correctAnswer.value),
    );
    if (correctIndex === -1) {
      return {
        ok: false,
        error: `${prefix} correct answer must match one of its options`,
      };
    }

    options = parsedOptions;
    canonicalCorrectAnswer = parsedOptions[correctIndex];
  } else if (questionType === "TRUE_FALSE") {
    const normalizedCorrectAnswer = normalizeAnswer(correctAnswer.value);
    if (
      normalizedCorrectAnswer !== "true" &&
      normalizedCorrectAnswer !== "false"
    ) {
      return {
        ok: false,
        error: `${prefix} correct answer must be True or False`,
      };
    }
    options = ["True", "False"];
    canonicalCorrectAnswer =
      normalizedCorrectAnswer === "true" ? "True" : "False";
  } else {
    if (
      value.options !== undefined &&
      value.options !== null &&
      (!Array.isArray(value.options) || value.options.length > 0)
    ) {
      return { ok: false, error: `${prefix} short answer cannot have options` };
    }

    const alternatives = correctAnswer.value
      .split("|")
      .map((answer) => answer.trim());
    const normalizedAlternatives = alternatives.map(normalizeAnswer);
    if (
      alternatives.length > 20 ||
      normalizedAlternatives.some(
        (answer) => answer.replaceAll(" ", "").length < 2,
      ) ||
      new Set(normalizedAlternatives).size !== normalizedAlternatives.length
    ) {
      return {
        ok: false,
        error: `${prefix} has invalid accepted short answers`,
      };
    }
    canonicalCorrectAnswer = alternatives.join(" | ");
  }

  return {
    ok: true,
    value: {
      ...(id ? { id } : {}),
      questionText: questionText.value,
      questionType,
      options,
      correctAnswer: canonicalCorrectAnswer,
      explanation: explanation.value,
    },
  };
}

export function validateQuizWritePayload(
  rawValue: unknown,
  mode: "create" | "update",
): QuizValidationResult {
  if (!isRecord(rawValue)) {
    return { ok: false, error: "Quiz data must be an object" };
  }

  const result: QuizWriteInput = {};

  if (mode === "create" || hasOwn(rawValue, "title")) {
    const title = requiredText(rawValue.title, "Quiz title", 200);
    if (!title.ok) return title;
    result.title = title.value;
  }

  if (mode === "create" || hasOwn(rawValue, "description")) {
    const description = optionalText(
      rawValue.description,
      "Quiz description",
      5_000,
    );
    if (!description.ok) return description;
    result.description = description.value;
  }

  if (mode === "create" || hasOwn(rawValue, "moduleId")) {
    const moduleId = nullableId(rawValue.moduleId, "Module ID");
    if (!moduleId.ok) return moduleId;
    result.moduleId = moduleId.value;
  }

  if (mode === "create" || hasOwn(rawValue, "sectionId")) {
    const sectionId = nullableId(rawValue.sectionId, "Section ID");
    if (!sectionId.ok) return sectionId;
    result.sectionId = sectionId.value;
  }

  if (mode === "create" || hasOwn(rawValue, "passingScore")) {
    const passingScore = integerInRange(
      rawValue.passingScore === undefined && mode === "create"
        ? 70
        : rawValue.passingScore,
      "Passing score",
      1,
      100,
    );
    if (!passingScore.ok) return passingScore;
    result.passingScore = passingScore.value;
  }

  if (mode === "create" || hasOwn(rawValue, "retryLimit")) {
    const retryLimit = integerInRange(
      rawValue.retryLimit === undefined && mode === "create"
        ? 3
        : rawValue.retryLimit,
      "Attempt limit",
      0,
      100,
    );
    if (!retryLimit.ok) return retryLimit;
    result.retryLimit = retryLimit.value;
  }

  if (mode === "create" || hasOwn(rawValue, "isRequired")) {
    const isRequired =
      rawValue.isRequired === undefined && mode === "create"
        ? false
        : rawValue.isRequired;
    if (typeof isRequired !== "boolean") {
      return { ok: false, error: "Required quiz must be true or false" };
    }
    result.isRequired = isRequired;
  }

  if (mode === "create" || hasOwn(rawValue, "questions")) {
    if (!Array.isArray(rawValue.questions)) {
      return { ok: false, error: "Quiz questions must be an array" };
    }
    if (
      rawValue.questions.length < MIN_QUIZ_QUESTIONS ||
      rawValue.questions.length > MAX_QUIZ_QUESTIONS
    ) {
      return {
        ok: false,
        error: `A quiz must have between ${MIN_QUIZ_QUESTIONS} and ${MAX_QUIZ_QUESTIONS} questions`,
      };
    }

    const questions: QuizQuestionInput[] = [];
    for (let index = 0; index < rawValue.questions.length; index += 1) {
      const question = validateQuestion(rawValue.questions[index], index);
      if (!question.ok) return question;
      questions.push(question.value);
    }

    const questionIds = questions.flatMap((question) =>
      question.id ? [question.id] : [],
    );
    if (new Set(questionIds).size !== questionIds.length) {
      return { ok: false, error: "Question IDs must be unique" };
    }
    result.questions = questions;
  }

  const finalModuleId = result.moduleId;
  const finalSectionId = result.sectionId;
  if (finalModuleId && finalSectionId) {
    return {
      ok: false,
      error: "A quiz can be linked to a module or a section, not both",
    };
  }

  if (mode === "update" && Object.keys(result).length === 0) {
    return { ok: false, error: "No quiz changes were provided" };
  }

  return { ok: true, value: result };
}
