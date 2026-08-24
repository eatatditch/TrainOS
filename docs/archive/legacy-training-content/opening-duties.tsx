import {
  LessonIntro,
  ChecklistBlock,
  KeyTakeaway,
} from "../blocks";

export function OpeningDutiesContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Opening Duties"
        subtitle="A strong opening sets the tone for the entire shift. Get it right every time."
        estimatedTime={8}
        tags={["Operations", "Required"]}
        whyItMatters="A disorganized open means a chaotic service. Every task on this list exists because skipping it creates a problem later. Own your opening."
      />

      <ChecklistBlock
        title="Opening Checklist — Complete Every Item Before Service"
        items={[
          "Clock in on time and in full, clean uniform — check your appearance in the mirror",
          "Check the pre-shift notes and daily specials board — know what's 86'd, what's featured, and any VIP reservations",
          "Set up your station: stock plates, silverware, napkins, glassware, and condiments to par levels",
          "Wipe down and sanitize all tables, chairs, booths, and high-touch surfaces in your section",
          "Check that all table settings are complete: menus, salt/pepper, candles, and table numbers",
          "Restock the server station: to-go containers, straws, ramekins, extra silverware, and cleaning supplies",
          "Verify POS system is operational — log in, check your section assignment, and confirm menu items are up to date",
          "Fill ice bins at the server station and bar — do not start service with empty bins",
          "Do a walkthrough of your section: check lighting, music volume, floor cleanliness, and restroom status",
          "Attend the pre-shift meeting — get updates on specials, goals, reservations, and anything the team needs to know",
        ]}
        style="check"
      />

      <KeyTakeaway
        items={[
          "Complete every item on the opening checklist — no shortcuts",
          "Attend the pre-shift meeting — it sets you up for success",
          "Know the specials, 86'd items, and VIP reservations before your first table",
          "A well-stocked station prevents mid-service scrambles",
          "Your section should be guest-ready before the doors open",
        ]}
      />
    </div>
  );
}
