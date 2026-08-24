import {
  LessonIntro,
  SectionBlock,
  CardGrid,
  KnowledgeCard,
  QuickRef,
  KeyTakeaway,
} from "../blocks";

export function ServerSuggestiveContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Suggestive Selling"
        subtitle="Drive sales and elevate the guest experience by making smart, specific recommendations."
        estimatedTime={12}
        tags={["Server", "Required"]}
        whyItMatters="Suggestive selling is not upselling — it is helping guests discover items they will love. It increases your check averages, your tips, and the guest's overall experience."
      />

      <SectionBlock title="The 7 Sales Opportunities" subtitle="Every table visit is a chance to suggest something specific.">
        <CardGrid columns={2}>
          <KnowledgeCard
            title="Chips & Guac"
            badge="Starter"
            description="Suggest this for every table as soon as they sit down. It's our signature starter and the easiest sell on the menu."
            details={[
              "\"Can I get some fresh Chips & Guac started for the table?\"",
              "Don't ask if — ask which: \"House-made guac or our queso?\"",
            ]}
            highlight
          />
          <KnowledgeCard
            title="Hang 10 Combo"
            badge="Value Add"
            description="A fan favorite — highlight the value and variety for groups or indecisive guests."
            details={[
              "\"The Hang 10 is perfect for sharing — you get to try a little of everything\"",
              "Great for tables of 3 or more",
            ]}
          />
          <KnowledgeCard
            title="Specialty Margaritas"
            badge="Beverage"
            description="Lead with a specific margarita recommendation instead of a generic drink question."
            details={[
              "\"Our Ditch Rita is the most popular — have you tried it?\"",
              "Mention seasonal or limited-time specialty drinks",
            ]}
          />
          <KnowledgeCard
            title="Premium Upgrades"
            badge="Upgrade"
            description="Offer top-shelf liquor upgrades and premium add-ons when guests order cocktails."
            details={[
              "\"Would you like that with Casamigos or Patron?\"",
              "Suggest extra protein or avocado on bowls and tacos",
            ]}
          />
          <KnowledgeCard
            title="Dessert"
            badge="Closer"
            description="Never skip the dessert offer. Be specific and enthusiastic — name the item."
            details={[
              "\"You have to try our Churros — they're the perfect way to end the meal\"",
              "Offer dessert before presenting the check",
            ]}
          />
          <KnowledgeCard
            title="Second Round"
            badge="Beverage"
            description="Offer a refill or second cocktail before the glass is empty. Timing is everything."
            details={[
              "\"Can I get you another one of those? It looked like you were enjoying it\"",
              "Approach when the drink is about one-third full",
            ]}
          />
          <KnowledgeCard
            title="Seasonal & LTOs"
            badge="Special"
            description="Always mention limited-time offers and seasonal specials — guests don't know about them unless you tell them."
            details={[
              "\"We just launched our new summer menu — the Mango Habanero Tacos are incredible\"",
              "Create urgency: \"It's only available this month\"",
            ]}
          />
        </CardGrid>
      </SectionBlock>

      <SectionBlock title="How to Sell Without Being Pushy">
        <QuickRef
          type="do"
          title="Suggestive Selling Best Practices"
          items={[
            "Be specific — say the name of the dish, not \"do you want an appetizer?\"",
            "Be enthusiastic — if you love it, they'll want to try it",
            "Be patient — give them time to think, don't hover",
            "Share personal favorites — \"I always get the...\" builds trust",
            "Read the table — big group celebrating? Suggest sharing plates and cocktails",
            "Pair items — \"That pairs perfectly with our...\"",
          ]}
        />
        <QuickRef
          type="dont"
          title="What to Avoid"
          items={[
            "Rapid-fire suggestions that overwhelm the guest",
            "Suggesting the most expensive item on the menu without context",
            "Pushing after a guest says no — one suggestion per opportunity",
            "Being vague: \"Do you want anything else?\" is not suggestive selling",
            "Sounding scripted or robotic — be natural and conversational",
          ]}
        />
      </SectionBlock>

      <KeyTakeaway
        items={[
          "Suggestive selling helps the guest — you're a guide, not a salesperson",
          "Be specific: name the dish, describe why it's great",
          "There are 7 natural selling moments in every table visit — use them",
          "One suggestion per moment — don't overwhelm",
          "Higher check averages mean higher tips for you",
        ]}
      />
    </div>
  );
}
