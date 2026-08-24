import {
  LessonIntro,
  SectionBlock,
  ChecklistBlock,
  KeyTakeaway,
} from "../blocks";

export function ClosingDutiesContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Closing Duties"
        subtitle="Leave the restaurant better than you found it. A great close makes tomorrow's open seamless."
        estimatedTime={8}
        tags={["Operations", "Required"]}
        whyItMatters="The closing crew sets up the opening crew for success. Cutting corners at close means a rough morning for your teammates. Take pride in your close."
      />

      <ChecklistBlock
        title="End-of-Shift Closing Checklist"
        items={[
          "Close out all open checks — verify every table is settled before you cash out",
          "Wipe down and sanitize all tables, chairs, booths, and high-touch surfaces in your section",
          "Restock your station to opening par levels: silverware, napkins, plates, glassware, condiments, and to-go supplies",
          "Break down, clean, and sanitize the server station — counters, bins, and all surfaces",
          "Sweep and spot-mop your section, including under tables and booths",
        ]}
        style="check"
      />

      <SectionBlock title="During-Shift Maintenance">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Closing is not just the last 30 minutes of your shift. These tasks
          should happen throughout service to prevent a massive end-of-night
          cleanup.
        </p>
        <ChecklistBlock
          title="Ongoing During Service"
          items={[
            "Pre-bus tables continuously — never let plates or glasses pile up",
            "Wipe down and reset tables immediately after each party leaves",
            "Restock supplies as they run low — do not wait until close",
            "Keep the server station organized and clean throughout the shift",
            "Check restrooms every 30-60 minutes for cleanliness and supplies",
          ]}
          style="check"
        />
      </SectionBlock>

      <KeyTakeaway
        items={[
          "Close out all checks before cashing out — no open tabs",
          "Restock to par levels so the morning crew is set up for success",
          "Clean as you go during service — it makes closing faster",
          "Sweep and mop your section, including under tables",
          "A great close is a gift to the opening team — and to yourself on your next open",
        ]}
      />
    </div>
  );
}
