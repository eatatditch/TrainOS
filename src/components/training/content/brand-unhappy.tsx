import {
  LessonIntro,
  SectionBlock,
  StepBlock,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function BrandUnhappyContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Handling Unhappy Guests"
        subtitle="Turn negative experiences into loyal guests with the 4-step recovery process."
        estimatedTime={10}
        tags={["Brand", "Required"]}
        whyItMatters="A dissatisfied guest tells an average of 11 people about a bad experience. A recovered guest becomes more loyal than one who never had a problem."
      />

      <SectionBlock title="Why Recovery Matters">
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Mistakes happen. Food gets delayed, orders get mixed up, drinks get
          forgotten. What separates great restaurants from average ones is not
          perfection — it is recovery. Studies show that a guest whose problem is
          resolved quickly and genuinely is more likely to return than a guest who
          never had a problem at all.
        </p>
        <CalloutBlock type="important" title="The 11-Person Rule">
          <p>
            A dissatisfied guest tells an average of 11 people about their bad
            experience. That means one unrecovered complaint can cost you dozens
            of future guests. Recovery is not optional — it is essential.
          </p>
        </CalloutBlock>
      </SectionBlock>

      <SectionBlock title="The 4-Step Recovery Process">
        <StepBlock
          steps={[
            {
              title: "Listen",
              description:
                "Give the guest your full, undivided attention. Do not interrupt, do not get defensive, and do not make excuses. Let them finish completely before you respond.",
              details: [
                "Make eye contact and nod to show you're engaged",
                "Put down whatever you're doing — they need your full focus",
                "Never say \"but\" or try to explain why it happened",
                "Repeat back what you heard so they know you understand",
              ],
            },
            {
              title: "Apologize",
              description:
                "Offer a sincere, specific apology. Don't use generic phrases. Acknowledge what went wrong and take responsibility.",
              details: [
                "\"I'm so sorry your steak came out overcooked — that's not our standard\"",
                "\"I apologize for the wait — you deserved better\"",
                "Never blame the kitchen, bar, or another team member",
                "Own it as a team, even if it wasn't your fault",
              ],
            },
            {
              title: "Fix It",
              description:
                "Take immediate action to resolve the problem. If you can fix it, do it now. If you need a manager, get one immediately.",
              details: [
                "Refire the item on the fly — don't make them wait again",
                "Offer an alternative if the same item can't be remade quickly",
                "Get a manager involved for comps, discounts, or larger issues",
                "Speed matters — the longer they wait, the angrier they get",
              ],
            },
            {
              title: "Follow Up",
              description:
                "Check back within 2 minutes to make sure the fix worked. Thank them for their patience and make sure they leave happy.",
              details: [
                "\"How is the new dish? Is that more what you were looking for?\"",
                "Thank them sincerely for giving you the chance to make it right",
                "A manager visit to the table shows the guest they matter",
                "End on a positive note — they should leave feeling good about Ditch",
              ],
            },
          ]}
        />
      </SectionBlock>

      <CalloutBlock type="important" title="When to Escalate to a Manager">
        <p>
          Get a manager immediately if a guest raises their voice, requests a
          manager, has an allergy concern, mentions calling corporate, or if the
          problem involves a safety issue. Never try to handle an escalated
          situation alone.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Follow the 4 steps in order: Listen, Apologize, Fix, Follow Up",
          "A recovered guest becomes more loyal than one who never had an issue",
          "Never blame a teammate — own the problem as a team",
          "Speed is everything — fix it now, not later",
          "Escalate to a manager when the situation is beyond your control",
        ]}
      />
    </div>
  );
}
