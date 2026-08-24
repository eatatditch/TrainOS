"use client";

import {
  LessonIntro,
  SectionBlock,
  TabBlock,
  CardGrid,
  KnowledgeCard,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function MenuCocktailsContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Cocktail & Beverage Menu"
        subtitle="Master the full drink menu to make confident, specific recommendations at every table."
        estimatedTime={15}
        tags={["Menu", "Required"]}
        whyItMatters="Beverage sales are a major revenue driver. Knowing the cocktail menu lets you suggest the right drink for every guest and boost your check averages."
      />

      <SectionBlock title="The Drink Menu">
        <TabBlock
          tabs={[
            {
              label: "Specialty Margs",
              content: (
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    Our signature margaritas — always lead with these when suggesting a drink.
                  </p>
                  <CardGrid columns={2}>
                    <KnowledgeCard
                      title="Ditch Rita"
                      price="$14"
                      badge="Signature, Best Seller"
                      description="Our house margarita — Tequila blanco, fresh lime, agave, triple sec. Served on the rocks or frozen."
                      highlight
                    />
                    <KnowledgeCard
                      title="Spicy Mango Marg"
                      price="$15"
                      badge="Popular"
                      description="Tequila blanco, fresh mango puree, lime, agave, and Tajin rim with a chili kick."
                    />
                    <KnowledgeCard
                      title="Skinny Marg"
                      price="$13"
                      badge="Light"
                      description="Tequila blanco, fresh lime, agave. Clean, simple, and low-calorie."
                    />
                    <KnowledgeCard
                      title="Cadillac Marg"
                      price="$18"
                      badge="Premium"
                      description="Reposado tequila, Grand Marnier, fresh lime, agave. Top-shelf upgrade."
                    />
                    <KnowledgeCard
                      title="Frozen Strawberry Marg"
                      price="$14"
                      badge="Frozen"
                      description="Tequila blanco, fresh strawberry puree, lime, agave. Blended smooth."
                    />
                    <KnowledgeCard
                      title="Pitcher Marg"
                      price="$29"
                      badge="Shareable, Value"
                      description="A full pitcher of our Ditch Rita. Serves 3-4 guests. Perfect for groups."
                      highlight
                    />
                    <KnowledgeCard
                      title="Mezcal Marg"
                      price="$16"
                      badge="Smoky"
                      description="Mezcal, lime, agave, triple sec. Smoky and bold for adventurous drinkers."
                    />
                    <KnowledgeCard
                      title="Seasonal Marg"
                      price="$15"
                      badge="Limited Time"
                      description="Rotating seasonal flavor — ask your manager for this week's special."
                    />
                  </CardGrid>
                </div>
              ),
            },
            {
              label: "House Cocktails",
              content: (
                <CardGrid columns={2}>
                  <KnowledgeCard
                    title="Ditch Paloma"
                    price="$13"
                    badge="Refreshing"
                    description="Tequila blanco, fresh grapefruit, lime, soda water, and a salt rim."
                  />
                  <KnowledgeCard
                    title="Spicy Ranch Water"
                    price="$12"
                    badge="Popular"
                    description="Tequila blanco, lime, Topo Chico, and a jalape&ntilde;o kick."
                  />
                  <KnowledgeCard
                    title="Ditch Mule"
                    price="$13"
                    badge="Classic Twist"
                    description="Tequila blanco, ginger beer, lime, served in a copper mug."
                  />
                  <KnowledgeCard
                    title="Tequila Sunrise"
                    price="$12"
                    description="Tequila blanco, orange juice, and grenadine. A colorful classic."
                  />
                  <KnowledgeCard
                    title="Michelada"
                    price="$12"
                    badge="Bold"
                    description="Mexican beer with tomato-lime mix, hot sauce, Worcestershire, and a Tajin rim."
                  />
                </CardGrid>
              ),
            },
            {
              label: "Rum",
              content: (
                <div>
                  <CardGrid columns={2}>
                    <KnowledgeCard
                      title="Island Rum Punch"
                      price="$12"
                      badge="Tropical"
                      description="Rum blend, pineapple, orange, coconut cream, and grenadine. Tropical and smooth."
                    />
                    <KnowledgeCard
                      title="Mojito"
                      price="$12"
                      badge="Classic"
                      description="White rum, fresh mint, lime, sugar, and soda water."
                    />
                    <KnowledgeCard
                      title="Dark & Stormy"
                      price="$12"
                      description="Dark rum, ginger beer, and fresh lime."
                    />
                    <KnowledgeCard
                      title="Coconut Mojito"
                      price="$12"
                      badge="Tropical"
                      description="Coconut rum, fresh mint, lime, coconut cream, and soda water."
                    />
                  </CardGrid>
                  <CalloutBlock type="warning" title="Allergen Alert: Island Rum Punch">
                    <p>
                      The Island Rum Punch CONTAINS COCONUT. Always ask guests
                      about nut and coconut allergies before recommending this
                      drink. If a guest has an allergy, suggest the Mojito or
                      Dark &amp; Stormy instead.
                    </p>
                  </CalloutBlock>
                </div>
              ),
            },
            {
              label: "Zero Proof",
              content: (
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    Non-alcoholic options for designated drivers, non-drinkers, or anyone who wants a special drink without the alcohol.
                  </p>
                  <CardGrid columns={2}>
                    <KnowledgeCard
                      title="Virgin Ditch Rita"
                      price="$6"
                      badge="Alcohol-Free"
                      description="All the flavor of our signature Ditch Rita without the tequila. Fresh lime, agave, and triple sec substitute."
                    />
                    <KnowledgeCard
                      title="Virgin Mango Marg"
                      price="$6"
                      badge="Alcohol-Free"
                      description="Fresh mango puree, lime, agave, and Tajin rim. Sweet and refreshing."
                    />
                    <KnowledgeCard
                      title="Agua Fresca"
                      price="$6"
                      badge="House Made"
                      description="Rotating seasonal fruit water — ask about today's flavor."
                    />
                    <KnowledgeCard
                      title="Jarritos"
                      price="$6"
                      badge="Mexican Soda"
                      description="Assorted flavors of authentic Mexican soda. Ask for available flavors."
                    />
                  </CardGrid>
                </div>
              ),
            },
            {
              label: "Beer",
              content: (
                <CardGrid columns={2}>
                  <KnowledgeCard
                    title="Draft Beers"
                    price="$7"
                    badge="Rotating"
                    description="Rotating selection of local and craft beers on tap. Ask your bartender for the current lineup."
                  />
                  <KnowledgeCard
                    title="Modelo Especial"
                    price="$6"
                    badge="Mexican Lager"
                    description="Crisp, clean Mexican lager. Our most popular beer."
                    highlight
                  />
                  <KnowledgeCard
                    title="Pacifico"
                    price="$6"
                    badge="Mexican Lager"
                    description="Light, refreshing pilsner-style lager from Mazatlan."
                  />
                  <KnowledgeCard
                    title="Dos Equis"
                    price="$6"
                    badge="Mexican Lager"
                    description="Available in Lager or Ambar. A smooth, easy-drinking classic."
                  />
                  <KnowledgeCard
                    title="Corona"
                    price="$6"
                    badge="Mexican Lager"
                    description="Light, crisp, and always served with a lime wedge."
                  />
                  <KnowledgeCard
                    title="Craft/IPA"
                    price="$7"
                    badge="Rotating"
                    description="Rotating selection of craft and IPA options. Check the beer board."
                  />
                </CardGrid>
              ),
            },
            {
              label: "Wine",
              content: (
                <CardGrid columns={2}>
                  <KnowledgeCard
                    title="House White"
                    price="$12 / $46"
                    badge="Glass / Bottle"
                    description="Crisp, light white wine — changes seasonally. Ask about the current selection."
                  />
                  <KnowledgeCard
                    title="House Red"
                    price="$12 / $46"
                    badge="Glass / Bottle"
                    description="Medium-bodied red wine — changes seasonally. Ask about the current selection."
                  />
                  <KnowledgeCard
                    title="House Rose"
                    price="$12 / $46"
                    badge="Glass / Bottle"
                    description="Dry, refreshing rose — perfect for warm weather. Ask about the current selection."
                  />
                  <KnowledgeCard
                    title="Sparkling"
                    price="$12 / $46"
                    badge="Glass / Bottle"
                    description="Brut sparkling wine. Great for celebrations or as a cocktail base."
                  />
                </CardGrid>
              ),
            },
          ]}
        />
      </SectionBlock>

      <KeyTakeaway
        items={[
          "Specialty Margs are $12-$29 — lead with these when suggesting drinks",
          "Always mention the Pitcher Marg for groups of 3+",
          "Zero Proof options start at $6 — always offer them to non-drinkers",
          "Island Rum Punch contains coconut — always check for allergies",
          "Know the rotating selections (drafts, craft, seasonal marg, wines)",
          "Beer ranges $6-$7, wine $12 glass / $46 bottle",
        ]}
      />
    </div>
  );
}
