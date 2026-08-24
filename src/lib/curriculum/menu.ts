import type { MenuSpecStatus } from "./types";

export type FoodMenuItem = {
  id: string;
  category: "Share + Socialize" | "Soup + Salads" | "Tacos" | "Sides" | "Bowls" | "Platos" | "Handhelds" | "Dessert";
  name: string;
  price: string;
  description: string;
  addOns?: readonly string[];
  sourceStatus: "approved";
  allergyStatus: "verification-required";
};

const food = (
  id: string,
  category: FoodMenuItem["category"],
  name: string,
  price: string,
  description: string,
  addOns?: readonly string[]
): FoodMenuItem => ({
  id,
  category,
  name,
  price,
  description,
  ...(addOns ? { addOns } : {}),
  sourceStatus: "approved",
  allergyStatus: "verification-required",
});

/** Guest-facing menu facts from the supplied dining room menu.
 * Prices and availability must be checked against the live POS before training. */
export const FOOD_MENU_ITEMS = [
  food("food-chips-guac", "Share + Socialize", "Chips + Guac", "$12", "Mashed avocado, fresh lime juice, onion, tomato, cilantro, and pickled jalapeños with corn tortilla chips."),
  food("food-yuca-poppers", "Share + Socialize", "Yuca Poppers", "$14", "Fried yuca croquettes with guacamole, sweet chili, herb aioli, and chipotle aioli."),
  food("food-empanada-del-dia", "Share + Socialize", "Empanada del Día", "$14", "The daily empanada served with herb aioli."),
  food("food-longboard-mozz-sticks", "Share + Socialize", "Longboard Mozz Sticks", "$10", "House-made panko-breaded mozzarella with marinara."),
  food("food-queso-blanco", "Share + Socialize", "Queso Blanco", "$11", "Queso with charred poblano and jalapeño peppers, served with corn tortilla chips.", ["Harissa pulled chicken +$3", "Chorizo +$2", "Lobster +market price"]),
  food("food-pork-carnitas-nachos", "Share + Socialize", "Pork Carnitas Nachos", "$18", "Corn tortilla chips, queso blanco, pico de gallo, shredded lettuce, lime crema, and pickled jalapeños."),
  food("food-crispy-calamari", "Share + Socialize", "Crispy Calamari", "$20", "Topped with toasted coconut and scallions; served with sweet Thai chili sauce."),
  food("food-fried-pickles", "Share + Socialize", "Fried Pickles", "$8", "House-made beer-battered pickle chips with horseradish aioli."),
  food("food-tuna-tartare", "Share + Socialize", "Tuna Tartare", "$16", "Chipotle aioli, sweet soy, and scallions with corn tortilla chips."),
  food("food-pei-mussels", "Share + Socialize", "PEI Mussels", "$19", "Coconut curry sauce, garlic crostini, and fine herbs."),
  food("food-wings", "Share + Socialize", "Wings", "$16", "Classic fried chicken wings with Buffalo, sweet chili, BBQ, or jerk seasoning."),

  food("food-chicken-tortilla-soup", "Soup + Salads", "Chicken Tortilla Soup", "$10", "Roasted chicken, fire-roasted tomatoes, black beans, corn, and bell peppers with tortilla strips, cotija, and cilantro."),
  food("food-summer-salad", "Soup + Salads", "Summer Salad", "$18", "Arugula, pineapple and watermelon, shallot, feta, and grilled chicken in pineapple-cilantro vinaigrette.", ["Swap chicken for carne asada +$3", "Jerk shrimp +$3", "Lobster +market price", "Roasted cauliflower"]),
  food("food-hampton-caesar", "Soup + Salads", "Hampton Caesar", "$18", "Arugula and radicchio, lemon-thyme croutons, cotija, and grilled chicken in Caesar dressing.", ["Swap chicken for carne asada +$3", "Jerk shrimp +$3", "Lobster +market price", "Roasted cauliflower"]),
  food("food-spinach-chickpea", "Soup + Salads", "Spinach + Chickpea", "$18", "Feta, pickled onion, cucumber, cherry tomato, and harissa pulled chicken in lemon-basil vinaigrette.", ["Swap chicken for carne asada +$3", "Jerk shrimp +$3", "Lobster +market price", "Roasted cauliflower"]),

  food("food-taco-carne-asada", "Tacos", "Carne Asada Taco", "$4", "Marinated sirloin steak, crispy shallots, pico de gallo, lime crema, and cilantro."),
  food("food-taco-beachfire-chicken", "Tacos", "Beachfire Chicken Taco", "$4", "Buttermilk-fried chicken breast, Valentina hot sauce, spicy slaw, pickled jalapeños, and cilantro."),
  food("food-taco-pork-carnitas", "Tacos", "Pork Carnitas Taco", "$4", "Slow-roasted pork, aguachile, and cilantro."),
  food("food-taco-seared-tuna", "Tacos", "Seared Tuna Taco", "$5", "Toasted sesame seeds, Tajín-jicama, chipotle aioli, and cilantro."),
  food("food-taco-pork-belly", "Tacos", "Pork Belly Taco", "$5", "Wakame seaweed salad, hoisin glaze, and cilantro."),
  food("food-taco-al-pastor", "Tacos", "Al Pastor Taco", "$4", "Crumbled chorizo, grilled pineapple, scallions, and cilantro."),
  food("food-taco-baja-fish", "Tacos", "Baja Fish Taco", "$4", "Beer-and-vodka-battered seasonal local fish, red cabbage, pico de gallo, lime crema, and cilantro."),
  food("food-taco-jerk-shrimp", "Tacos", "Jerk Shrimp Taco", "$5", "Spicy slaw, pico de gallo, chipotle aioli, and cilantro."),
  food("food-taco-local-catch", "Tacos", "Local Catch Taco", "$4", "Grilled seasonal local fish, red cabbage, pico de gallo, lime crema, and cilantro."),
  food("food-taco-roasted-cauliflower", "Tacos", "Roasted Cauliflower Taco", "$4", "Pickled onions, sweet soy, toasted sesame seeds, and cilantro."),

  food("food-side-cheesy-mac", "Sides", "Cheesy Mac", "$7", "Side portion."),
  food("food-side-sauteed-spinach", "Sides", "Sautéed Spinach", "$7", "Side portion."),
  food("food-side-cotija-truffle-fries", "Sides", "Cotija-Truffle Fries", "$7", "Side portion."),
  food("food-side-black-beans", "Sides", "Black Beans", "$7", "Side portion."),
  food("food-side-mashed-potatoes", "Sides", "Mashed Potatoes", "$7", "Side portion."),
  food("food-side-white-rice", "Sides", "White Rice", "$7", "Side portion."),
  food("food-side-veggie-medley", "Sides", "Veggie Medley", "$7", "Side portion."),
  food("food-side-gallo-pinto", "Sides", "Gallo Pinto", "$7", "White rice, black beans, pico de gallo, cotija, and cilantro."),

  food("food-poke-bowl", "Bowls", "Poke Bowl", "$26", "Sushi rice, shredded carrots, cucumber, radish, marinated yellowfin tuna, and chipotle aioli.", ["Wakame seaweed salad +$2"]),
  food("food-mediterranean-bowl", "Bowls", "Mediterranean Bowl", "$21", "House-made hummus, grilled halloumi, cherry tomato, radish, cucumber, red onion, roasted garlic oil, and naan.", ["Harissa pulled chicken +$3", "Carne asada +$7", "Jerk shrimp +$4"]),
  food("food-zuma-beach-bowl", "Bowls", "Zuma Beach Bowl", "$21", "Quinoa, vegetable medley, crunchy chickpeas, pickled onions, and lemon-basil vinaigrette.", ["Harissa pulled chicken +$3", "Carne asada +$7", "Jerk shrimp +$4"]),
  food("food-miyazaki-bowl", "Bowls", "Miyazaki Bowl", "$26", "Crispy pork, steamed white rice, cucumber, red cabbage, wakame seaweed salad, rice-wine vinaigrette, and fried egg."),

  food("food-beach-kebabs", "Platos", "Beach Kebabs", "$28", "Jumbo shrimp skewers with coconut-chorizo rice."),
  food("food-quesadilla", "Platos", "Quesadilla", "$12", "Grilled flour tortilla, mixed cheeses, and pico de gallo.", ["Harissa pulled chicken +$4", "Carne asada +$7", "Lobster +market price", "Pork carnitas +$4"]),
  food("food-roasted-chicken", "Platos", "Roasted Chicken", "$26", "Served with mac and cheese, sautéed spinach, diced tomatoes, and fine herbs."),
  food("food-sirloin-steak", "Platos", "Sirloin Steak", "$31", "Served with mashed potatoes, sautéed spinach, and frizzled onions."),
  food("food-fish-chips", "Platos", "Fish + Chips", "$23", "Beer-battered seasonal local fish with crispy fries."),
  food("food-coconut-crusted-cod", "Platos", "Coconut-Crusted Cod", "$29", "White rice, iceberg lettuce, green apple, cucumber, and sweet chili sauce."),

  food("food-lobster-roll", "Handhelds", "Lobster Roll", "$35", "Hot: warm and buttery. Cold: tossed in herb aioli. Served with fries."),
  food("food-big-john-burger", "Handhelds", "Big John Burger", "$15", "Seven-ounce tri-cut beef blend served with fries.", ["Cheese +$2"]),
  food("food-big-al-burger", "Handhelds", "Big Al Burger", "$18", "Seven-ounce tri-cut beef blend, American cheese, bacon, lettuce, tomato, and onion; served with fries."),
  food("food-korean-chicken-sammy", "Handhelds", "Korean Chicken Sammy", "$16", "Fried chicken breast, spicy kimchi, cucumber, honey-gochujang, sesame seeds, and buttermilk ranch; served with fries."),
  food("food-maverick-burger", "Handhelds", "Maverick Burger", "$21", "Seven-ounce tri-cut beef blend, A1 aioli, crispy shallots, pork carnitas, and pepper jack; served with fries."),
  food("food-shrimp-po-boy", "Handhelds", "Shrimp Po Boy", "$20", "Coconut-milk-marinated fried shrimp, shredded lettuce, tomato, and fried jalapeños; served with fries."),

  food("food-churros", "Dessert", "Churros", "$8", "House-made churros with caramel and vanilla dipping sauces."),
  food("food-ice-cream", "Dessert", "Ice Cream", "$6", "One scoop of vanilla ice cream."),
  food("food-key-lime-pie", "Dessert", "Key Lime Pie", "$8", "Tangy key lime custard, graham cracker crust, whipped cream, and lime zest."),
] as const satisfies readonly FoodMenuItem[];

export const FOOD_MENU_OFFERS = [
  { id: "offer-taco-meal", title: "Make It a Meal", description: "Three tacos plus one side.", price: "$18" },
  { id: "offer-taco-12-pack", title: "Feed the Table", description: "Family-style 12-taco pack.", price: "$45" },
  { id: "offer-taco-add-guac", title: "Taco Add-On", description: "Add guacamole.", price: "+$1" },
  { id: "offer-taco-add-sour-cream", title: "Taco Add-On", description: "Add sour cream.", price: "+$0.50" },
  { id: "offer-handheld-side-swap", title: "Handheld Side Upgrade", description: "Swap fries for Cotija-truffle fries, gallo pinto, or a side salad.", price: "+$2" },
] as const;

/** Printed-current specials and beverage snapshots that are searchable but
 * never treated as permanent availability. The live POS and manager-posted
 * list win at each location. */
export const CURRENT_MENU_INFO = [
  { id: "lunch-taco-duo", moduleId: "cur-server-food-menu", title: "Lunch Taco Duo + Soup or Salad", price: "$12", description: "Monday–Friday, 12–4 PM: mix-and-match two tacos plus soup or salad.", tags: ["lunch", "special", "tacos"] },
  { id: "lunch-big-john", moduleId: "cur-server-food-menu", title: "Lunch Big John Burger", price: "$12", description: "Monday–Friday, 12–4 PM: seven-ounce tri-cut beef blend served with fries.", tags: ["lunch", "special", "handhelds"] },
  { id: "lunch-miyazaki", moduleId: "cur-server-food-menu", title: "Lunch Miyazaki Bowl", price: "$18", description: "Monday–Friday, 12–4 PM: lunch-size crispy pork, white rice, cucumber, red cabbage, wakame seaweed salad, rice-wine vinaigrette, and fried egg.", tags: ["lunch", "special", "bowls"] },
  { id: "lunch-poke", moduleId: "cur-server-food-menu", title: "Lunch Poke Bowl", price: "$18", description: "Monday–Friday, 12–4 PM: lunch-size sushi rice, carrots, cucumber, radish, marinated yellowfin tuna, and chipotle aioli.", tags: ["lunch", "special", "bowls"] },
  { id: "surfside-canned-cocktail", moduleId: "cur-server-beverage-menu", title: "Surfside Canned Cocktails", price: "$11.18", description: "Select flavors. Verify the current live flavor and availability before recommending.", tags: ["beverage", "canned-cocktail", "rotating"] },
  { id: "wine-snapshot", moduleId: "cur-server-beverage-menu", title: "Printed Wine List", price: "$12.82 glass | $45.99 bottle", description: "Printed list: Cabernet Sauvignon, Pinot Noir, Chardonnay, Sauvignon Blanc, Rosé, Prosecco, and Pinot Grigio. Verify current producer, vintage, and availability in the live POS.", tags: ["beverage", "wine", "rotating"] },
  { id: "draft-beer-snapshot", moduleId: "cur-server-beverage-menu", title: "Printed Draft Beer Snapshot", price: "$8.09", description: "Printed snapshot: Narragansett Lager (5.0%), Monopolio Negra Lager (5.5%), Sand City Oops I Hopped My Pants IPA (6.2%), and Allagash White wheat (5.2%). Beer rotates by location and date; the live POS/current manager-posted list always wins.", tags: ["beverage", "beer", "draft", "rotating"] },
  { id: "bottle-can-beer-snapshot", moduleId: "cur-server-beverage-menu", title: "Printed Bottles + Cans Snapshot", price: "$6.03", description: "Printed snapshot: Miller Lite, Michelob Ultra, Corona, Whalers APA, Corona Premier, Lagunitas IPA, Heineken, Corona Non-Alcoholic, and select cider. Beer rotates by location and date; verify the live POS/current manager-posted list.", tags: ["beverage", "beer", "bottles", "cans", "cider", "rotating"] },
  { id: "cash-discount", moduleId: "cur-server-beverage-menu", title: "Printed Cash Discount", price: "3%", description: "The supplied cocktail menu advertises a 3% discount when paying with cash. Confirm the current payment policy and POS treatment with a manager before explaining it to a guest.", tags: ["payment", "policy", "verification-required"] },
] as const;

export type CocktailSpec = {
  id: string;
  category: "Specialty Marg" | "House Cocktail" | "Rum Cocktail" | "Zero Proof";
  name: string;
  price: string;
  guestDescription: string;
  flavorLane: readonly string[];
  status: MenuSpecStatus;
  glass?: string;
  ice?: string;
  method?: string;
  build?: readonly string[];
  finish?: readonly string[];
  allergyWarning?: string;
  verificationNote?: string;
};

/**
 * Cocktail specs use the controlled August 2026 bar manual. Any item carrying
 * verification-required must not be taught from this object until a manager
 * records the approved current build on the recipe lock.
 */
export const COCKTAIL_MENU = [
  {
    id: "drink-hang-10",
    category: "Specialty Marg",
    name: "Hang 10 Marg",
    price: "$13.24",
    guestDescription: "Reposado tequila, orange liqueur, fresh lime and lemon juices, house sugar syrup, and a salt rim.",
    flavorLane: ["bright", "clean", "classic"],
    status: "approved",
    glass: "DOF / rocks",
    ice: "Fresh cubed",
    method: "Shake and strain",
    build: ["2.75 oz house margarita mix", "2 oz Cazadores Reposado"],
    finish: ["Salt rim", "Lime wedge", "Short straw"],
  },
  {
    id: "drink-smoke-on-the-bay",
    category: "Specialty Marg",
    name: "Smoke on the Bay",
    price: "$14.78",
    guestDescription: "Tanteo Chipotle, 400 Conejos mezcal, fresh lime, watermelon, house sugar syrup, and a black lava salt rim.",
    flavorLane: ["smoky", "spicy", "watermelon"],
    status: "approved",
    glass: "DOF / rocks",
    ice: "Fresh cubed",
    method: "Shake and strain",
    build: ["1 oz simple syrup", "1 oz fresh lime juice", "1 oz watermelon puree", "1 oz Tanteo Chipotle", "1 oz 400 Conejos Mezcal"],
    finish: ["Half black-lava-salt rim", "Lime wheel", "2 watermelon cubes", "Short straw"],
  },
  {
    id: "drink-holla-pain-yo",
    category: "Specialty Marg",
    name: "Holla Pain Yo!",
    price: "$14.78",
    guestDescription: "Tanteo Jalapeño, fresh lime juice, house sugar syrup, and a Tajín rim.",
    flavorLane: ["jalapeño", "tart", "lively"],
    status: "approved",
    glass: "DOF / rocks",
    ice: "Fresh cubed",
    method: "Shake and strain",
    build: ["1 oz simple syrup", "1 oz fresh lime juice", "2 oz Tanteo Jalapeño"],
    finish: ["Half Tajín rim", "Lime wedge", "2 jalapeño wheels", "Short straw"],
  },
  {
    id: "drink-mo-pain-yo",
    category: "Specialty Marg",
    name: "Mo Pain Yo!",
    price: "$14.78",
    guestDescription: "Tanteo Jalapeño and Habanero, fresh lime juice, house sugar syrup, and a Tajín rim.",
    flavorLane: ["habanero", "hot", "citrus"],
    status: "approved",
    glass: "DOF / rocks",
    ice: "Fresh cubed",
    method: "Shake and strain",
    build: ["1 oz simple syrup", "1 oz fresh lime juice", "1.5 oz Tanteo Jalapeño", "0.5 oz Tanteo Habanero"],
    finish: ["Half Tajín rim", "Lime wedge", "Habanero wheel", "Short straw"],
  },
  {
    id: "drink-pineapple-basil-smash",
    category: "Specialty Marg",
    name: "Pineapple Basil Smash",
    price: "$14.78",
    guestDescription: "Reposado tequila, basil, cucumber, pineapple, and fresh lemon juice.",
    flavorLane: ["herbal", "tropical", "crisp"],
    status: "approved",
    glass: "DOF / rocks",
    ice: "Fresh cubed",
    method: "Shake and strain",
    build: ["3 cucumber wheels", "5 basil leaves", "0.5 oz fresh lemon juice", "0.5 oz simple syrup", "1 oz pineapple juice", "2 oz Cazadores Reposado"],
    finish: ["Pineapple wedge", "Cucumber wheel", "Short straw"],
  },
  {
    id: "drink-oaxaca-mule",
    category: "Specialty Marg",
    name: "Oaxaca Mule",
    price: "$14.78",
    guestDescription: "Reposado tequila, 400 Conejos mezcal, artichoke liqueur, fresh lime, house sugar syrup, mint, and ginger beer.",
    flavorLane: ["ginger", "mint", "smoke"],
    status: "approved",
    glass: "Mule mug",
    ice: "Fresh cubed",
    method: "Shake, double strain, then top",
    build: ["10 mint leaves", "0.5 oz simple syrup", "0.75 oz fresh lime juice", "0.25 oz Cynar", "0.25 oz 400 Conejos Mezcal", "1.5 oz Cazadores Reposado", "Top with ginger beer"],
    finish: ["Lime wheel", "Candied ginger", "Mint sprig", "Short straw"],
  },
  {
    id: "drink-ancho-average",
    category: "Specialty Marg",
    name: "Ancho Average Marg",
    price: "$29.51",
    guestDescription: "A share cocktail for two with Tanteo Chipotle, reposado tequila, citrus, pineapple, house sugar syrup, and a Tajín rim.",
    flavorLane: ["pineapple", "chipotle", "share cocktail"],
    status: "verification-required",
    verificationNote: "The controlled source contains an apparent Tanteo Chipotle quantity typo. A manager must lock the correct build before training; do not teach the printed quantity.",
  },
  {
    id: "drink-cool-as-a-cucumber",
    category: "House Cocktail",
    name: "Cool as a Cucumber",
    price: "$13.24",
    guestDescription: "Vodka, melon liqueur, cucumber, fresh lime, house sugar syrup, and tonic.",
    flavorLane: ["cool", "melon", "refreshing"],
    status: "approved",
    glass: "Highball",
    ice: "Fresh cubed",
    method: "Muddle, shake, double strain, then top",
    build: ["3 cucumber wedges", "0.5 oz simple syrup", "0.75 oz fresh lime juice", "0.25 oz Midori", "1.5 oz vodka", "Top with tonic"],
    finish: ["Cucumber wheel", "Straw"],
  },
  {
    id: "drink-sunburnt-summer",
    category: "House Cocktail",
    name: "Sunburnt Summer",
    price: "$14.78",
    guestDescription: "Gin, Chartreuse, fresh lime, house sugar syrup, strawberry, and basil.",
    flavorLane: ["strawberry", "basil", "herbal"],
    status: "verification-required",
    verificationNote: "Verify the full current build and recipe-lock initials before training.",
  },
  {
    id: "drink-frozen-paloma",
    category: "House Cocktail",
    name: "Frozen Paloma",
    price: "$13.24",
    guestDescription: "Reposado tequila, orange and grapefruit liqueurs, citrus, house sugar syrup, and a pink-peppercorn salt rim.",
    flavorLane: ["grapefruit", "citrus", "frozen"],
    status: "verification-required",
    verificationNote: "Verify the approved batch, pink-peppercorn salt, machine standard, and recipe-lock initials before training.",
  },
  {
    id: "drink-da-painkiller",
    category: "Rum Cocktail",
    name: "Da Painkiller",
    price: "$13.24",
    guestDescription: "Pusser's Navy Strength and Gunpowder Proof rums, Coco Lopez, pineapple and orange juices, and nutmeg.",
    flavorLane: ["coconut", "pineapple", "rum"],
    status: "verification-required",
    verificationNote: "Verify the full current build and recipe-lock initials before training.",
  },
  {
    id: "drink-island-rum-punch",
    category: "Rum Cocktail",
    name: "Island Rum Punch",
    price: "$13.24",
    guestDescription: "White and dark rums, house falernum, fresh lime, pineapple, passionfruit, mango, and house sugar syrup.",
    flavorLane: ["tropical", "lime", "spiced"],
    status: "verification-required",
    allergyWarning: "CONTAINS NUTS — the printed menu flags Island Rum Punch for a nut concern; manager and kitchen verification is required.",
    verificationNote: "The controlled manual flags an almond concern through house falernum. Verify the current build and current approved allergy source with a manager before training or answering a guest.",
  },
  {
    id: "drink-mojito",
    category: "Rum Cocktail",
    name: "Mojito",
    price: "$13.24",
    guestDescription: "White rum, fresh lime, house sugar syrup, mint, and soda.",
    flavorLane: ["mint", "lime", "fizzy"],
    status: "approved",
    glass: "Highball",
    ice: "Mixed ice",
    method: "Mix, pour, then top",
    build: ["5 mint leaves", "1 oz simple syrup", "1 oz fresh lime juice", "2 oz white rum", "Top with soda"],
    finish: ["Mint sprig", "Lime wedge"],
  },
  {
    id: "drink-watermelon-cooler",
    category: "Zero Proof",
    name: "Watermelon Cooler",
    price: "$6.18",
    guestDescription: "Watermelon, fresh lime, pineapple juice, and mint.",
    flavorLane: ["watermelon", "mint", "lime"],
    status: "approved",
    glass: "Highball",
    ice: "Mixed ice",
    method: "Shake and pour",
    build: ["5 mint leaves", "4 oz watermelon puree", "0.75 oz pineapple juice", "0.5 oz fresh lime juice"],
    finish: ["2 watermelon cubes", "Mint sprig"],
  },
  {
    id: "drink-no-jito",
    category: "Zero Proof",
    name: "No-Jito",
    price: "$6.18",
    guestDescription: "Fresh lime, apple juice, house sugar syrup, mint, and soda.",
    flavorLane: ["mint", "apple", "lime"],
    status: "approved",
    glass: "Highball",
    ice: "Mixed ice",
    method: "Shake, pour, then top",
    build: ["5 mint leaves", "1 oz fresh lime juice", "1 oz apple juice", "0.75 oz simple syrup", "Top with soda"],
    finish: ["Lime wedge", "Mint sprig"],
  },
  {
    id: "drink-pina-no-lada",
    category: "Zero Proof",
    name: "Piña No-Lada",
    price: "$6.18",
    guestDescription: "Coco Lopez, fresh lime, and pineapple juice.",
    flavorLane: ["coconut", "pineapple", "creamy"],
    status: "approved",
    glass: "Highball",
    ice: "Blended",
    method: "Blend",
    build: ["4 oz Coco Lopez + pineapple mix", "1 oz fresh lime juice"],
    finish: ["Pineapple leaf", "Maraschino cherry"],
  },
  {
    id: "drink-hibiscus-refresher",
    category: "Zero Proof",
    name: "Hibiscus Refresher",
    price: "$6.18",
    guestDescription: "Hibiscus syrup, coconut water, fresh lime, and mango.",
    flavorLane: ["floral", "tart", "tropical"],
    status: "verification-required",
    verificationNote: "Verify the approved syrup/product, open-life, full build, and recipe-lock initials before training.",
  },
] as const satisfies readonly CocktailSpec[];

export const ROTATING_BEER_REFERENCE = {
  sourceStatus: "rotating",
  instruction: "Use the current location's POS and manager-posted beer list. Never certify a fixed historic list as permanent.",
  suppliedMenuSnapshot: {
    draft: ["Narragansett Lager", "Monopolio Negra", "Sand City Oops I Hopped My Pants IPA", "Allagash White", "Local Love - ask what is current"],
    packaged: ["Miller Lite", "Michelob Ultra", "Corona", "Whalers APA", "Corona Premier", "Lagunitas IPA", "Heineken", "Corona Non-Alcoholic", "Select cider - ask what is current"],
  },
} as const;

export const FOOD_MENU_ITEM_BY_ID = new Map(FOOD_MENU_ITEMS.map((item) => [item.id, item]));
export const COCKTAIL_MENU_ITEM_BY_ID = new Map(COCKTAIL_MENU.map((item) => [item.id, item]));
