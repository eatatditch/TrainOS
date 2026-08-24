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

export function MenuFoodContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Food Menu Knowledge"
        subtitle="Know every item, every price, and every detail so you can guide guests with confidence."
        estimatedTime={20}
        tags={["Menu", "Required"]}
        whyItMatters="Guests trust servers who know the menu inside and out. Your product knowledge directly impacts their experience and your check averages."
      />

      <SectionBlock title="The Ditch Menu">
        <TabBlock
          tabs={[
            {
              label: "Starters",
              content: (
                <CardGrid columns={2}>
                  <KnowledgeCard
                    title="Chips & Guac"
                    price="$10"
                    badge="Signature, Shareable"
                    description="House-made guacamole with warm tortilla chips. Our best seller and the perfect table starter."
                    highlight
                  />
                  <KnowledgeCard
                    title="Chips & Queso"
                    price="$9"
                    badge="Shareable"
                    description="Creamy house-made queso with warm tortilla chips."
                  />
                  <KnowledgeCard
                    title="Chips & Salsa"
                    price="$8"
                    badge="Shareable"
                    description="House-roasted salsa trio with warm tortilla chips."
                  />
                  <KnowledgeCard
                    title="Hang 10 Combo"
                    price="$20"
                    badge="Best Value, Shareable"
                    description="Chips served with guac, queso, and salsa. The ultimate sharing platter for groups."
                    highlight
                  />
                  <KnowledgeCard
                    title="Street Corn"
                    price="$9"
                    badge="Fan Favorite"
                    description="Grilled elote with cotija cheese, chili lime crema, and Tajin."
                  />
                  <KnowledgeCard
                    title="Chicken Wings"
                    price="$15"
                    badge="Shareable"
                    description="Crispy wings tossed in your choice of sauce. Ask about current sauce options."
                  />
                </CardGrid>
              ),
            },
            {
              label: "Tacos",
              content: (
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    All tacos served on corn or flour tortillas. Priced per taco.
                  </p>
                  <CardGrid columns={2}>
                    <KnowledgeCard
                      title="Baja Fish"
                      price="$5"
                      badge="Signature"
                      description="Beer-battered fish, chipotle crema, cabbage slaw, pico de gallo."
                      highlight
                    />
                    <KnowledgeCard
                      title="Carne Asada"
                      price="$5"
                      badge="Popular"
                      description="Grilled marinated steak, onion, cilantro, salsa verde."
                    />
                    <KnowledgeCard
                      title="Chicken Tinga"
                      price="$4"
                      description="Shredded chicken in smoky chipotle-tomato sauce, queso fresco, pickled onion."
                    />
                    <KnowledgeCard
                      title="Carnitas"
                      price="$5"
                      description="Slow-braised pork, pineapple salsa, cilantro, onion."
                    />
                    <KnowledgeCard
                      title="Shrimp"
                      price="$5"
                      badge="Popular"
                      description="Grilled or crispy shrimp, avocado crema, cabbage slaw, lime."
                    />
                    <KnowledgeCard
                      title="Veggie"
                      price="$4"
                      badge="Vegetarian"
                      description="Roasted seasonal vegetables, black beans, avocado, cotija cheese."
                    />
                  </CardGrid>
                </div>
              ),
            },
            {
              label: "Bowls",
              content: (
                <CardGrid columns={2}>
                  <KnowledgeCard
                    title="Burrito Bowl"
                    price="$21"
                    badge="Customizable"
                    description="Choice of protein over cilantro-lime rice, black beans, pico, cheese, crema, and guac."
                    details={[
                      "Proteins: chicken, steak (+$3), carnitas, shrimp (+$3), or veggie",
                    ]}
                  />
                  <KnowledgeCard
                    title="Poké Bowl"
                    price="$23"
                    badge="Fresh"
                    description="Ahi tuna or salmon over sushi rice with mango, avocado, cucumber, edamame, and ponzu."
                  />
                  <KnowledgeCard
                    title="Fajita Bowl"
                    price="$24"
                    badge="Sizzling"
                    description="Grilled fajita veggies and protein over rice with cheese, guac, sour cream, and warm tortillas on the side."
                  />
                  <KnowledgeCard
                    title="Power Bowl"
                    price="$26"
                    badge="Healthy"
                    description="Double protein, brown rice, black beans, roasted veggies, avocado, and chimichurri."
                  />
                </CardGrid>
              ),
            },
            {
              label: "Platos",
              content: (
                <CardGrid columns={2}>
                  <KnowledgeCard
                    title="Fajitas"
                    price="$26"
                    badge="Sizzling, Shareable"
                    description="Sizzling skillet with grilled peppers and onions, served with rice, beans, guac, sour cream, and warm tortillas."
                    details={[
                      "Available in chicken, steak (+$4), shrimp (+$4), or combo (+$4)",
                    ]}
                    highlight
                  />
                  <KnowledgeCard
                    title="Enchiladas"
                    price="$22"
                    description="Three enchiladas with choice of protein, smothered in red or green sauce, with rice and beans."
                  />
                  <KnowledgeCard
                    title="Quesadilla Grande"
                    price="$18"
                    badge="Shareable"
                    description="Oversized flour tortilla with melted cheese and choice of protein, served with guac, sour cream, and pico."
                  />
                </CardGrid>
              ),
            },
            {
              label: "Handhelds",
              content: (
                <CardGrid columns={2}>
                  <KnowledgeCard
                    title="Ditch Burger"
                    price="$18"
                    badge="Signature"
                    description="Double smash patty with American cheese, house sauce, pickles, lettuce, and tomato on a brioche bun. Served with fries."
                    highlight
                  />
                  <KnowledgeCard
                    title="Baja Chicken Sandwich"
                    price="$16"
                    description="Crispy or grilled chicken with chipotle mayo, avocado, lettuce, and tomato. Served with fries."
                  />
                  <KnowledgeCard
                    title="Burrito"
                    price="$15"
                    badge="Customizable"
                    description="Oversized flour tortilla stuffed with your choice of protein, rice, beans, cheese, and salsa."
                  />
                  <KnowledgeCard
                    title="Lobster Roll"
                    price="$35"
                    badge="Premium"
                    description="Butter-poached lobster on a toasted split-top roll with lemon aioli and chives. Served with fries."
                  />
                  <KnowledgeCard
                    title="Fish & Chips"
                    price="$20"
                    description="Beer-battered fish fillets with fries, coleslaw, and tartar sauce."
                  />
                  <KnowledgeCard
                    title="Chicken Tenders"
                    price="$12"
                    description="Hand-breaded chicken tenders with fries and your choice of dipping sauce."
                  />
                </CardGrid>
              ),
            },
            {
              label: "Dessert",
              content: (
                <CardGrid columns={2}>
                  <KnowledgeCard
                    title="Churros"
                    price="$8"
                    badge="Signature, Shareable"
                    description="Cinnamon-sugar churros with chocolate and caramel dipping sauces."
                    highlight
                  />
                  <KnowledgeCard
                    title="Tres Leches"
                    price="$8"
                    badge="House Made"
                    description="Classic three-milk cake topped with whipped cream and fresh berries."
                  />
                  <KnowledgeCard
                    title="Key Lime Pie"
                    price="$7"
                    description="Tangy key lime filling in a graham cracker crust with whipped cream."
                  />
                  <KnowledgeCard
                    title="Ice Cream Sundae"
                    price="$6"
                    description="Two scoops with chocolate sauce, whipped cream, and a cherry."
                  />
                </CardGrid>
              ),
            },
            {
              label: "Kids",
              content: (
                <div>
                  <p className="text-gray-600 text-sm mb-4">
                    For the kiddos. All kids meals come with a beverage. Fruit cup
                    can be swapped for fries at no charge.
                  </p>
                  <CardGrid columns={2}>
                    <KnowledgeCard
                      title="Kids Fried Chicken Tacos"
                      price="$10.85"
                      badge="Kids"
                      description="Fried chicken, corn tortillas, mixed cheese. Served with a side fruit cup and a beverage."
                    />
                    <KnowledgeCard
                      title="Kids Steak Tacos"
                      price="$10.85"
                      badge="Kids"
                      description="Grilled steak, corn tortillas, mixed cheese. Served with a side fruit cup and a beverage."
                    />
                    <KnowledgeCard
                      title="Kids Baja Fish Tacos"
                      price="$10.85"
                      badge="Kids"
                      description="Fried fish, corn tortillas, mixed cheese. Served with a side fruit cup and a beverage."
                    />
                    <KnowledgeCard
                      title="Kids Grilled Fish Tacos"
                      price="$10.85"
                      badge="Kids"
                      description="Grilled fish, corn tortillas, mixed cheese. Served with a side fruit cup and a beverage."
                    />
                    <KnowledgeCard
                      title="Kids Quesadilla"
                      price="$10.85"
                      badge="Kids, Customizable"
                      description="Corn tortillas, mixed cheese. Served with a side fruit cup and a beverage."
                      details={[
                        "Add beans +$1",
                        "Add fried chicken +$1",
                        "Add steak +$1",
                      ]}
                    />
                    <KnowledgeCard
                      title="Fruit Cup"
                      price="$3.25"
                      badge="Kids, Side"
                      description="Fresh pineapple & watermelon cubes. Available as a kids side or standalone."
                    />
                  </CardGrid>
                </div>
              ),
            },
          ]}
        />
      </SectionBlock>

      <CalloutBlock type="tip" title="Combos & Specials">
        <p>
          Always mention the Hang 10 Combo for groups — it is our highest-value
          starter. Check with your manager before each shift for daily specials,
          86&apos;d items, and any limited-time offers to mention at the table.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Know every item, price, and description on the menu",
          "Starters range from $8-$20, tacos $4-$5, bowls $21-$26",
          "Kids meals are $10.85 and include a beverage — fruit can be swapped for fries",
          "Be ready to describe ingredients and make recommendations",
          "Know allergens and dietary options (vegetarian, gluten-free)",
          "Check for daily specials and 86'd items before every shift",
        ]}
      />
    </div>
  );
}
