import {
  LessonIntro,
  SectionBlock,
  StepBlock,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function ServerSOSContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Server Steps of Service"
        subtitle="The 8-step framework that drives every guest interaction from greeting to goodbye."
        estimatedTime={20}
        tags={["Server", "Required"]}
        whyItMatters="Consistency is what separates good restaurants from great ones. These 8 steps ensure every guest gets a flawless experience every single time."
      />

      <CalloutBlock type="standard" title="Timing Is Everything">
        <p>
          Every step has a time standard. These are not guidelines — they are
          expectations. Guests notice when you are fast, and they definitely
          notice when you are slow.
        </p>
      </CalloutBlock>

      <SectionBlock title="The 8 Steps of Service">
        <StepBlock
          steps={[
            {
              title: "Greet the Table — Within 1 Minute",
              description:
                "Approach with energy and a genuine smile. Introduce yourself by name and set the tone for the entire experience. The first 60 seconds determine how the guest feels about you.",
              details: [
                "Make eye contact and smile before you speak",
                "\"Welcome to Ditch! My name is ___ and I'll be taking care of you today\"",
                "Offer water immediately — don't wait to be asked",
                "Read the table: are they in a rush, celebrating, or just hanging out?",
              ],
            },
            {
              title: "Beverage Order — Within 2 Minutes",
              description:
                "Suggest a specific drink before defaulting to \"what can I get you?\" This is your first opportunity to drive sales and show product knowledge.",
              details: [
                "\"Can I start you with one of our Specialty Margaritas? The Ditch Rita is our most popular\"",
                "Know the cocktail menu cold — guests trust confident recommendations",
                "If they order water, offer sparkling or a zero-proof cocktail",
                "Ring in beverages immediately — do not wait for the food order",
              ],
            },
            {
              title: "Deliver Beverages & Take Food Order — Within 3 Minutes",
              description:
                "Deliver drinks and take the food order in one trip whenever possible. Suggest Chips & Guac or a starter while they decide.",
              details: [
                "\"While you're looking, can I get some Chips & Guac started for the table?\"",
                "Use suggestive selling: be specific, be enthusiastic, be helpful",
                "Note any allergies or dietary restrictions and repeat them back",
                "Serve beverages from the left side of the guest",
              ],
            },
            {
              title: "Starter/Appetizer Course — 3-7 Minutes After Order",
              description:
                "Starters should hit the table quickly. Check back after the first few bites to make sure everything is on point.",
              details: [
                "If a starter is taking too long, check with the kitchen proactively",
                "Pre-bus as you go — remove menus, napkin wraps, empty glasses",
                "Two-bite check: come back after the guest has had two bites",
                "\"How is everything tasting so far?\"",
              ],
            },
            {
              title: "Entree Delivery — 10-15 Minutes After Order",
              description:
                "Deliver entrees to the correct guest without auctioning food. Know your seat numbers and place every plate with confidence.",
              details: [
                "Never auction food — \"Who had the fish tacos?\" is unacceptable",
                "Use pivot points and seat numbers to deliver without asking",
                "Serve from the right, ladies first",
                "Ensure all condiments, silverware, and extras are on the table before you walk away",
              ],
            },
            {
              title: "Two-Minute Check Back",
              description:
                "Return within 2 minutes of entree delivery to confirm everything is correct. This is your last chance to catch a problem before it becomes a complaint.",
              details: [
                "\"How is everything? Is the steak cooked the way you like it?\"",
                "Check drinks — offer a refill or a second round",
                "Look at the table: do they need anything you haven't asked about?",
                "If something is wrong, fix it immediately — don't wait",
              ],
            },
            {
              title: "Table Maintenance & Dessert Offer",
              description:
                "Keep the table clean and the experience flowing. Clear finished plates, refill drinks, and suggest dessert when the timing is right.",
              details: [
                "Pre-bus throughout the meal — never let plates stack up",
                "Offer dessert with enthusiasm: \"You have to try our Churros — they're incredible\"",
                "Suggest after-dinner drinks or coffee",
                "Read the table: if they're lingering, let them enjoy; if they're ready, move to checkout",
              ],
            },
            {
              title: "Present Check & Close Out — Within 2 Minutes of Request",
              description:
                "When the guest is ready, present the check promptly. Process payment quickly and thank them sincerely.",
              details: [
                "Never rush the check — but when they ask, be fast",
                "Present the check in a clean holder with a pen",
                "Process payment within 2 minutes of receiving it",
                "\"Thank you so much for coming in! We hope to see you again soon\"",
                "Pre-bus the table before leaving — set it up for the next guest",
              ],
            },
          ]}
        />
      </SectionBlock>

      <CalloutBlock type="important" title="The Golden Rule of Timing">
        <p>
          If you are ever unsure whether to check on a table, check on the
          table. A quick glance, a smile, or a simple &ldquo;Everything
          good?&rdquo; takes two seconds and can prevent a complaint. Neglect
          is the number one reason guests do not return.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Greet within 1 minute — first impressions are everything",
          "Suggest specific items, don't just take orders",
          "Never auction food — know your seat numbers",
          "Two-minute check back on entrees is mandatory, not optional",
          "Timing standards exist for every step — hit them consistently",
          "Pre-bus throughout the meal to keep the table clean",
          "Close the experience with genuine gratitude",
        ]}
      />
    </div>
  );
}
