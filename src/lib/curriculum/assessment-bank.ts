import type { Position } from "../positions";
import type {
  AssessmentBankQuestion,
  AssessmentQuestion,
  CurriculumModule,
  CurriculumProgram,
  ModuleAssessmentBank,
  PositionFinalAssessmentBank,
  SectionAssessmentBank,
} from "./types";

export const ASSESSMENT_VERSION = 2;
export const ASSESSMENT_ATTEMPT_LIMIT = 3;
export const CHECKPOINT_PASSING_SCORE = 85;
export const MODULE_QUESTION_COUNT = 10;
export const SECTION_QUESTION_COUNT = 10;
export const FINAL_QUESTIONS_PER_MODULE = 2;

const EXPECTED_MODULE_BANKS = 54;
const EXPECTED_SECTION_BANKS = 7;
const EXPECTED_POSITION_FINALS = 14;
const EXPECTED_ASSESSMENT_QUESTIONS = 1_082;

type AssessmentMenuItem = {
  id: string;
  name: string;
};

type GroundedFact = {
  key: string;
  moduleId: string;
  kind: "summary" | "outcome" | "statement" | "comparison" | "script" | "success" | "critical-miss" | "rubric" | "menu-item" | "source-status";
  prompt: string;
  answer: string;
  explanation: string;
};

export type AssessmentValidationIssue = {
  code: string;
  message: string;
};

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const stableHash = (value: string) => {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("en-US")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const uniqueText = (values: readonly string[]) => {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = normalize(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/**
 * Derived assessment copy deliberately excludes volatile and safety-sensitive
 * fields. Authored questions may test the approved allergy/escalation process,
 * but the derivation layer never turns a price, availability statement, or
 * allergen claim into a quiz fact.
 */
const isSafeDerivedAnswer = (value: string) => {
  if (value.length < 2 || value.length > 480) return false;
  return !/(\$|\bprice\b|\bmarket price\b|\bavailab(?:le|ility)\b|\ballerg(?:y|en|ens|ies)\b)/i.test(value);
};

const sourceStatusLabel = (status: "approved" | "verification-required" | "rotating") => {
  if (status === "approved") return "Approved";
  if (status === "rotating") return "Rotating";
  return "Verification required";
};

function extractGroundedFacts(
  curriculumModule: CurriculumModule,
  menuNameById: ReadonlyMap<string, string>,
): GroundedFact[] {
  const facts: GroundedFact[] = [];
  const hasLockedSource = curriculumModule.content.some(
    (block) => block.type === "source-control" && block.status === "verification-required",
  );
  const add = (fact: GroundedFact) => {
    if (!isSafeDerivedAnswer(fact.answer)) return;
    if (
      hasLockedSource &&
      /\b\d+(?:\.\d+)?\s*(?:oz|ounce|ounces|ml|dash|dashes|drop|drops)\b/i.test(fact.answer)
    ) return;
    facts.push(fact);
  };

  add({
    key: `${curriculumModule.id}-summary`,
    moduleId: curriculumModule.id,
    kind: "summary",
    prompt: `Which statement is the approved summary for "${curriculumModule.title}"?`,
    answer: curriculumModule.summary,
    explanation: `This is the exact approved summary for ${curriculumModule.title}.`,
  });

  curriculumModule.outcomes.forEach((outcome, index) => {
    add({
      key: `${curriculumModule.id}-outcome-${index + 1}`,
      moduleId: curriculumModule.id,
      kind: "outcome",
      prompt: `Which outcome is explicitly listed for "${curriculumModule.title}"?`,
      answer: outcome,
      explanation: `The module lists this as an explicit learning outcome: ${outcome}`,
    });
  });

  (curriculumModule.assessment.criticalMisses ?? []).forEach((criticalMiss, index) => {
    add({
      key: `${curriculumModule.id}-critical-miss-${index + 1}`,
      moduleId: curriculumModule.id,
      kind: "critical-miss",
      prompt: `Which item is explicitly identified as a critical miss for "${curriculumModule.title}"?`,
      answer: criticalMiss,
      explanation: `The module explicitly identifies this as a critical miss: ${criticalMiss}`,
    });
  });

  curriculumModule.assessment.questions
    .filter((question) => question.type === "practical")
    .forEach((question) => {
      (question.rubric ?? []).forEach((criterion, index) => {
        add({
          key: `${curriculumModule.id}-${question.id}-rubric-${index + 1}`,
          moduleId: curriculumModule.id,
          kind: "rubric",
          prompt: `Which criterion is explicitly included in the "${question.prompt}" practical rubric?`,
          answer: criterion,
          explanation: `This criterion appears in the keyed practical rubric: ${criterion}`,
        });
      });
    });

  curriculumModule.content.forEach((block, blockIndex) => {
    const key = `${curriculumModule.id}-block-${blockIndex + 1}`;
    switch (block.type) {
      case "principle":
      case "standard":
      case "callout":
        add({
          key,
          moduleId: curriculumModule.id,
          kind: "statement",
          prompt: `Which statement is included under "${block.title}" in this module?`,
          answer: block.body,
          explanation: `This statement appears verbatim under ${block.title}.`,
        });
        return;
      case "bullets":
      case "checklist":
      case "steps":
      case "outcomes":
        block.items.forEach((item, itemIndex) => {
          add({
            key: `${key}-item-${itemIndex + 1}`,
            moduleId: curriculumModule.id,
            kind: "statement",
            prompt: `Which item is explicitly included under "${block.title}"?`,
            answer: item,
            explanation: `This item appears verbatim under ${block.title}.`,
          });
        });
        return;
      case "comparison":
        block.rows.forEach((row, rowIndex) => {
          add({
            key: `${key}-row-${rowIndex + 1}`,
            moduleId: curriculumModule.id,
            kind: "comparison",
            prompt: `Which pairing appears in "${block.title}"?`,
            answer: `${row.left} — ${row.right}`,
            explanation: `The approved comparison pairs "${row.left}" with "${row.right}".`,
          });
        });
        return;
      case "script":
        block.lines.forEach((line, lineIndex) => {
          add({
            key: `${key}-line-${lineIndex + 1}`,
            moduleId: curriculumModule.id,
            kind: "script",
            prompt: `Which line appears in the approved "${block.title}" language?`,
            answer: line,
            explanation: `This line appears verbatim in the approved ${block.title} language.`,
          });
        });
        return;
      case "scenario":
      case "practice":
      case "field-assignment":
        block.successCriteria.forEach((criterion, criterionIndex) => {
          add({
            key: `${key}-criterion-${criterionIndex + 1}`,
            moduleId: curriculumModule.id,
            kind: "success",
            prompt: `Which success criterion is explicitly required for "${block.title}"?`,
            answer: criterion,
            explanation: `This is an explicit success criterion for ${block.title}.`,
          });
        });
        return;
      case "menu-reference":
        block.itemIds.forEach((itemId, itemIndex) => {
          const name = menuNameById.get(itemId);
          if (!name) return;
          add({
            key: `${key}-menu-${itemIndex + 1}`,
            moduleId: curriculumModule.id,
            kind: "menu-item",
            prompt: `Which menu item is included in the controlled "${block.title}" reference?`,
            answer: name,
            explanation: `${name} is included by name in this controlled menu reference. Live source checks still govern current availability.`,
          });
        });
        return;
      case "source-control":
        add({
          key: `${key}-status`,
          moduleId: curriculumModule.id,
          kind: "source-status",
          prompt: `What source status is explicitly assigned to "${block.title}"?`,
          answer: sourceStatusLabel(block.status),
          explanation: `${block.title} is explicitly marked ${sourceStatusLabel(block.status).toLocaleLowerCase("en-US")}.`,
        });
        return;
    }
  });

  const seen = new Set<string>();
  return facts.filter((fact) => {
    const fingerprint = `${fact.prompt}\u0000${normalize(fact.answer)}`;
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });
}

function orderedOptions(correctAnswer: string, distractors: readonly string[], seed: string) {
  return uniqueText([correctAnswer, ...distractors])
    .slice(0, 4)
    .sort((left, right) => {
      const hashDifference = stableHash(`${seed}:${left}`) - stableHash(`${seed}:${right}`);
      return hashDifference || left.localeCompare(right);
    });
}

function distractorsFor(
  fact: GroundedFact,
  moduleFacts: readonly GroundedFact[],
  allFacts: readonly GroundedFact[],
) {
  const localAnswers = new Set(moduleFacts.map((candidate) => normalize(candidate.answer)));
  const sameKind = allFacts.filter(
    (candidate) =>
      candidate.key !== fact.key &&
      candidate.moduleId !== fact.moduleId &&
      candidate.kind === fact.kind &&
      isSafeDerivedAnswer(candidate.answer) &&
      !localAnswers.has(normalize(candidate.answer)),
  );
  const fallback = allFacts.filter(
    (candidate) =>
      candidate.key !== fact.key &&
      candidate.moduleId !== fact.moduleId &&
      isSafeDerivedAnswer(candidate.answer) &&
      !localAnswers.has(normalize(candidate.answer)),
  );
  const sortForFact = (values: readonly string[]) =>
    uniqueText(values).sort((left, right) => {
      const hashDifference = stableHash(`${fact.key}:${left}`) - stableHash(`${fact.key}:${right}`);
      return hashDifference || left.localeCompare(right);
    });
  const sameKindAnswers = sortForFact(sameKind.map((candidate) => candidate.answer));
  const sameKindSet = new Set(sameKindAnswers.map(normalize));
  const fallbackAnswers = sortForFact(fallback.map((candidate) => candidate.answer)).filter(
    (answer) => !sameKindSet.has(normalize(answer)),
  );
  return [...sameKindAnswers.slice(0, 3), ...fallbackAnswers].slice(0, 3);
}

function authoredMultiSelectOptions(question: AssessmentQuestion) {
  const selected = Array.isArray(question.correctAnswer) ? [...question.correctAnswer] : [];
  const available = question.options ? [...question.options] : [];
  const notSelected = available.filter(
    (option) => !selected.some((answer) => normalize(answer) === normalize(option)),
  );
  const label = (items: readonly string[]) => items.join("; ");
  const candidates = [
    label(selected),
    label(selected.slice(0, Math.max(1, selected.length - 1))),
    label([...selected.slice(0, Math.max(1, selected.length - 1)), ...notSelected.slice(0, 1)]),
    label(notSelected.length > 0 ? notSelected : available.slice(-2)),
  ];
  return orderedOptions(candidates[0], uniqueText(candidates.slice(1)), question.id);
}

function authoredObjectiveQuestion(
  curriculumModule: CurriculumModule,
  question: AssessmentQuestion,
  facts: readonly GroundedFact[],
): AssessmentBankQuestion | null {
  if (question.type === "multiple-choice" && typeof question.correctAnswer === "string") {
    const options = uniqueText(question.options ?? []);
    if (options.length < 2 || !options.some((option) => normalize(option) === normalize(question.correctAnswer as string))) {
      return null;
    }
    const canonicalAnswer = options.find(
      (option) => normalize(option) === normalize(question.correctAnswer as string),
    ) as string;
    return {
      id: question.id,
      authoredKey: question.id,
      sourceModuleId: curriculumModule.id,
      questionText: question.prompt,
      questionType: "MULTIPLE_CHOICE",
      options,
      correctAnswer: canonicalAnswer,
      explanation: question.explanation ?? `Review the approved ${curriculumModule.title} curriculum.`,
    };
  }

  if (question.type === "true-false" && typeof question.correctAnswer === "boolean") {
    return {
      id: question.id,
      authoredKey: question.id,
      sourceModuleId: curriculumModule.id,
      questionText: question.prompt,
      questionType: "TRUE_FALSE",
      options: ["True", "False"],
      correctAnswer: question.correctAnswer ? "True" : "False",
      explanation: question.explanation ?? `Review the approved ${curriculumModule.title} curriculum.`,
    };
  }

  if (question.type === "multi-select" && Array.isArray(question.correctAnswer)) {
    const options = authoredMultiSelectOptions(question);
    const correctAnswer = question.correctAnswer.join("; ");
    if (options.length < 2 || !options.some((option) => normalize(option) === normalize(correctAnswer))) {
      return null;
    }
    return {
      id: question.id,
      authoredKey: question.id,
      sourceModuleId: curriculumModule.id,
      questionText: `${question.prompt} Choose the option containing the complete correct set.`,
      questionType: "MULTIPLE_CHOICE",
      options,
      correctAnswer,
      explanation: question.explanation ?? `The complete set comes from the keyed ${curriculumModule.title} assessment.`,
    };
  }

  if (question.type === "short-answer" && typeof question.correctAnswer === "string") {
    const distractors = uniqueText(facts.map((fact) => fact.answer))
      .filter((answer) => normalize(answer) !== normalize(question.correctAnswer as string))
      .slice(0, 3);
    const options = orderedOptions(question.correctAnswer, distractors, question.id);
    if (options.length < 2) return null;
    return {
      id: question.id,
      authoredKey: question.id,
      sourceModuleId: curriculumModule.id,
      questionText: question.prompt,
      questionType: "MULTIPLE_CHOICE",
      options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? `Review the approved ${curriculumModule.title} curriculum.`,
    };
  }

  return null;
}

export function buildModuleAssessmentBanks(
  modules: readonly CurriculumModule[],
  menuItems: readonly AssessmentMenuItem[],
): readonly ModuleAssessmentBank[] {
  const menuNameById = new Map(menuItems.map((item) => [item.id, item.name]));
  const factsByModule = new Map(
    modules.map((curriculumModule) => [
      curriculumModule.id,
      extractGroundedFacts(curriculumModule, menuNameById),
    ]),
  );
  const allFacts = [...factsByModule.values()].flat();

  return modules.map((curriculumModule) => {
    const moduleFacts = factsByModule.get(curriculumModule.id) ?? [];
    const authored = curriculumModule.assessment.questions
      .map((question) => authoredObjectiveQuestion(curriculumModule, question, moduleFacts))
      .filter((question): question is AssessmentBankQuestion => question !== null);
    if (authored.length > MODULE_QUESTION_COUNT) {
      throw new Error(`${curriculumModule.id} has more than ${MODULE_QUESTION_COUNT} authored objective questions.`);
    }

    const selectedAnswers = new Set(authored.map((question) => normalize(question.correctAnswer)));
    const selected = [...authored];
    let derivedIndex = 1;
    for (const fact of moduleFacts) {
      if (selected.length >= MODULE_QUESTION_COUNT) break;
      if (selectedAnswers.has(normalize(fact.answer))) continue;
      const distractors = distractorsFor(fact, moduleFacts, allFacts);
      const options = orderedOptions(fact.answer, distractors, fact.key);
      if (options.length < 4) continue;
      selected.push({
        id: `q-v2-${curriculumModule.id}-${String(derivedIndex).padStart(2, "0")}`,
        sourceModuleId: curriculumModule.id,
        questionText: fact.prompt,
        questionType: "MULTIPLE_CHOICE",
        options,
        correctAnswer: fact.answer,
        explanation: fact.explanation,
      });
      selectedAnswers.add(normalize(fact.answer));
      derivedIndex += 1;
    }

    if (selected.length !== MODULE_QUESTION_COUNT) {
      throw new Error(
        `${curriculumModule.id} produced ${selected.length} safe objective questions; expected ${MODULE_QUESTION_COUNT}.`,
      );
    }

    return {
      quizType: "MODULE",
      assessmentVersion: ASSESSMENT_VERSION,
      quizId: `quiz-v2-${curriculumModule.id}`,
      moduleId: curriculumModule.id,
      title: `${curriculumModule.title} Knowledge Check`,
      description: `Ten-question knowledge proof for ${curriculumModule.title}. Practical proof remains in the module.`,
      passingScore: curriculumModule.assessment.passingScore,
      retryLimit: ASSESSMENT_ATTEMPT_LIMIT,
      questions: selected,
    } satisfies ModuleAssessmentBank;
  });
}

const cloneQuestion = (
  question: AssessmentBankQuestion,
  id: string,
): AssessmentBankQuestion => ({
  ...question,
  id,
  ...(question.authoredKey ? { authoredKey: question.authoredKey } : {}),
});

export function buildSectionAssessmentBanks(
  programs: readonly CurriculumProgram[],
  moduleBanks: readonly ModuleAssessmentBank[],
): readonly SectionAssessmentBank[] {
  const bankByModuleId = new Map(moduleBanks.map((bank) => [bank.moduleId, bank]));
  return programs.map((program) => {
    const selections: AssessmentBankQuestion[] = [];
    let questionOffset = 0;
    while (selections.length < SECTION_QUESTION_COUNT) {
      for (const moduleId of program.moduleIds) {
        if (selections.length >= SECTION_QUESTION_COUNT) break;
        const bank = bankByModuleId.get(moduleId);
        if (!bank) throw new Error(`${program.id} cannot find an assessment bank for ${moduleId}.`);
        const sourceQuestion = bank.questions[questionOffset];
        if (!sourceQuestion) {
          throw new Error(`${program.id} exhausted assessment questions while building its checkpoint.`);
        }
        selections.push(
          cloneQuestion(
            sourceQuestion,
            `q-section-v2-${program.slug}-${String(selections.length + 1).padStart(2, "0")}`,
          ),
        );
      }
      questionOffset += 1;
    }

    return {
      quizType: "SECTION",
      assessmentVersion: ASSESSMENT_VERSION,
      quizId: `quiz-section-v2-${program.slug}`,
      programId: program.id,
      programSlug: program.slug,
      sectionId: `sec-${program.slug}`,
      title: `${program.title} Checkpoint`,
      description: `A ten-question checkpoint with evidence from every module in ${program.title}.`,
      passingScore: CHECKPOINT_PASSING_SCORE,
      retryLimit: ASSESSMENT_ATTEMPT_LIMIT,
      coveredModuleIds: [...program.moduleIds],
      questions: selections,
    } satisfies SectionAssessmentBank;
  });
}

export function buildPositionFinalAssessmentBanks(
  positions: readonly Position[],
  programs: readonly CurriculumProgram[],
  moduleBanks: readonly ModuleAssessmentBank[],
): readonly PositionFinalAssessmentBank[] {
  const bankByModuleId = new Map(moduleBanks.map((bank) => [bank.moduleId, bank]));
  return positions.map((position) => {
    const coveredModuleIds = uniqueText(
      programs
        .filter(
          (program) =>
            program.audience.global === true || program.audience.positions.includes(position),
        )
        .flatMap((program) => program.moduleIds),
    );
    const questions = coveredModuleIds.flatMap((moduleId) => {
      const bank = bankByModuleId.get(moduleId);
      if (!bank) throw new Error(`${position} final cannot find an assessment bank for ${moduleId}.`);
      return [4, 8].map((questionIndex, index) => {
        const sourceQuestion = bank.questions[questionIndex];
        if (!sourceQuestion) throw new Error(`${moduleId} does not have final question ${questionIndex + 1}.`);
        return cloneQuestion(
          sourceQuestion,
          `q-final-v2-${slugify(position)}-${moduleId}-${index + 1}`,
        );
      });
    });

    return {
      quizType: "POSITION_FINAL",
      assessmentVersion: ASSESSMENT_VERSION,
      quizId: `quiz-final-v2-${slugify(position)}`,
      position,
      title: `${position} Final Assessment`,
      description: `Comprehensive final with two questions from every active global and ${position} module.`,
      passingScore: CHECKPOINT_PASSING_SCORE,
      retryLimit: ASSESSMENT_ATTEMPT_LIMIT,
      coveredModuleIds,
      questions,
    } satisfies PositionFinalAssessmentBank;
  });
}

const objectiveAuthoredKeys = (curriculumModule: CurriculumModule) =>
  curriculumModule.assessment.questions
    .filter((question) => {
      if (question.type === "multiple-choice") return typeof question.correctAnswer === "string";
      if (question.type === "true-false") return typeof question.correctAnswer === "boolean";
      if (question.type === "multi-select") return Array.isArray(question.correctAnswer);
      if (question.type === "short-answer") return typeof question.correctAnswer === "string";
      return false;
    })
    .map((question) => question.id);

export function validateAssessmentBanks(
  modules: readonly CurriculumModule[],
  programs: readonly CurriculumProgram[],
  positions: readonly Position[],
  moduleBanks: readonly ModuleAssessmentBank[],
  sectionBanks: readonly SectionAssessmentBank[],
  positionFinals: readonly PositionFinalAssessmentBank[],
): AssessmentValidationIssue[] {
  const issues: AssessmentValidationIssue[] = [];
  const allQuizIds = [...moduleBanks, ...sectionBanks, ...positionFinals].map((bank) => bank.quizId);
  const allQuestions = [...moduleBanks, ...sectionBanks, ...positionFinals].flatMap(
    (bank) => bank.questions,
  );

  if (modules.length !== EXPECTED_MODULE_BANKS || moduleBanks.length !== EXPECTED_MODULE_BANKS) {
    issues.push({ code: "assessment-module-count", message: `Expected ${EXPECTED_MODULE_BANKS} modules and module banks; received ${modules.length} and ${moduleBanks.length}.` });
  }
  if (programs.length !== EXPECTED_SECTION_BANKS || sectionBanks.length !== EXPECTED_SECTION_BANKS) {
    issues.push({ code: "assessment-section-count", message: `Expected ${EXPECTED_SECTION_BANKS} programs and section checkpoints; received ${programs.length} and ${sectionBanks.length}.` });
  }
  if (positions.length !== EXPECTED_POSITION_FINALS || positionFinals.length !== EXPECTED_POSITION_FINALS) {
    issues.push({ code: "assessment-final-count", message: `Expected ${EXPECTED_POSITION_FINALS} positions and finals; received ${positions.length} and ${positionFinals.length}.` });
  }
  if (allQuestions.length !== EXPECTED_ASSESSMENT_QUESTIONS) {
    issues.push({ code: "assessment-question-total", message: `Expected ${EXPECTED_ASSESSMENT_QUESTIONS} active assessment questions; received ${allQuestions.length}.` });
  }
  if (new Set(allQuizIds).size !== allQuizIds.length) {
    issues.push({ code: "duplicate-assessment-quiz-id", message: "Assessment quiz IDs must be globally unique." });
  }
  if (new Set(allQuestions.map((question) => question.id)).size !== allQuestions.length) {
    issues.push({ code: "duplicate-assessment-question-id", message: "Assessment question IDs must be globally unique." });
  }

  const moduleById = new Map(modules.map((curriculumModule) => [curriculumModule.id, curriculumModule]));
  const lockedModuleIds = new Set(
    modules
      .filter((curriculumModule) =>
        curriculumModule.content.some(
          (block) => block.type === "source-control" && block.status === "verification-required",
        ),
      )
      .map((curriculumModule) => curriculumModule.id),
  );
  for (const bank of moduleBanks) {
    if (bank.questions.length !== MODULE_QUESTION_COUNT) {
      issues.push({ code: "module-question-count", message: `${bank.quizId} must have exactly ${MODULE_QUESTION_COUNT} questions.` });
    }
    if (!bank.quizId.startsWith("quiz-v2-")) {
      issues.push({ code: "module-quiz-version", message: `${bank.quizId} must use the quiz-v2-* namespace.` });
    }
    if (bank.retryLimit !== ASSESSMENT_ATTEMPT_LIMIT) {
      issues.push({ code: "assessment-attempt-limit", message: `${bank.quizId} must allow exactly ${ASSESSMENT_ATTEMPT_LIMIT} total attempts.` });
    }
    if (bank.questions.some((question) => question.sourceModuleId !== bank.moduleId)) {
      issues.push({ code: "module-source-coverage", message: `${bank.quizId} contains a question from outside ${bank.moduleId}.` });
    }
    const curriculumModule = moduleById.get(bank.moduleId);
    if (!curriculumModule) continue;
    const preservedKeys = new Set(bank.questions.flatMap((question) => question.authoredKey ? [question.authoredKey] : []));
    for (const key of objectiveAuthoredKeys(curriculumModule)) {
      if (!preservedKeys.has(key)) {
        issues.push({ code: "missing-authored-question", message: `${bank.quizId} does not preserve authored question ${key}.` });
      }
    }
  }

  const programById = new Map(programs.map((program) => [program.id, program]));
  for (const bank of sectionBanks) {
    if (bank.questions.length !== SECTION_QUESTION_COUNT) {
      issues.push({ code: "section-question-count", message: `${bank.quizId} must have exactly ${SECTION_QUESTION_COUNT} questions.` });
    }
    const program = programById.get(bank.programId);
    if (!program) {
      issues.push({ code: "unknown-section-program", message: `${bank.quizId} references unknown program ${bank.programId}.` });
      continue;
    }
    if (
      bank.coveredModuleIds.length !== program.moduleIds.length ||
      bank.coveredModuleIds.some((moduleId, index) => moduleId !== program.moduleIds[index])
    ) {
      issues.push({ code: "section-declared-coverage", message: `${bank.quizId} coverage does not exactly match ${program.id}.` });
    }
    const counts = new Map<string, number>();
    bank.questions.forEach((question) => counts.set(question.sourceModuleId, (counts.get(question.sourceModuleId) ?? 0) + 1));
    for (const moduleId of program.moduleIds) {
      if ((counts.get(moduleId) ?? 0) < 1) {
        issues.push({ code: "section-module-coverage", message: `${bank.quizId} does not include ${moduleId}.` });
      }
    }
  }

  for (const bank of positionFinals) {
    if (bank.questions.length !== bank.coveredModuleIds.length * FINAL_QUESTIONS_PER_MODULE) {
      issues.push({ code: "final-question-count", message: `${bank.quizId} must contain exactly two questions per covered module.` });
    }
    const counts = new Map<string, number>();
    bank.questions.forEach((question) => counts.set(question.sourceModuleId, (counts.get(question.sourceModuleId) ?? 0) + 1));
    for (const moduleId of bank.coveredModuleIds) {
      if ((counts.get(moduleId) ?? 0) !== FINAL_QUESTIONS_PER_MODULE) {
        issues.push({ code: "final-module-coverage", message: `${bank.quizId} must include exactly two questions from ${moduleId}.` });
      }
    }
    const expectedModuleIds = uniqueText(
      programs
        .filter(
          (program) =>
            program.audience.global === true || program.audience.positions.includes(bank.position),
        )
        .flatMap((program) => program.moduleIds),
    );
    if (
      bank.coveredModuleIds.length !== expectedModuleIds.length ||
      bank.coveredModuleIds.some((moduleId, index) => moduleId !== expectedModuleIds[index])
    ) {
      issues.push({ code: "final-declared-coverage", message: `${bank.quizId} does not exactly cover the programs assigned to ${bank.position}.` });
    }
  }

  for (const question of allQuestions) {
    const questionMaterial = [
      question.questionText,
      question.correctAnswer,
      question.explanation,
      ...(question.options ?? []),
    ].join(" ");
    if (!/^[A-Za-z0-9][A-Za-z0-9_-]{0,199}$/.test(question.id)) {
      issues.push({ code: "invalid-assessment-question-id", message: `${question.id} is not a valid persisted question ID.` });
    }
    if (
      lockedModuleIds.has(question.sourceModuleId) &&
      /\b\d+(?:\.\d+)?\s*(?:oz|ounce|ounces|ml|dash|dashes|drop|drops)\b/i.test(questionMaterial)
    ) {
      issues.push({ code: "locked-recipe-build-exposed", message: `${question.id} exposes measured content from verification-required module ${question.sourceModuleId}.` });
    }
    if (!question.authoredKey && /\$|\bmarket price\b/i.test(questionMaterial)) {
      issues.push({ code: "derived-price-question", message: `${question.id} derives a volatile price fact.` });
    }
    if (question.questionType === "TRUE_FALSE") {
      if (question.correctAnswer !== "True" && question.correctAnswer !== "False") {
        issues.push({ code: "invalid-true-false-answer", message: `${question.id} must answer True or False.` });
      }
      continue;
    }
    const options = question.options ?? [];
    if (options.some((option) => option.length > 500)) {
      issues.push({ code: "assessment-option-too-long", message: `${question.id} contains an option longer than 500 characters.` });
    }
    if (new Set(options.map(normalize)).size !== options.length) {
      issues.push({ code: "duplicate-question-options", message: `${question.id} contains duplicate answer options.` });
    }
    if (options.length < 2 || !options.some((option) => normalize(option) === normalize(question.correctAnswer))) {
      issues.push({ code: "invalid-objective-question", message: `${question.id} must contain its correct answer among at least two options.` });
    }
  }

  return issues;
}
