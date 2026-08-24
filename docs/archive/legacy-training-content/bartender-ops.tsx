import {
  LessonIntro,
  SectionBlock,
  StepBlock,
  ChecklistBlock,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function BartenderOpsContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Bartender Operations"
        subtitle="Run a clean, fast, and profitable bar with the Ditch standard of service."
        estimatedTime={15}
        tags={["Bar", "Required"]}
        whyItMatters="The bar is one of the highest-revenue stations in the restaurant. A great bartender drives sales, builds regulars, and keeps the energy up. Master these standards and the bar becomes your stage."
      />

      <SectionBlock title="Bartender Sequence of Service">
        <StepBlock
          steps={[
            {
              title: "Acknowledge & Greet — Within 30 Seconds",
              description:
                "Every guest who sits at the bar gets acknowledged within 30 seconds, even if you are mid-pour. A nod, a smile, or a quick \"I'll be right with you\" sets the tone.",
              details: [
                "\"Welcome to Ditch! I'm ___ — what can I get started for you?\"",
                "Place a napkin or coaster in front of the guest immediately",
                "If they need a minute, offer water while they decide",
              ],
            },
            {
              title: "Take the Order & Suggest",
              description:
                "Listen, suggest, and confirm. Lead with a specific recommendation — don't just ask \"what do you want?\"",
              details: [
                "\"Have you tried our Ditch Rita? It's our most popular margarita\"",
                "Know the full cocktail, beer, and wine menu — no hesitation",
                "Confirm the order before you start making the drink",
                "Suggest food: \"Can I get some Chips & Guac started for you?\"",
              ],
            },
            {
              title: "Make & Deliver the Drink",
              description:
                "Build drinks quickly, accurately, and with showmanship. Presentation matters — every cocktail should look as good as it tastes.",
              details: [
                "Follow the recipe card exactly — consistency is key",
                "Use a jigger for every pour — no free-pouring",
                "Garnish every drink properly per the recipe",
                "Place the drink on the napkin/coaster with the logo facing the guest",
              ],
            },
            {
              title: "Check Back & Maintain",
              description:
                "Check in after the first sip. Keep the bar clean, manage the tab, and stay engaged with every guest.",
              details: [
                "\"How does that taste? Is that what you were looking for?\"",
                "Offer a second drink when the first is one-third full",
                "Keep the bar top clean — wipe down after every guest leaves",
                "Close tabs promptly when guests are ready to leave",
              ],
            },
          ]}
        />
      </SectionBlock>

      <SectionBlock title="Bar Station Rules">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          A clean, organized bar is a fast bar. These rules keep your station
          running at peak performance all night.
        </p>
        <ChecklistBlock
          title="Station Management Standards"
          items={[
            "Keep the bar top wiped down and free of clutter at all times",
            "Use a jigger for every pour — free-pouring is not allowed",
            "Follow the recipe card for every drink — consistency over creativity",
            "Wash hands after handling cash, touching your face, or handling garbage",
            "Keep the well organized: bottles in the same spot, labels facing out",
            "Restock during slow moments — do not wait until you're out",
            "Empty garnish trays go to the back immediately — never serve old garnishes",
            "Clean as you go: rinse shakers, wipe spills, clear empty glasses",
            "Keep the speed rail organized and the ice bin full",
            "Run service bar tickets promptly — servers are waiting on those drinks",
          ]}
          style="check"
        />
      </SectionBlock>

      <CalloutBlock type="standard" title="Service Bar Priorities">
        <p>
          Service bar tickets are just as important as your bar guests. When a
          ticket comes in, make the drinks promptly and call for a runner or
          notify the server. Delays at the service bar create delays on the
          floor — and frustrated servers mean frustrated guests.
        </p>
      </CalloutBlock>

      <CalloutBlock type="important" title="Pour Accuracy">
        <p>
          Use a jigger on every single pour. Free-pouring leads to inconsistent
          drinks, higher liquor costs, and over-serving. The jigger is not a
          suggestion — it is a requirement. Consistency is what brings guests
          back for the same drink again and again.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Acknowledge every bar guest within 30 seconds",
          "Lead with specific drink suggestions — know the menu cold",
          "Use a jigger on every pour — no free-pouring, no exceptions",
          "Follow the recipe card for every cocktail — consistency wins",
          "Keep the bar clean, organized, and stocked throughout the shift",
          "Service bar tickets are a priority — don't let them pile up",
          "The bar is your stage — bring energy, personality, and professionalism",
        ]}
      />
    </div>
  );
}
