import { COCKTAIL_MENU, FOOD_MENU_ITEMS } from "./menu";
import type { ContentBlock, CurriculumModule } from "./types";

const MENU_ITEM_BY_ID = new Map(
  [...FOOD_MENU_ITEMS, ...COCKTAIL_MENU].map((item) => [item.id, item])
);

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const list = (items: readonly string[], ordered = false): string => {
  const tag = ordered ? "ol" : "ul";
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
};

const renderMenuItem = (itemId: string): string => {
  const item = MENU_ITEM_BY_ID.get(itemId);
  if (!item) return `<li><strong>${escapeHtml(itemId)}</strong> - source missing</li>`;

  const description = "description" in item ? item.description : item.guestDescription;
  const status = "status" in item ? item.status : item.sourceStatus;
  const note = "verificationNote" in item ? item.verificationNote : undefined;
  const allergyStatus = "allergyStatus" in item ? item.allergyStatus : undefined;
  return [
    "<li>",
    `<strong>${escapeHtml(item.name)}</strong> <span>${escapeHtml(item.price)}</span>`,
    `<p>${escapeHtml(description)}</p>`,
    `<p><small>Source status: ${escapeHtml(status)}</small></p>`,
    allergyStatus
      ? `<p><small>Allergy status: ${escapeHtml(allergyStatus)} - use the current manager/kitchen verification chain.</small></p>`
      : "",
    note ? `<p><strong>Verify:</strong> ${escapeHtml(note)}</p>` : "",
    "</li>",
  ].join("");
};

export function renderCurriculumBlockHtml(block: ContentBlock): string {
  switch (block.type) {
    case "principle":
    case "standard":
    case "callout":
      return `<section class="curriculum-block curriculum-${block.type} curriculum-tone-${block.tone ?? "navy"}"><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.body)}</p></section>`;
    case "bullets":
    case "checklist":
    case "steps":
    case "outcomes":
      return `<section class="curriculum-block curriculum-${block.type}"><h2>${escapeHtml(block.title)}</h2>${list(block.items, block.type === "steps")}</section>`;
    case "comparison":
      return `<section class="curriculum-block curriculum-comparison"><h2>${escapeHtml(block.title)}</h2><div class="curriculum-table-wrap"><table><thead><tr><th>${escapeHtml(block.leftLabel)}</th><th>${escapeHtml(block.rightLabel)}</th></tr></thead><tbody>${block.rows.map((row) => `<tr><td>${escapeHtml(row.left)}</td><td>${escapeHtml(row.right)}</td></tr>`).join("")}</tbody></table></div></section>`;
    case "script":
      return `<section class="curriculum-block curriculum-script"><h2>${escapeHtml(block.title)}</h2>${block.setup ? `<p>${escapeHtml(block.setup)}</p>` : ""}<blockquote>${block.lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</blockquote></section>`;
    case "scenario":
    case "practice":
    case "field-assignment":
      return `<section class="curriculum-block curriculum-${block.type}"><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.prompt)}</p><h3>Success criteria</h3>${list(block.successCriteria)}</section>`;
    case "menu-reference":
      return `<section class="curriculum-block curriculum-menu-reference"><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.instruction)}</p><ul>${block.itemIds.map(renderMenuItem).join("")}</ul></section>`;
    case "source-control":
      return `<section class="curriculum-block curriculum-source-control curriculum-status-${escapeHtml(block.status)}"><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.body)}</p><p><small>Sources: ${block.sourceIds.map(escapeHtml).join(", ")}</small></p></section>`;
  }
}

/**
 * Generates the complete safe fallback HTML stored in Module.content.
 * A richer page may render the typed blocks directly, but the database copy is
 * still complete and does not rely on any stale hardcoded React module ID.
 */
export function renderCurriculumModuleHtml(module: CurriculumModule): string {
  const blocks = module.content.map(renderCurriculumBlockHtml).join("");
  const questions = module.assessment.questions
    .map((question) => `<li><strong>${escapeHtml(question.type)}</strong>: ${escapeHtml(question.prompt)}</li>`)
    .join("");

  return [
    `<article class="curriculum-module" data-curriculum-module="${escapeHtml(module.id)}">`,
    `<header><p class="curriculum-eyebrow">${module.tags.map(escapeHtml).join(" / ")}</p><h1>${escapeHtml(module.title)}</h1><p>${escapeHtml(module.summary)}</p></header>`,
    `<section class="curriculum-block curriculum-outcomes"><h2>What you will prove</h2>${list(module.outcomes)}</section>`,
    blocks,
    `<section class="curriculum-block curriculum-assessment"><h2>Assessment</h2><p>Passing score: ${module.assessment.passingScore}%${module.assessment.practicalRequired ? "; practical required" : ""}.</p><ol>${questions}</ol></section>`,
    `<footer><small>Sources: ${module.sourceIds.map(escapeHtml).join(", ")}</small></footer>`,
    "</article>",
  ].join("");
}
