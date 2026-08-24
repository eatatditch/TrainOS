"use client";

import {
  LessonIntro,
  SectionBlock,
  CalloutBlock,
  StepBlock,
  CardGrid,
  KnowledgeCard,
  ChecklistBlock,
  QuickRef,
  AccordionBlock,
  KeyTakeaway,
} from "../blocks";

export function SafetyFoodContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Food Safety Fundamentals"
        subtitle="Protect our guests and your team by understanding the principles of safe food handling."
        estimatedTime={15}
        tags={["Safety", "Required"]}
        whyItMatters="Foodborne illness can hospitalize guests, shut down the restaurant, and end careers. Every team member is responsible for food safety — no exceptions."
      />

      <SectionBlock title="The 3 Types of Food Hazards">
        <CardGrid columns={3}>
          <KnowledgeCard
            title="Biological"
            badge="Most Common"
            description="Bacteria, viruses, parasites, and fungi that contaminate food. These are the leading cause of foodborne illness."
            details={[
              "Salmonella, E. coli, Norovirus, Listeria",
              "Prevented by proper cooking temps, handwashing, and storage",
            ]}
            highlight
          />
          <KnowledgeCard
            title="Chemical"
            badge="Dangerous"
            description="Cleaning products, sanitizers, pesticides, or other chemicals that contaminate food through improper storage or use."
            details={[
              "Never store chemicals near or above food",
              "Always label spray bottles and chemical containers",
            ]}
          />
          <KnowledgeCard
            title="Physical"
            badge="Foreign Objects"
            description="Hair, glass, metal, plastic, bandages, or any foreign object that ends up in food."
            details={[
              "Wear hair nets and beard guards in the kitchen",
              "Use blue bandages so they are visible if they fall off",
            ]}
          />
        </CardGrid>
      </SectionBlock>

      <CalloutBlock type="warning" title="The Danger Zone: 41F - 141F">
        <p>
          Bacteria multiply rapidly between 41 and 141 degrees Fahrenheit. Food
          must not remain in this temperature range for more than 4 hours total.
          Keep cold food below 41F and hot food above 141F at all times.
        </p>
      </CalloutBlock>

      <SectionBlock title="Proper Handwashing — The 6 Steps">
        <StepBlock
          steps={[
            {
              title: "Wet Hands",
              description: "Use warm running water (at least 100F) to wet your hands and forearms.",
            },
            {
              title: "Apply Soap",
              description: "Apply enough soap to create a good lather covering hands and forearms.",
            },
            {
              title: "Scrub for 20 Seconds",
              description: "Scrub hands, between fingers, under nails, and forearms for at least 20 seconds.",
              details: ["Sing \"Happy Birthday\" twice for the right timing"],
            },
            {
              title: "Rinse Thoroughly",
              description: "Rinse all soap from hands and forearms under warm running water.",
            },
            {
              title: "Dry with Paper Towel",
              description: "Dry hands with a single-use paper towel. Never use an apron or shared cloth towel.",
            },
            {
              title: "Use Paper Towel to Turn Off Faucet",
              description: "Use the paper towel to turn off the faucet and open the door so you don't recontaminate your hands.",
            },
          ]}
        />
      </SectionBlock>

      <SectionBlock title="When to Wash Your Hands">
        <ChecklistBlock
          title="Wash Your Hands Every Time You..."
          items={[
            "Arrive at work and before starting any food prep",
            "Switch between raw and ready-to-eat foods",
            "Touch your face, hair, or body",
            "Use the restroom",
            "Handle trash, chemicals, or dirty dishes",
            "Sneeze, cough, or blow your nose",
            "Handle raw meat, poultry, or seafood",
            "Eat, drink, or smoke during a break",
            "Touch your phone or any personal items",
          ]}
          style="check"
        />
      </SectionBlock>

      <SectionBlock title="The 4 Causes of Unsafe Food">
        <AccordionBlock
          items={[
            {
              title: "1. Time-Temperature Abuse",
              content: (
                <div>
                  <p className="mb-2">
                    Food left in the danger zone (41-141F) for too long. This is
                    the most common cause of foodborne illness in restaurants.
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>- Never leave food sitting out at room temperature</li>
                    <li>- Use thermometers to verify cooking and holding temps</li>
                    <li>- Cool hot food quickly: 135F to 70F within 2 hours, then 70F to 41F within 4 hours</li>
                  </ul>
                </div>
              ),
            },
            {
              title: "2. Cross-Contamination",
              content: (
                <div>
                  <p className="mb-2">
                    Transfer of harmful bacteria from one food (usually raw) to
                    another through direct contact, shared surfaces, or dirty hands.
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>- Use separate cutting boards for raw meat and ready-to-eat foods</li>
                    <li>- Store raw proteins below ready-to-eat foods in the walk-in</li>
                    <li>- Change gloves between tasks and between handling different proteins</li>
                  </ul>
                </div>
              ),
            },
            {
              title: "3. Poor Personal Hygiene",
              content: (
                <div>
                  <p className="mb-2">
                    Employees who do not wash hands properly, work while sick, or
                    fail to follow hygiene standards put every guest at risk.
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>- Wash hands using the 6-step method every time required</li>
                    <li>- Do not work if you have vomiting, diarrhea, or jaundice</li>
                    <li>- Wear clean uniforms and keep nails short and clean</li>
                  </ul>
                </div>
              ),
            },
            {
              title: "4. Contaminated Equipment & Surfaces",
              content: (
                <div>
                  <p className="mb-2">
                    Dirty equipment, cutting boards, counters, and utensils spread
                    bacteria to food. Clean and sanitize are two different steps.
                  </p>
                  <ul className="space-y-1 text-sm">
                    <li>- Clean first (remove visible dirt), then sanitize (kill bacteria)</li>
                    <li>- Sanitize prep surfaces every 4 hours during continuous use</li>
                    <li>- Test sanitizer concentration with test strips regularly</li>
                  </ul>
                </div>
              ),
            },
          ]}
          defaultOpen={0}
        />
      </SectionBlock>

      <QuickRef
        type="remember"
        title="Critical Food Safety Rules"
        items={[
          "The danger zone is 41F to 141F — keep food out of this range",
          "Wash hands for 20 seconds minimum, every time",
          "When in doubt, throw it out — never serve questionable food",
          "Report illness to your manager before starting your shift",
          "Clean and sanitize are two separate steps — you need both",
        ]}
      />

      <KeyTakeaway
        items={[
          "Three hazard types: biological, chemical, physical",
          "The danger zone is 41-141F — food cannot stay in this range for more than 4 hours",
          "Follow the 6-step handwashing procedure every time",
          "The 4 causes of unsafe food: time-temp abuse, cross-contamination, poor hygiene, dirty equipment",
          "When in doubt, throw it out — never risk a guest's health",
        ]}
      />
    </div>
  );
}
