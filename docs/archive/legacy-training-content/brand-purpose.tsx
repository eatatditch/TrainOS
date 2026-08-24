import {
  LessonIntro,
  SectionBlock,
  CalloutBlock,
  ChecklistBlock,
  QuickRef,
  KeyTakeaway,
} from "../blocks";

export function BrandPurposeContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Core Values & Brand Purpose"
        subtitle="This is what Ditch is. This is what you represent every time you step on the floor."
        estimatedTime={10}
        tags={["All Roles", "Required", "Day 1"]}
        whyItMatters="Our purpose doesn't change with size, location, or trends. Know it. Live it."
      />

      <SectionBlock title="Brand Purpose — 100-Year Thinking">
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          Ditch exists to create places people feel connected to — to the food, the people they're with, and the moment they're in.
        </p>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          We believe restaurants should be more than transactions. They should be gathering points that bring joy, spark conversation, and leave people feeling better than when they arrived.
        </p>
        <p className="text-gray-700 text-sm leading-relaxed mb-3">
          As we grow, we are committed to protecting what makes Ditch Ditch — the experience, the energy, the care — ensuring our brand is never diluted in the pursuit of scale, efficiency, or profit.
        </p>
        <CalloutBlock type="important" title="The Mission">
          <p><strong>Growth is the outcome. The experience is the mission.</strong></p>
          <p className="text-sm mt-1 opacity-80">This purpose does not change with size, location, or trends.</p>
        </CalloutBlock>
      </SectionBlock>

      <SectionBlock title="The 7 Core Values — Forever, Non-Negotiable">
        <div className="space-y-4">
          <div className="p-4 bg-white rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-1">1. The Experience Is Sacred</h4>
            <p className="text-sm text-gray-600">Everything starts with how it feels to be here — for guests and for our team. If something improves margins but weakens the experience, it's the wrong move.</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-1">2. We Build With Intention</h4>
            <p className="text-sm text-gray-600">Nothing is accidental — food, design, music, service, culture. We sweat details because details compound into something unforgettable.</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-1">3. People Over Shortcuts</h4>
            <p className="text-sm text-gray-600">We choose long-term trust over short-term wins — with guests, staff, partners, and our communities.</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-1">4. Standards Create Freedom</h4>
            <p className="text-sm text-gray-600">High standards aren't restrictive — they're what allow us to scale without losing ourselves. Discipline, consistency, and accountability preserve creativity and soul.</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-1">5. Energy Is Contagious</h4>
            <p className="text-sm text-gray-600">We bring it. We protect it. <strong>We don't tolerate energy vampires.</strong> The room reflects the people running it.</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-1">6. Earned, Not Given</h4>
            <p className="text-sm text-gray-600">Respect, growth, leadership, and opportunity are built through effort and ownership. We reward those who show up, step up, and care deeply.</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-1">7. Growth Without Erosion</h4>
            <p className="text-sm text-gray-600">We will scale — but never at the cost of our identity. Expansion only happens if the experience can travel with us.</p>
          </div>
        </div>
      </SectionBlock>

      <SectionBlock title="Internal Culture">
        <ChecklistBlock
          items={[
            "We coach, not just manage.",
            "We hold standards without ego.",
            "We praise publicly and correct privately.",
            "We act like owners, not renters.",
            "We take pride in being underestimated.",
          ]}
          style="check"
        />
      </SectionBlock>

      <CalloutBlock type="standard" title="External Brand Promise">
        <p>When someone walks into Ditch — anywhere — they should feel <strong>welcomed, energized, relaxed, and confident they found their spot.</strong></p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Growth is the outcome — the experience is the mission",
          "The 7 core values are forever and non-negotiable",
          "We don't tolerate energy vampires — protect the room",
          "We act like owners, not renters",
          "Expansion only happens if the experience can travel with us",
          "Every guest should feel welcomed, energized, relaxed, and confident",
        ]}
      />
    </div>
  );
}
