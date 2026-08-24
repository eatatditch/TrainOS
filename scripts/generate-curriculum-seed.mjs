import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const buildDir = mkdtempSync(join(tmpdir(), "trainos-curriculum-"));
const outputPath = join(scriptDir, "seed-authoritative-curriculum.sql");

const sqlString = (value) => `'${String(value).replaceAll("'", "''")}'`;
const sqlArray = (values) =>
  values.length === 0
    ? "ARRAY[]::text[]"
    : `ARRAY[${values.map(sqlString).join(", ")}]::text[]`;
const htmlLiteral = (value) => `$curriculum_html$${value}$curriculum_html$`;
const json = (value) => `${sqlString(JSON.stringify(value))}::jsonb`;

const foodSearchContent = (item) =>
  [
    `Category: ${item.category}`,
    `Price: ${item.price}`,
    `Description: ${item.description}`,
    item.addOns?.length ? `Modifications: ${item.addOns.join("; ")}` : null,
    "Source Status: Current supplied printed menu; live POS controls price and availability.",
    "Allergy Status: VERIFICATION REQUIRED. This guest-facing description is not an ingredient, dietary, or allergen certification. Involve a manager and the kitchen before answering an allergy question.",
  ]
    .filter(Boolean)
    .join("\n");

const foodSearchTags = (item) => {
  const categoryAlias = {
    "Share + Socialize": "starters",
    "Soup + Salads": "salads",
    Tacos: "tacos",
    Sides: "sides",
    Bowls: "bowls",
    Platos: "platos",
    Handhelds: "handhelds",
    Dessert: "dessert",
  }[item.category];
  return [
    "food",
    "current-menu",
    "allergy-verification-required",
    item.category.toLowerCase(),
    categoryAlias,
  ].filter(Boolean);
};

const recipeModuleId = (item) => {
  if (item.status === "verification-required") return "cur-bartender-locked-rotating";
  if (item.category === "Specialty Marg") return "cur-bartender-approved-signatures-1";
  return "cur-bartender-approved-signatures-2";
};

const recipeSearchContent = (item) => {
  const lines = [
    `Printed Menu: ${item.name} (${item.price})`,
    `Category: ${item.category}`,
    `Guest Description: ${item.guestDescription}`,
    `Flavor Lane: ${item.flavorLane.join(", ")}`,
    `Training Status: ${item.status === "approved" ? "APPROVED CONTROLLED BUILD" : "VERIFICATION REQUIRED - DO NOT TRAIN OR BUILD FROM THIS RECORD"}`,
    item.allergyWarning ? `Allergy Warning: ${item.allergyWarning}` : null,
  ].filter(Boolean);

  // A locked item deliberately publishes no measured build. This prevents a
  // known conflict or typo from becoming executable SpecOS guidance.
  if (item.status === "approved") {
    if (item.glass) lines.push(`Glass: ${item.glass}${item.ice ? ` | Ice: ${item.ice}` : ""}`);
    if (item.build?.length) lines.push(`Ingredients: ${item.build.join(", ")}`);
    if (item.finish?.length) lines.push(`Garnish: ${item.finish.join("; ")}`);
    if (item.method) lines.push(`Procedure: ${item.method}. Follow the controlled August 2026 bar manual and current recipe lock.`);
    lines.push("Note: Verify current availability and recipe-lock status at shift start. Never infer an allergy answer from this recipe record.");
  } else {
    lines.push(`Note: ${item.verificationNote ?? "A manager must approve the current recipe lock before training."} Never infer an allergy answer from this record.`);
  }

  return lines.join("\n");
};

const recipeSearchTags = (item) => [
  "recipe",
  "current-menu",
  item.category === "Zero Proof" ? "zero-proof" : "cocktail",
  item.category.toLowerCase(),
  item.status,
];

const plainBlock = (block) => {
  switch (block.type) {
    case "principle":
    case "standard":
    case "callout":
      return `${block.title}: ${block.body}`;
    case "bullets":
    case "checklist":
    case "steps":
    case "outcomes":
      return `${block.title}: ${block.items.join("; ")}`;
    case "comparison":
      return `${block.title}: ${block.rows.map((row) => `${row.left} -> ${row.right}`).join("; ")}`;
    case "script":
      return `${block.title}: ${block.lines.join("; ")}`;
    case "scenario":
    case "practice":
    case "field-assignment":
      return `${block.title}: ${block.prompt}. Proof: ${block.successCriteria.join("; ")}`;
    case "menu-reference":
      return `${block.title}: ${block.instruction}. Items: ${block.itemIds.join(", ")}`;
    case "source-control":
      return `${block.title} [${block.status}]: ${block.body}`;
  }
};

try {
  execFileSync(
    join(repoRoot, "node_modules/.bin/tsc"),
    [
      "src/lib/curriculum/index.ts",
      "--outDir",
      buildDir,
      "--module",
      "commonjs",
      "--moduleResolution",
      "node",
      "--target",
      "ES2022",
      "--esModuleInterop",
      "--skipLibCheck",
      "--noEmit",
      "false",
    ],
    { cwd: repoRoot, stdio: "inherit" }
  );

  const require = createRequire(import.meta.url);
  const curriculum = require(join(buildDir, "curriculum/index.js"));
  const {
    COCKTAIL_MENU,
    CURRENT_MENU_INFO,
    CURRICULUM_MODULES,
    CURRICULUM_PROGRAMS,
    FOOD_MENU_ITEMS,
    FOOD_MENU_OFFERS,
    renderCurriculumModuleHtml,
    validateCurriculum,
  } = curriculum;

  const validationIssues = validateCurriculum();
  if (validationIssues.length > 0) {
    throw new Error(`Curriculum validation failed:\n${validationIssues.map((issue) => `- ${issue.code}: ${issue.message}`).join("\n")}`);
  }

  const sections = CURRICULUM_PROGRAMS.map((program, index) => ({
    id: `sec-${program.slug}`,
    title: program.title,
    description: program.summary,
    slug: program.slug,
    sortOrder: (index + 1) * 10,
  }));
  const sectionByProgram = new Map(
    CURRICULUM_PROGRAMS.map((program) => [program.id, `sec-${program.slug}`])
  );
  const sectionIds = sections.map((section) => section.id);
  const curriculumModuleIds = CURRICULUM_MODULES.map((curriculumModule) => curriculumModule.id);
  const pathIds = CURRICULUM_PROGRAMS.map((program) => `path-${program.slug}`);
  const moduleSearchIds = CURRICULUM_MODULES.map((curriculumModule) => `search-${curriculumModule.id}`);
  const foodSearchIds = FOOD_MENU_ITEMS.map((item) => item.id);
  const recipeSearchIds = COCKTAIL_MENU.map((item) => `recipe-${item.id}`);
  const menuInfoItems = [
    ...FOOD_MENU_OFFERS.map((item) => ({ ...item, moduleId: "cur-server-food-menu", tags: ["food", "offer"] })),
    ...CURRENT_MENU_INFO,
  ];
  const menuInfoSearchIds = menuInfoItems.map((item) => `menu-info-${item.id}`);
  const programByModule = new Map();
  for (const program of CURRICULUM_PROGRAMS) {
    for (const moduleId of program.moduleIds) programByModule.set(moduleId, program);
  }

  const lines = [
    "-- GENERATED FILE. Edit src/lib/curriculum/**, then run:",
    "--   node scripts/generate-curriculum-seed.mjs",
    "--",
    "-- Authoritative Ditch curriculum seed. Idempotent for sections, modules, paths,",
    "-- quizzes, and search records. Legacy content is deactivated rather than deleted,",
    "-- and generated path membership/questions are replaced only for owned IDs.",
    "-- Existing completions, quiz attempts, and assignments are preserved.",
    "-- Review in a non-production branch before applying. No remote database change",
    "-- occurs by generating this file.",
    "",
    "BEGIN;",
    "",
    "INSERT INTO \"Section\" (id, title, description, slug, icon, \"sortOrder\", \"isActive\") VALUES",
    sections
      .map((section) => `  (${sqlString(section.id)}, ${sqlString(section.title)}, ${sqlString(section.description)}, ${sqlString(section.slug)}, '', ${section.sortOrder}, true)`)
      .join(",\n") +
      "\nON CONFLICT (id) DO UPDATE SET\n  title = EXCLUDED.title,\n  description = EXCLUDED.description,\n  slug = EXCLUDED.slug,\n  \"sortOrder\" = EXCLUDED.\"sortOrder\",\n  \"isActive\" = true;",
    "",
    "INSERT INTO \"Module\" (id, \"sectionId\", title, description, slug, content, \"estimatedMinutes\", \"isRequired\", \"isActive\", \"sortOrder\", tags) VALUES",
  ];

  const modulesByProgram = new Map();
  for (const curriculumModule of CURRICULUM_MODULES) {
    const program = programByModule.get(curriculumModule.id);
    if (!program) throw new Error(`No program owns module ${curriculumModule.id}`);
    const programModules = modulesByProgram.get(program.id) ?? [];
    programModules.push(curriculumModule);
    modulesByProgram.set(program.id, programModules);
  }

  const moduleRows = [];
  for (const program of CURRICULUM_PROGRAMS) {
    const programModules = modulesByProgram.get(program.id) ?? [];
    programModules.forEach((curriculumModule, index) => {
      moduleRows.push(
        `  (${sqlString(curriculumModule.id)}, ${sqlString(sectionByProgram.get(program.id))}, ${sqlString(curriculumModule.title)}, ${sqlString(curriculumModule.summary)}, ${sqlString(curriculumModule.slug)}, ${htmlLiteral(renderCurriculumModuleHtml(curriculumModule))}, ${curriculumModule.estimatedMinutes}, true, true, ${(index + 1) * 10}, ${sqlArray([...curriculumModule.tags, ...(curriculumModule.assessment.practicalRequired ? ["practical-required"] : [])])})`
      );
    });
  }
  lines.push(
    moduleRows.join(",\n") +
      "\nON CONFLICT (id) DO UPDATE SET\n  \"sectionId\" = EXCLUDED.\"sectionId\",\n  title = EXCLUDED.title,\n  description = EXCLUDED.description,\n  slug = EXCLUDED.slug,\n  content = EXCLUDED.content,\n  \"estimatedMinutes\" = EXCLUDED.\"estimatedMinutes\",\n  \"isRequired\" = true,\n  \"isActive\" = true,\n  \"sortOrder\" = EXCLUDED.\"sortOrder\",\n  tags = EXCLUDED.tags;",
    "",
    "INSERT INTO \"TrainingPath\" (id, title, description, \"targetRole\", \"targetPositions\", \"moduleIntervalDays\", \"isActive\") VALUES",
    CURRICULUM_PROGRAMS.map(
      (program) =>
        `  (${sqlString(`path-${program.slug}`)}, ${sqlString(program.title)}, ${sqlString(program.summary)}, ${sqlString(program.audience.roles[0] ?? "")}, ${sqlArray(program.audience.global ? [] : program.audience.positions)}, ${program.moduleIntervalDays}, true)`
    ).join(",\n") +
      "\nON CONFLICT (id) DO UPDATE SET\n  title = EXCLUDED.title,\n  description = EXCLUDED.description,\n  \"targetRole\" = EXCLUDED.\"targetRole\",\n  \"targetPositions\" = EXCLUDED.\"targetPositions\",\n  \"moduleIntervalDays\" = EXCLUDED.\"moduleIntervalDays\",\n  \"isActive\" = true;",
    "",
    `DELETE FROM \"TrainingPathModule\" WHERE \"trainingPathId\" IN (${CURRICULUM_PROGRAMS.map((program) => sqlString(`path-${program.slug}`)).join(", ")});`,
    "INSERT INTO \"TrainingPathModule\" (\"trainingPathId\", \"moduleId\", \"sortOrder\", \"isRequired\") VALUES",
    CURRICULUM_PROGRAMS.flatMap((program) =>
      program.moduleIds.map(
        (moduleId, index) =>
          `  (${sqlString(`path-${program.slug}`)}, ${sqlString(moduleId)}, ${(index + 1) * 10}, true)`
      )
    ).join(",\n") + ";",
    "",
    "-- Retire the replaced curriculum without breaking historical completions or attempts.",
    `UPDATE "Section" SET "isActive" = false WHERE "isActive" = true AND id NOT IN (${sectionIds.map(sqlString).join(", ")});`,
    `UPDATE "Module" SET "isActive" = false WHERE "isActive" = true AND id NOT IN (${curriculumModuleIds.map(sqlString).join(", ")});`,
    `UPDATE "TrainingPath" SET "isActive" = false WHERE "isActive" = true AND id NOT IN (${pathIds.map(sqlString).join(", ")});`,
    "",
    "-- Reconcile every active employee onto the all-team Hospitality Reset plus",
    "-- every current path matching their explicit position.",
    "-- Rollout deadlines start now for established employees so historic hire dates do not",
    "-- make the replacement curriculum immediately overdue. Existing links remain untouched.",
    `WITH applicable_paths AS (
  SELECT
    u.id AS user_id,
    p.id AS path_id,
    GREATEST(COALESCE(u."hireDate", CURRENT_TIMESTAMP::timestamp), CURRENT_TIMESTAMP::timestamp) AS rollout_start,
    GREATEST(p."moduleIntervalDays", 1) AS interval_days,
    COUNT(s.id)::integer AS module_count
  FROM "User" u
  JOIN "TrainingPath" p
    ON p.id = 'path-hospitality-reset'
    OR u.position = ANY (p."targetPositions")
  LEFT JOIN "TrainingPathModule" tpm ON tpm."trainingPathId" = p.id
  LEFT JOIN "Module" m ON m.id = tpm."moduleId" AND m."isActive" = true
  LEFT JOIN "Section" s ON s.id = m."sectionId" AND s."isActive" = true
  WHERE u."isActive" = true
    AND p."isActive" = true
    AND p.id IN (${pathIds.map(sqlString).join(", ")})
  GROUP BY u.id, u."hireDate", p.id, p."moduleIntervalDays"
)
INSERT INTO "UserTrainingPath" ("userId", "trainingPathId", "dueDate", "assignedReason", "isActive")
SELECT
  user_id,
  path_id,
  rollout_start + make_interval(days => interval_days * module_count),
  'position',
  true
FROM applicable_paths
ON CONFLICT ("userId", "trainingPathId") DO UPDATE SET
  "dueDate" = CASE
    WHEN "UserTrainingPath"."isActive" = false THEN EXCLUDED."dueDate"
    ELSE "UserTrainingPath"."dueDate"
  END,
  "assignedReason" = CASE
    WHEN "UserTrainingPath"."isActive" = false THEN EXCLUDED."assignedReason"
    ELSE "UserTrainingPath"."assignedReason"
  END,
  "isActive" = true;`,
    "",
    `WITH applicable_modules AS (
  SELECT
    u.id AS user_id,
    p.id AS path_id,
    tpm."moduleId" AS module_id,
    tpm."isRequired" AS is_required,
    GREATEST(COALESCE(u."hireDate", CURRENT_TIMESTAMP::timestamp), CURRENT_TIMESTAMP::timestamp) AS rollout_start,
    GREATEST(p."moduleIntervalDays", 1) AS interval_days,
    (ROW_NUMBER() OVER (
      PARTITION BY u.id, p.id
      ORDER BY tpm."sortOrder", tpm."moduleId"
    ))::integer AS module_sequence
  FROM "User" u
  JOIN "TrainingPath" p
    ON p.id = 'path-hospitality-reset'
    OR u.position = ANY (p."targetPositions")
  JOIN "TrainingPathModule" tpm ON tpm."trainingPathId" = p.id
  JOIN "Module" m ON m.id = tpm."moduleId" AND m."isActive" = true
  JOIN "Section" s ON s.id = m."sectionId" AND s."isActive" = true
  WHERE u."isActive" = true
    AND p."isActive" = true
    AND p.id IN (${pathIds.map(sqlString).join(", ")})
)
INSERT INTO "ModuleAssignment" ("userId", "moduleId", "isRequired", "dueDate", "isDirect", "sourcePathIds", "isActive")
SELECT
  user_id,
  module_id,
  is_required,
  rollout_start + make_interval(days => interval_days * module_sequence),
  false,
  ARRAY[path_id]::text[],
  true
FROM applicable_modules
ON CONFLICT ("userId", "moduleId") DO UPDATE SET
  "isRequired" = CASE
    WHEN "ModuleAssignment"."isActive" = false THEN EXCLUDED."isRequired"
    ELSE "ModuleAssignment"."isRequired" OR EXCLUDED."isRequired"
  END,
  "dueDate" = CASE
    WHEN "ModuleAssignment"."isActive" = false THEN EXCLUDED."dueDate"
    WHEN "ModuleAssignment"."dueDate" IS NULL THEN EXCLUDED."dueDate"
    WHEN EXCLUDED."dueDate" IS NULL THEN "ModuleAssignment"."dueDate"
    ELSE LEAST("ModuleAssignment"."dueDate", EXCLUDED."dueDate")
  END,
  "isActive" = true,
  "sourcePathIds" = CASE
    WHEN "ModuleAssignment"."isActive" = false THEN EXCLUDED."sourcePathIds"
    ELSE (
      SELECT ARRAY_AGG(DISTINCT source_id)
      FROM UNNEST("ModuleAssignment"."sourcePathIds" || EXCLUDED."sourcePathIds") AS source_id
    )
  END;`,
    ""
  );

  const quizRows = [];
  const questionRows = [];
  const quizIds = [];
  for (const curriculumModule of CURRICULUM_MODULES) {
    const gradable = curriculumModule.assessment.questions.filter((question) => {
      if (question.type === "multiple-choice") return typeof question.correctAnswer === "string";
      if (question.type === "true-false") return typeof question.correctAnswer === "boolean";
      if (question.type === "short-answer") return typeof question.correctAnswer === "string";
      return false;
    });
    if (gradable.length === 0) continue;

    const quizId = `quiz-${curriculumModule.id}`;
    quizIds.push(quizId);
    quizRows.push(
      `  (${sqlString(quizId)}, ${sqlString(curriculumModule.id)}, NULL, ${sqlString(`${curriculumModule.title} Knowledge Check`)}, ${sqlString(`Knowledge proof for ${curriculumModule.title}. Practical proof remains in the module.`)}, ${curriculumModule.assessment.passingScore}, ${curriculumModule.assessment.retryLimit}, true)`
    );
    gradable.forEach((question, index) => {
      const questionType =
        question.type === "multiple-choice"
          ? "MULTIPLE_CHOICE"
          : question.type === "true-false"
            ? "TRUE_FALSE"
            : "SHORT_ANSWER";
      const options =
        question.type === "multiple-choice"
          ? question.options ?? []
          : question.type === "true-false"
            ? ["True", "False"]
            : null;
      const answer =
        typeof question.correctAnswer === "boolean"
          ? question.correctAnswer
            ? "True"
            : "False"
          : question.correctAnswer;
      questionRows.push(
        `  (${sqlString(question.id)}, ${sqlString(quizId)}, ${sqlString(question.prompt)}, ${sqlString(questionType)}, ${options ? json(options) : "NULL"}, ${sqlString(answer)}, ${sqlString(question.explanation ?? "Review the approved curriculum source and run the practical rep.")}, ${index + 1})`
      );
    });
  }

  if (quizRows.length > 0) {
    lines.push(
      "INSERT INTO \"Quiz\" (id, \"moduleId\", \"sectionId\", title, description, \"passingScore\", \"retryLimit\", \"isRequired\") VALUES",
      quizRows.join(",\n") +
        "\nON CONFLICT (id) DO UPDATE SET\n  \"moduleId\" = EXCLUDED.\"moduleId\",\n  title = EXCLUDED.title,\n  description = EXCLUDED.description,\n  \"passingScore\" = EXCLUDED.\"passingScore\",\n  \"retryLimit\" = EXCLUDED.\"retryLimit\",\n  \"isRequired\" = true;",
      "",
      `DELETE FROM \"QuizQuestion\" WHERE \"quizId\" IN (${quizIds.map(sqlString).join(", ")});`,
      "INSERT INTO \"QuizQuestion\" (id, \"quizId\", \"questionText\", \"questionType\", options, \"correctAnswer\", explanation, \"sortOrder\") VALUES",
      questionRows.join(",\n") + ";",
      ""
    );
  }

  const moduleSearchRows = CURRICULUM_MODULES.map((curriculumModule) => {
    const content = [
      curriculumModule.summary,
      `Outcomes: ${curriculumModule.outcomes.join("; ")}`,
      ...curriculumModule.content.map(plainBlock),
    ].join("\n");
    return `  (${sqlString(`search-${curriculumModule.id}`)}, ${sqlString(curriculumModule.id)}, 'module', ${sqlString(curriculumModule.title)}, ${sqlString(content)}, ${sqlArray(["curriculum", ...curriculumModule.tags, ...(curriculumModule.assessment.practicalRequired ? ["practical-required"] : [])])})`;
  });

  const foodSearchRows = FOOD_MENU_ITEMS.map(
    (item) =>
      `  (${sqlString(item.id)}, 'cur-server-food-menu', 'food', ${sqlString(item.name)}, ${sqlString(foodSearchContent(item))}, ${sqlArray(foodSearchTags(item))})`
  );

  const recipeSearchRows = COCKTAIL_MENU.map(
    (item) =>
      `  (${sqlString(`recipe-${item.id}`)}, ${sqlString(recipeModuleId(item))}, 'recipe', ${sqlString(`${item.name} Recipe`)}, ${sqlString(recipeSearchContent(item))}, ${sqlArray(recipeSearchTags(item))})`
  );

  const menuInfoSearchRows = menuInfoItems.map((item) => {
    const content = [
      `Price: ${item.price}`,
      `Description: ${item.description}`,
      "Source Status: Current supplied printed menu snapshot; live POS and manager-posted availability win.",
      "Allergy Status: VERIFICATION REQUIRED. Involve a manager and the kitchen before answering an allergy question.",
    ].join("\n");
    return `  (${sqlString(`menu-info-${item.id}`)}, ${sqlString(item.moduleId)}, 'menu-info', ${sqlString(item.title)}, ${sqlString(content)}, ${sqlArray(["current-menu", ...item.tags])})`;
  });

  lines.push(
    "-- SpecOS receives only this controlled menu snapshot. Clear old ingredient links",
    "-- before replacing food rows so stale allergen inheritance cannot attach to a current ID.",
    `DELETE FROM "FoodItemIngredient"
WHERE "foodItemId" IN (SELECT id FROM "SearchIndex" WHERE "contentType" = 'food')
   OR "foodItemId" IN (${foodSearchIds.map(sqlString).join(", ")});`,
    `DELETE FROM "SearchIndex" WHERE "contentType" = 'module' AND id NOT IN (${moduleSearchIds.map(sqlString).join(", ")});`,
    `DELETE FROM "SearchIndex" WHERE "contentType" = 'food' AND id NOT IN (${foodSearchIds.map(sqlString).join(", ")});`,
    `DELETE FROM "SearchIndex" WHERE "contentType" = 'recipe' AND id NOT IN (${recipeSearchIds.map(sqlString).join(", ")});`,
    `DELETE FROM "SearchIndex" WHERE "contentType" = 'menu-info' AND id NOT IN (${menuInfoSearchIds.map(sqlString).join(", ")});`,
    "",
    "INSERT INTO \"SearchIndex\" (id, \"moduleId\", \"contentType\", title, content, tags) VALUES",
    [...moduleSearchRows, ...foodSearchRows, ...recipeSearchRows, ...menuInfoSearchRows].join(",\n") +
      "\nON CONFLICT (id) DO UPDATE SET\n  \"moduleId\" = EXCLUDED.\"moduleId\",\n  \"contentType\" = EXCLUDED.\"contentType\",\n  title = EXCLUDED.title,\n  content = EXCLUDED.content,\n  tags = EXCLUDED.tags;",
    "",
    "COMMIT;",
    ""
  );

  writeFileSync(outputPath, lines.join("\n"), "utf8");
  process.stdout.write(`Generated ${outputPath}\n`);
} finally {
  rmSync(buildDir, { recursive: true, force: true });
}
