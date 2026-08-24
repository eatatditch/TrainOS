"use client";

import {
  LessonIntro,
  SectionBlock,
  TabBlock,
  ChecklistBlock,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function SupportRunnerExpoContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Food Runner & Expo"
        subtitle="Get the right food to the right guest at the right time — hot, accurate, and beautiful."
        estimatedTime={12}
        tags={["Support", "Required"]}
        whyItMatters="The food runner and expo are the bridge between the kitchen and the guest. If this link breaks, the entire dining experience suffers — no matter how good the food or the server."
      />

      <SectionBlock title="Roles & Responsibilities">
        <TabBlock
          tabs={[
            {
              label: "Food Runner",
              content: (
                <div className="space-y-4">
                  <SectionBlock title="What a Food Runner Does">
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      The food runner delivers food from the kitchen window to
                      the guest's table. Speed, accuracy, and professionalism
                      are everything. You are the last person to touch the food
                      before the guest sees it.
                    </p>
                    <ChecklistBlock
                      title="Food Runner Responsibilities"
                      items={[
                        "Deliver food to the correct table and correct seat — no auctioning",
                        "Use pivot points and seat numbers on every ticket",
                        "Carry plates safely — two hands, thumb off the food",
                        "Announce each dish as you place it: \"Here's your Baja Fish Tacos\"",
                        "Check that all items for the table are complete before walking away",
                        "Ask if the guest needs anything else: refills, condiments, extra napkins",
                        "Communicate with the server about the table's status",
                      ]}
                      style="check"
                    />
                  </SectionBlock>
                </div>
              ),
            },
            {
              label: "Expo",
              content: (
                <div className="space-y-4">
                  <SectionBlock title="What an Expo Does">
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      The expo is the quality control checkpoint between the
                      kitchen and the dining room. Every plate passes through
                      your hands. You verify accuracy, presentation, and
                      completeness before it leaves the window.
                    </p>
                    <ChecklistBlock
                      title="Expo Responsibilities"
                      items={[
                        "Read tickets carefully — match every plate to the order",
                        "Verify plate presentation matches Ditch standards",
                        "Check for correct garnishes, sauces, and sides",
                        "Ensure plates are clean — wipe rims, remove splashes",
                        "Coordinate timing so all dishes for a table come out together",
                        "Communicate with the kitchen about timing, refires, and modifications",
                        "Call out table numbers for runners to deliver",
                        "Track open tickets and flag delays before they become problems",
                      ]}
                      style="check"
                    />
                  </SectionBlock>
                </div>
              ),
            },
          ]}
        />
      </SectionBlock>

      <SectionBlock title="The 4 Golden Rules">
        <ChecklistBlock
          items={[
            "Right food, right guest, right time — verify before you deliver",
            "Hot food hot, cold food cold — urgency matters in the window",
            "Never auction food — if you don't know the seat, ask the expo or check the ticket",
            "Full hands in, full hands out — bring dirty plates back every trip",
          ]}
          style="number"
        />
      </SectionBlock>

      <SectionBlock title="Quality Check Before Delivery">
        <ChecklistBlock
          title="5-Point Quality Check"
          items={[
            "Correct dish for the correct seat number on the ticket",
            "All modifications and allergy notes are followed",
            "Presentation is clean — no drips, smudges, or missing garnishes",
            "Temperature is correct — hot plates should be hot to the touch",
            "All items for the table are ready to go out together",
          ]}
          style="check"
        />
      </SectionBlock>

      <CalloutBlock type="standard" title="Timing & Staging">
        <p>
          Food dies in the window. Hot food should be delivered within 30
          seconds of hitting the pass. If a plate is sitting, call for a runner
          immediately. Coordinate with the kitchen to stagger courses and
          deliver apps before entrees. Timing is what separates a good meal
          from a great one.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "The expo is the last line of quality control — nothing leaves without approval",
          "Food runners deliver with accuracy and speed — no auctioning, ever",
          "Follow the 4 golden rules on every single delivery",
          "Run the 5-point quality check before every plate leaves the window",
          "Hot food dies in the window — deliver within 30 seconds of hitting the pass",
          "Full hands in, full hands out — every trip",
        ]}
      />
    </div>
  );
}
