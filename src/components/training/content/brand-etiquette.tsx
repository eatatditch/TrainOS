import {
  LessonIntro,
  SectionBlock,
  ComparisonTable,
  QuickRef,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function BrandEtiquetteContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Brand Etiquette & Language"
        subtitle="The words you use shape the guest experience. Learn the Ditch way of communicating."
        estimatedTime={10}
        tags={["Brand", "Required"]}
        whyItMatters="One wrong phrase can undo an entire great experience. The right words build trust, loyalty, and bigger tips."
      />

      <SectionBlock title="Forbidden Phrases" subtitle="Never say these to a guest — use the Ditch alternative instead.">
        <ComparisonTable
          headers={["Never Say", "Say Instead"]}
          rows={[
            ["\"No problem\"", "\"My pleasure\" or \"Absolutely\""],
            ["\"I don't know\"", "\"Great question — let me find out for you\""],
            ["\"That's not my table\"", "\"Let me grab your server\" or just help them"],
            ["\"We can't do that\"", "\"Here's what I can do for you\""],
            ["\"Are you still working on that?\"", "\"How is everything tasting?\""],
            ["\"Do you want change?\"", "Always bring the change back automatically"],
            ["\"No\"", "Find a way to say yes or offer an alternative"],
            ["\"You guys\"", "\"Folks\", \"everyone\", or \"you all\""],
          ]}
        />
      </SectionBlock>

      <SectionBlock title="Service Turnoffs" subtitle="Habits that kill the guest experience.">
        <QuickRef
          type="dont"
          title="Service Turnoffs"
          items={[
            "Leaning on walls, counters, or POS stations",
            "Being on your phone anywhere a guest can see you",
            "Clustering with other staff and ignoring the floor",
            "Chewing gum or eating in view of guests",
            "Eye-rolling, sighing, or showing frustration",
            "Pointing instead of walking the guest to where they need to go",
            "Ignoring a guest because they're not in your section",
          ]}
        />
      </SectionBlock>

      <SectionBlock title="Etiquette Standards">
        <QuickRef
          type="do"
          title="The Ditch Way"
          items={[
            "Make eye contact and smile when speaking with guests",
            "Use the guest's name if you know it",
            "Serve and clear from the right, beverages from the left",
            "Ladies first when serving the table",
            "Crouch to eye level when speaking with a seated guest",
            "Say \"behind\" and \"corner\" when moving through the restaurant",
            "Two hands on every plate — never carry with your thumb on the food",
            "Always walk a guest to the restroom or bar, never point",
          ]}
        />
      </SectionBlock>

      <CalloutBlock type="tip" title="Pro Tip: The 15/5 Rule">
        <p>
          At 15 feet, make eye contact and smile. At 5 feet, verbally greet the
          guest. This simple habit makes every guest feel acknowledged before
          they even sit down.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Words matter — use Ditch-approved language at all times",
          "Avoid the forbidden phrases; they undermine the guest experience",
          "The 15/5 Rule: eye contact at 15 feet, verbal greeting at 5 feet",
          "When in doubt, find a way to say yes",
        ]}
      />
    </div>
  );
}
