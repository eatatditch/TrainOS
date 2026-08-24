import {
  LessonIntro,
  SectionBlock,
  ChecklistBlock,
  CalloutBlock,
  QuickRef,
  KeyTakeaway,
} from "../blocks";

export function ServerStationContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Station Mechanics & Service Flow"
        subtitle="Master the habits that separate efficient servers from overwhelmed ones."
        estimatedTime={12}
        tags={["Server", "Required"]}
        whyItMatters="Great servers don't just work hard — they work smart. Station mechanics are the system that keeps you in control, even on the busiest nights."
      />

      <SectionBlock title="Work in Loops">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Never make a single-purpose trip. Every time you leave a table or the
          kitchen, you should be accomplishing multiple tasks. A loop means you
          are always dropping off, picking up, scanning, and moving — never
          standing still.
        </p>
        <QuickRef
          type="do"
          title="The Loop in Action"
          items={[
            "Drop drinks at table 5, clear plates from table 6, check on table 7 — all in one trip",
            "Grab refills, silverware, or condiments on your way out of the kitchen",
            "Pre-bus a table every time you pass it, even if it's not yours",
            "Scan the room as you walk — look for empty glasses, raised hands, dirty plates",
            "Full hands in, full hands out — never walk empty-handed",
          ]}
        />
      </SectionBlock>

      <SectionBlock title="Full Hands In, Full Hands Out">
        <p className="text-gray-700 text-sm leading-relaxed">
          This is the single most important habit you can develop. Every time
          you walk into the kitchen, bring dirty plates. Every time you walk
          out, bring something the floor needs. Empty hands mean wasted steps
          and wasted time.
        </p>
      </SectionBlock>

      <SectionBlock title="Scan the Room">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Before you head to the back, take 3 seconds to scan your section and
          the surrounding area. You will catch problems before they become
          complaints and spot opportunities to help teammates.
        </p>
      </SectionBlock>

      <SectionBlock title="Rules of Service">
        <ChecklistBlock
          title="Service Standards"
          items={[
            "Serve food from the right side of the guest",
            "Serve and clear beverages from the left",
            "Ladies first when serving the table",
            "Clear only when everyone at the table is finished — never pull plates early",
            "Two hands on every plate — thumb never touches the food",
            "Carry a crumber or towel for table maintenance between courses",
            "Never stack plates in front of the guest — clear one at a time",
            "Carry a maximum of what you can handle safely — two trips beats a dropped plate",
          ]}
          style="check"
        />
      </SectionBlock>

      <SectionBlock title="Quality Control">
        <ChecklistBlock
          title="Before Every Plate Leaves the Window"
          items={[
            "Correct plate for the correct seat number",
            "Presentation matches the menu photo and standard",
            "All garnishes and sauces are present",
            "Plate is clean — no drips, smudges, or fingerprints on the rim",
            "Temperature is correct — hot food hot, cold food cold",
          ]}
          style="check"
        />
      </SectionBlock>

      <CalloutBlock type="important" title="The Key Principle">
        <p>
          Urgency without panic. Move with purpose and speed, but never look
          rushed or stressed in front of guests. The best servers look calm and
          in control even when it is chaos behind the scenes.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Work in loops — never make a single-purpose trip",
          "Full hands in, full hands out — no empty-handed trips",
          "Scan the room before every trip to the back",
          "Follow the rules of service for professional plate handling",
          "Quality-check every plate before it leaves the window",
          "Urgency without panic — stay calm, move with purpose",
        ]}
      />
    </div>
  );
}
