"use client";

import {
  LessonIntro,
  SectionBlock,
  TabBlock,
  StepBlock,
  ChecklistBlock,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function SupportBusserBarbackContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Busser & Barback"
        subtitle="Keep the restaurant running at full speed — clean tables, stocked bars, and seamless support."
        estimatedTime={12}
        tags={["Support", "Required"]}
        whyItMatters="Bussers and barbacks are the engine behind every great shift. Without you, servers get overwhelmed, bartenders run out of supplies, and guests wait too long for a clean table."
      />

      <SectionBlock title="Roles & Responsibilities">
        <TabBlock
          tabs={[
            {
              label: "Busser",
              content: (
                <div className="space-y-4">
                  <SectionBlock title="The 6-Step Table Reset">
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      Speed and thoroughness are equally important. A table
                      should be fully reset and guest-ready within 3 minutes of
                      the party leaving.
                    </p>
                    <StepBlock
                      steps={[
                        {
                          title: "Clear the Table",
                          description:
                            "Remove all plates, glasses, silverware, trash, and debris. Use a bus tub — do not carry armfuls of dishes across the dining room.",
                        },
                        {
                          title: "Wipe Down the Table",
                          description:
                            "Use a clean, damp cloth with sanitizer to wipe the entire surface of the table, including edges and undersides where guests touch.",
                        },
                        {
                          title: "Wipe Down the Seats",
                          description:
                            "Check and wipe all chairs or booth seats. Remove crumbs, spills, and any debris. Check the floor under the table.",
                        },
                        {
                          title: "Reset the Table Setting",
                          description:
                            "Place clean silverware, napkins, and any table-top items (salt, pepper, candle, table number) back in their proper position.",
                        },
                        {
                          title: "Check the Floor",
                          description:
                            "Sweep or spot-clean the floor under and around the table. Pick up any fallen food, napkins, or debris.",
                        },
                        {
                          title: "Signal the Host",
                          description:
                            "Let the host know the table is clean and ready to seat. A fast reset means faster turns and more revenue.",
                        },
                      ]}
                    />
                  </SectionBlock>

                  <SectionBlock title="Additional Busser Duties">
                    <ChecklistBlock
                      items={[
                        "Pre-bus tables during service — clear finished plates and empty glasses",
                        "Refill water glasses throughout the dining room without being asked",
                        "Keep the server station stocked with clean plates, glasses, and silverware",
                        "Empty bus tubs regularly — never let them overflow",
                        "Assist food runners when needed — deliver bread, condiments, or refills",
                        "Monitor restrooms for cleanliness and supplies every 30 minutes",
                      ]}
                      style="check"
                    />
                  </SectionBlock>
                </div>
              ),
            },
            {
              label: "Barback",
              content: (
                <div className="space-y-4">
                  <SectionBlock title="Barback Responsibilities">
                    <p className="text-gray-700 text-sm leading-relaxed mb-4">
                      The barback keeps the bartender stocked and the bar area
                      clean so the bartender can focus on making drinks and
                      serving guests. Anticipate needs before the bartender has
                      to ask.
                    </p>
                    <ChecklistBlock
                      title="Core Barback Duties"
                      items={[
                        "Keep ice bins full at all times — check every 15-20 minutes",
                        "Restock liquor, beer, and wine as bottles empty — know par levels",
                        "Wash and restock glassware continuously — the bar should never run out of clean glasses",
                        "Cut and prep garnishes: limes, lemons, oranges, jalape\u00f1os, mint, and other cocktail garnishes",
                        "Restock juices, mixers, syrups, and sodas before they run out",
                        "Empty trash and recycling behind the bar regularly",
                        "Keep the bar top, well, and floor clean throughout the shift",
                        "Run drinks to tables when the bartender is backed up",
                        "Stock and clean the beer cooler and wine storage",
                        "Break down and deep-clean the bar at close",
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

      <CalloutBlock type="warning" title="Ice Scoop Protocol">
        <p>
          NEVER use a glass to scoop ice. If a glass breaks in the ice bin, the
          entire bin must be emptied, cleaned, and refilled. Always use the
          designated plastic or metal ice scoop. Store the scoop outside the ice
          bin on a clean surface — never leave it buried in the ice.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Bussers: reset tables within 3 minutes — clear, wipe, reset, sweep, signal",
          "Barbacks: anticipate needs — restock before the bartender asks",
          "Never use a glass to scoop ice — always use the designated scoop",
          "Pre-bus tables during service to keep the dining room clean",
          "Full hands in, full hands out — every single trip",
          "Your hustle directly impacts table turns, bar speed, and team success",
        ]}
      />
    </div>
  );
}
