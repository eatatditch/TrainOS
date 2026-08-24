import {
  LessonIntro,
  SectionBlock,
  StepBlock,
  QuickRef,
  KeyTakeaway,
} from "../blocks";

export function SupportHostContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Host Sequence of Service"
        subtitle="You are the first and last impression of Ditch. Make every greeting count."
        estimatedTime={12}
        tags={["Support", "Required"]}
        whyItMatters="The host sets the tone for the entire dining experience. A warm, organized, and confident host makes guests feel welcome before they even sit down."
      />

      <SectionBlock title="The 6-Step Host Sequence">
        <StepBlock
          steps={[
            {
              title: "Greet Within 15 Seconds",
              description:
                "Every guest who walks through the door gets acknowledged within 15 seconds — even if you are busy with another party. A smile and eye contact go a long way.",
              details: [
                "\"Welcome to Ditch! How many are in your party today?\"",
                "If you're seating someone else, make eye contact and say \"I'll be right with you!\"",
              ],
            },
            {
              title: "Determine Party Size & Preferences",
              description:
                "Ask how many guests, whether they prefer indoor or patio seating, and if they have a reservation.",
              details: [
                "Check the reservation list and waitlist before seating",
                "Note any special requests: highchairs, booths, accessibility needs",
              ],
            },
            {
              title: "Quote Wait Times Accurately",
              description:
                "If there is a wait, give an honest estimate. Underpromising and overdelivering is better than the reverse. Put their name on the waitlist and explain the process.",
              details: [
                "\"It looks like about a 20-minute wait — I'll text you when your table is ready\"",
                "Never say \"just a few minutes\" if it will be longer",
              ],
            },
            {
              title: "Seat the Guest",
              description:
                "Walk the guest to their table — never point. Walk at a comfortable pace, make small talk, and pull out a chair or indicate the booth.",
              details: [
                "Carry menus in hand and place them neatly at each setting",
                "Introduce the server by name if you can",
              ],
            },
            {
              title: "Communicate with the Server",
              description:
                "Let the server know they have a new table immediately. If the server is unavailable, flag a manager or nearby teammate so the table is not left waiting.",
              details: [
                "Use the seating chart to balance sections fairly",
                "Never double-seat a server without giving them time to greet the first table",
              ],
            },
            {
              title: "Farewell the Guest",
              description:
                "When guests leave, thank them sincerely and invite them back. The last words they hear should be warm and genuine.",
              details: [
                "\"Thank you for coming to Ditch — we hope to see you again soon!\"",
                "Open the door for them if you can",
              ],
            },
          ]}
        />
      </SectionBlock>

      <SectionBlock title="Seating Guidelines">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Smart seating keeps the restaurant running smoothly. Rotate sections
          evenly so no server gets overwhelmed while others stand around.
        </p>
        <QuickRef
          type="do"
          title="Seating Best Practices"
          items={[
            "Rotate sections evenly — follow the rotation chart",
            "Seat large parties at appropriate-sized tables — don't put 2 guests at a 6-top",
            "Check with the server before double-seating their section",
            "Seat guests away from bussing stations and kitchen doors when possible",
            "Keep the waitlist organized and accurate — guests hate being skipped",
            "Communicate with the kitchen if a large party is being seated",
          ]}
        />
      </SectionBlock>

      <QuickRef
        type="dont"
        title="Host Service Turnoffs"
        items={[
          "Ignoring guests at the door while chatting with coworkers",
          "Staring at your phone or the computer instead of watching the door",
          "Giving inaccurate wait times — honesty builds trust",
          "Pointing to a table instead of walking guests there",
          "Forgetting to tell the server they have a new table",
          "Showing frustration with difficult or demanding guests",
        ]}
      />

      <KeyTakeaway
        items={[
          "Greet every guest within 15 seconds — no exceptions",
          "Walk guests to their table, never point",
          "Rotate sections evenly and communicate with servers",
          "Give honest wait times — underpromise and overdeliver",
          "The farewell matters as much as the greeting",
          "You are the first and last face of Ditch — own that responsibility",
        ]}
      />
    </div>
  );
}
