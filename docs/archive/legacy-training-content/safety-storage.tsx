import {
  LessonIntro,
  SectionBlock,
  ChecklistBlock,
  ComparisonTable,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function SafetyStorageContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Receiving & Storage"
        subtitle="Proper receiving, storage, and rotation keep food safe and waste low."
        estimatedTime={12}
        tags={["Safety", "Required"]}
        whyItMatters="Food safety starts at the back door. If you accept or store food incorrectly, no amount of cooking or prep can fix it. Get it right from the start."
      />

      <SectionBlock title="Receiving Deliveries">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Every delivery must be inspected before it is accepted. If something
          is wrong, reject it immediately — do not accept product that does not
          meet standards.
        </p>
        <ChecklistBlock
          title="Receiving Inspection Checklist"
          items={[
            "Check delivery temperature: cold items must be at or below 41F",
            "Frozen items must be solidly frozen with no signs of thawing or refreezing",
            "Inspect packaging for damage, tears, dents, or leaks",
            "Verify quantities match the invoice and purchase order",
            "Check expiration and use-by dates on all items",
            "Look for signs of pest activity on boxes or packaging",
            "Reject any cans that are dented, bulging, or rusted",
            "Store deliveries within 15 minutes — do not leave product on the dock",
          ]}
          style="check"
        />
      </SectionBlock>

      <CalloutBlock type="important" title="FIFO — First In, First Out">
        <p>
          Always rotate stock so that older product is used first. When putting
          away deliveries, place new product behind existing product. Label
          everything with the date received. FIFO prevents waste and ensures
          guests always get the freshest product.
        </p>
      </CalloutBlock>

      <SectionBlock title="Shelf Life Reference">
        <ComparisonTable
          headers={["Item", "Refrigerated Shelf Life", "Storage Notes"]}
          rows={[
            ["Raw chicken", "1-2 days", "Bottom shelf, below all other items"],
            ["Raw ground beef", "1-2 days", "Below ready-to-eat foods"],
            ["Raw steak", "3-5 days", "Below ready-to-eat foods"],
            ["Raw fish/seafood", "1-2 days", "On ice or bottom shelf"],
            ["Prepped guacamole", "1 day", "Covered, plastic wrap touching surface"],
            ["Prepped pico de gallo", "2 days", "Covered, labeled with date"],
            ["Cut lettuce/greens", "3 days", "Covered, away from raw proteins"],
            ["Cooked rice", "3 days", "Covered, cooled properly before storing"],
            ["Opened sauces", "5-7 days", "Covered, labeled with open date"],
            ["Dairy (milk, cream)", "Use by date", "Store at 38-41F"],
          ]}
        />
      </SectionBlock>

      <SectionBlock title="Storage Order in the Walk-In">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Store items in the correct order on shelves to prevent
          cross-contamination. The rule is simple: ready-to-eat on top, raw
          proteins on the bottom, organized by cooking temperature.
        </p>
        <ChecklistBlock
          title="Top to Bottom Storage Order"
          items={[
            "TOP SHELF: Ready-to-eat foods (prepped items, desserts, produce to be served raw)",
            "SECOND SHELF: Fruits, vegetables, and items that will be cooked",
            "THIRD SHELF: Whole cuts of raw beef and pork (cook to 145F)",
            "FOURTH SHELF: Raw ground meats (cook to 155F)",
            "BOTTOM SHELF: Raw poultry (cook to 165F) — always the lowest shelf",
          ]}
          style="number"
        />
      </SectionBlock>

      <CalloutBlock type="warning" title="Freezer Pulls">
        <p>
          Never thaw food at room temperature. There are only three safe methods
          to thaw frozen product: in the refrigerator (plan ahead — this takes
          24-48 hours), under cold running water (70F or below), or as part of
          the cooking process. Thaw in the fridge whenever possible to maintain
          the cold chain.
        </p>
      </CalloutBlock>

      <SectionBlock title="Labeling Standards">
        <p className="text-gray-700 text-sm leading-relaxed">
          Every item that is prepped, opened, or transferred to a new container
          must be labeled with the item name, the date prepared or opened, and
          the use-by date. No label means the item gets thrown out — no
          exceptions.
        </p>
      </SectionBlock>

      <KeyTakeaway
        items={[
          "Inspect every delivery — reject anything that doesn't meet standards",
          "FIFO: First In, First Out — rotate all stock, every time",
          "Store raw proteins below ready-to-eat foods, ordered by cooking temp",
          "Never thaw food at room temperature — use the fridge, cold water, or cook from frozen",
          "Label everything with item name, date, and use-by date",
          "Store deliveries within 15 minutes of receiving",
        ]}
      />
    </div>
  );
}
