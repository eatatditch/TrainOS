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
        title="Brand Purpose & Culture"
        subtitle="Understand what makes Ditch different and why our culture drives everything we do."
        estimatedTime={10}
        tags={["Brand", "Required"]}
        whyItMatters="Every guest interaction is a chance to prove that Ditch isn't just another restaurant. Our culture is the product."
      />

      <SectionBlock title="Our Purpose">
        <p className="text-gray-700 text-sm leading-relaxed">
          Ditch exists to create unforgettable experiences rooted in bold flavors,
          genuine hospitality, and a culture that puts people first. We are not just
          serving tacos — we are building community, one guest at a time.
        </p>
      </SectionBlock>

      <SectionBlock title="The 7 Core Values">
        <ChecklistBlock
          items={[
            "Passion — Love what you do and bring energy every shift",
            "Integrity — Do the right thing, even when nobody is watching",
            "Teamwork — We win together, we lose together",
            "Hospitality — Make every guest feel like a VIP",
            "Accountability — Own your mistakes and learn from them",
            "Quality — Never serve anything you wouldn't eat yourself",
            "Fun — If we're not having fun, we're doing it wrong",
          ]}
          style="check"
        />
      </SectionBlock>

      <CalloutBlock type="standard" title="The Ditch Standard">
        <p>
          Our core values are not suggestions — they are the standard. Every team
          member is expected to live these values on every shift, in every
          interaction, every single day.
        </p>
      </CalloutBlock>

      <SectionBlock title="Culture in Action">
        <QuickRef
          type="do"
          title="What Our Culture Looks Like"
          items={[
            "Greeting every guest with genuine warmth within 30 seconds",
            "Helping a teammate even when it's not your section",
            "Taking pride in a perfectly plated dish",
            "Owning a mistake and fixing it immediately",
            "Celebrating each other's wins, big and small",
            "Keeping your station spotless because you care, not because you're told",
          ]}
        />
      </SectionBlock>

      <SectionBlock title="Why Culture Matters">
        <p className="text-gray-700 text-sm leading-relaxed mb-4">
          Guests can get tacos anywhere. They come back to Ditch because of how we
          make them feel. Culture is not a poster on the wall — it is the energy in
          the room, the smile on your face, and the pride in every plate that leaves
          the kitchen.
        </p>
        <p className="text-gray-700 text-sm leading-relaxed">
          When our culture is strong, everything else follows: better tips, happier
          guests, lower turnover, and a workplace you actually want to show up to.
        </p>
      </SectionBlock>

      <KeyTakeaway
        items={[
          "Ditch's culture is our competitive advantage — protect it fiercely",
          "Live the 7 core values every shift, not just when management is watching",
          "Every guest interaction is a chance to prove what Ditch is about",
          "Culture drives guest loyalty, team retention, and your income",
        ]}
      />
    </div>
  );
}
