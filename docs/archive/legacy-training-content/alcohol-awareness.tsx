import {
  LessonIntro,
  SectionBlock,
  CalloutBlock,
  ChecklistBlock,
  StepBlock,
  QuickRef,
  KeyTakeaway,
} from "../blocks";

export function AlcoholAwarenessContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Alcohol Awareness & Responsible Service"
        subtitle="Serve responsibly, protect our guests, and protect yourself from legal liability."
        estimatedTime={15}
        tags={["Safety", "Required"]}
        whyItMatters="Serving alcohol irresponsibly can lead to DUIs, injuries, lawsuits, loss of our liquor license, and criminal charges against you personally. This is not optional training."
      />

      <CalloutBlock type="warning" title="Legal Consequences">
        <p>
          Serving alcohol to a minor or an intoxicated person is a criminal
          offense. You, personally, can be fined, arrested, and held liable for
          any harm caused. The restaurant can lose its liquor license and face
          lawsuits. Take this seriously — your name is on every drink you serve.
        </p>
      </CalloutBlock>

      <SectionBlock title="Checking IDs">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Card every guest who appears to be under 30 years old. When in doubt,
          card. A guest will never be offended by being asked for ID — but the
          consequences of not asking are severe.
        </p>
        <ChecklistBlock
          title="5 Accepted Forms of ID"
          items={[
            "Valid state-issued driver's license",
            "Valid state-issued identification card",
            "Valid U.S. passport or passport card",
            "Valid U.S. military ID",
            "Valid foreign passport with photo",
          ]}
          style="check"
        />
        <CalloutBlock type="important" title="ID Verification">
          <p>
            Check the photo, the birth date, and the expiration date on every
            ID. If the ID is expired, you cannot accept it. If the photo does
            not match the person, do not serve them. If you suspect a fake ID,
            get a manager immediately — do not confront the guest yourself.
          </p>
        </CalloutBlock>
      </SectionBlock>

      <SectionBlock title="Signs of Intoxication">
        <ChecklistBlock
          title="Watch for These 6 Warning Signs"
          items={[
            "Slurred or loud speech",
            "Glassy, bloodshot, or unfocused eyes",
            "Impaired coordination — stumbling, swaying, or difficulty walking",
            "Aggressive, argumentative, or overly emotional behavior",
            "Ordering drinks rapidly or drinking very quickly",
            "Loss of inhibition — inappropriate comments or behavior",
          ]}
          style="check"
        />
      </SectionBlock>

      <SectionBlock title="How to Cut a Guest Off — 6 Steps">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Cutting someone off is never easy, but it is your legal and moral
          responsibility. Stay calm, be firm, and be compassionate. Use this
          6-step process:
        </p>
        <StepBlock
          steps={[
            {
              title: "Stop Serving Alcohol",
              description:
                "Do not serve another alcoholic beverage. Switch to water or a non-alcoholic option without making a scene.",
            },
            {
              title: "Notify Your Manager",
              description:
                "Inform your manager immediately. They will come to the table and support you. Never handle a cutoff alone.",
            },
            {
              title: "Be Polite but Firm",
              description:
                "Speak to the guest privately if possible. Use calm, non-confrontational language.",
              details: [
                "\"I want to make sure you get home safely tonight — I'm going to switch you to water\"",
                "\"I care about your safety, and I can't serve any more alcohol right now\"",
              ],
            },
            {
              title: "Offer Food and Water",
              description:
                "Suggest food and plenty of water to help the guest sober up before leaving.",
            },
            {
              title: "Arrange Safe Transportation",
              description:
                "Offer to call a cab, Uber, or Lyft. Never let an intoxicated guest drive. If they insist on driving, call 911.",
              details: [
                "\"Can I call you a ride? We want to make sure you get home safe\"",
              ],
            },
            {
              title: "Document the Incident",
              description:
                "Write down what happened: the time, what was consumed, what you observed, and what actions were taken. Give this to your manager.",
            },
          ]}
        />
      </SectionBlock>

      <CalloutBlock type="important" title="Personal Liability">
        <p>
          Under dram shop laws, you can be held personally liable for injuries
          or damages caused by an intoxicated guest you served. This includes
          DUI accidents, assaults, and other incidents that occur after the
          guest leaves. Responsible service protects everyone — including you.
        </p>
      </CalloutBlock>

      <QuickRef
        type="escalate"
        title="When to Get a Manager Immediately"
        items={[
          "A guest shows clear signs of intoxication",
          "You suspect a fake or invalid ID",
          "A guest becomes aggressive when you stop serving",
          "An underage person is attempting to order alcohol",
          "A guest insists on driving while intoxicated",
          "Any situation where you feel unsafe or unsure",
        ]}
      />

      <KeyTakeaway
        items={[
          "Card every guest who appears under 30 — no exceptions",
          "Only 5 forms of ID are accepted — expired IDs are not valid",
          "Know the 6 signs of intoxication and watch for them constantly",
          "Follow the 6-step cutoff procedure — never handle it alone",
          "You are personally liable for every drink you serve",
          "When in doubt, get a manager — this is never optional",
        ]}
      />
    </div>
  );
}
