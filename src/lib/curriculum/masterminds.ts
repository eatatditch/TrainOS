import { LEADERSHIP_AUDIENCE } from "./audiences";
import type {
  ContentBlock,
  CurriculumModule,
  CurriculumProgram,
  MastermindCycle,
  MastermindSession,
} from "./types";

const mastermind = (
  day: number,
  slug: string,
  title: string,
  focus: string,
  openingQuestion: string,
  teachingPoint: string,
  example: string,
  drill: string,
  floorChallenge: string,
  managerObserves: readonly string[],
  closeQuestion: string
): MastermindSession => ({
  day,
  slug,
  title,
  focus,
  openingQuestion,
  teachingPoint,
  example,
  drill,
  floorChallenge,
  managerObserves,
  closeQuestion,
});

const hospitalitySessions = [
  mastermind(1, "hospitality-meaning", "What Hospitality Actually Means", "Intention, not generic niceness", "What is the difference between being nice and creating hospitality?", "Niceness is a pleasant attitude. Hospitality notices something specific and improves another person's experience because of it.", "A warm welcome becomes hospitality when the teammate also notices an accessibility need, makes space, and lets the guest settle.", "Name one polite action and upgrade it into an intentional hospitality action.", "Make one guest or coworker feel specifically seen.", ["Specific clues noticed", "Action is personal rather than performative"], "Who felt specifically seen because of something we did?"),
  mastermind(2, "anticipation", "Anticipation", "Solve the next need before the ask", "What can we solve tonight before someone asks?", "Anticipation reads timing, body language, table context, and the predictable next need; it is not mind reading.", "A family organizing bags while food arrives gets extra space and napkins before the first spill.", "Call out three guest clues; name the most useful next action for each.", "Create one anticipated-need moment in every section.", ["Cue seen but ignored", "Help arrives at a useful time"], "What did we solve before the guest had to ask?"),
  mastermind(3, "coworker-hospitality", "Coworker Hospitality", "Give the team the care we promise guests", "Would we tolerate ourselves treating a guest the way we sometimes treat each other?", "Hospitality moves in every direction. Useful, unrequested help protects the guest without creating debt or scorekeeping.", "Run another section's food before it dies in the window.", "Name one unrequested assist your position can give another position.", "Complete one unrequested assist that actually helps.", ["No sarcasm or scorekeeping", "Employee still owns normal responsibilities"], "Who made someone else's shift easier, and how?"),
  mastermind(4, "five-foot-mentality", "The Five-Foot Mentality", "Own the condition around you", "What problems exist because people walk past them?", "Your title does not shrink your awareness. Improve what is unsafe, confusing, dirty, delayed, or emotionally unattended in your immediate environment.", "A leader heading to the office fixes the crooked chair, empty glass, and confused guest that enter their five feet.", "Scan the room for ten seconds and name the first useful improvement.", "Fix or connect every obvious issue that enters your five feet.", ["Repeated walk-bys", "Problems named without action or transfer"], "What did you fix simply because it entered your five feet?"),
  mastermind(5, "names", "Names", "Use recognition naturally", "What happens when somebody remembers your name?", "A name tells someone they are not interchangeable. Use it naturally and accurately; recognition is not a forced script.", "Jordan, can you run this to 24? Thank you - instead of a vague call to the room.", "Learn one useful detail from someone whose name or role you know least.", "Learn and naturally use two names you do not normally use.", ["Warmth and accuracy", "Names are not used only for correction"], "Whose name did you learn or use differently?"),
  mastermind(6, "read-the-guest", "Reading the Guest", "Match the style of service to the table", "Does every table want the same style of service?", "Consistent care does not require identical delivery. Read verbal cues, eye contact, pace, occasion, and engagement.", "A quiet conversation may need precise, low-interruption service; a celebratory group may welcome energy and guidance.", "Act out two table styles; choose an opening approach and explain the cue.", "Identify each table's preferred service style and match it.", ["Over-talking or disappearing", "Quiet guests still receive attention"], "Which table needed a different version of you?"),
  mastermind(7, "remove-friction", "Removing Friction", "Eliminate tiny inconveniences", "What small inconvenience can we eliminate tonight?", "Friction makes the guest or team work harder: missing items, late information, repeated questions, clutter, or awkward timing.", "A guest with a deadline receives realistic menu guidance, kitchen communication, and a prepared check before anxiety builds.", "Name one friction point at arrival, ordering, dining, payment, and departure; choose one to remove.", "Remove one friction point and tell the manager what changed.", ["Recurring confusion", "Workarounds that should become systems"], "What became easier because we noticed it?"),
  mastermind(8, "pace", "Pace", "Use timing as a form of care", "Can great hospitality feel bad if the timing is wrong?", "Observe before approaching. Good pace balances attentiveness with space and anticipates the table's next transition.", "Let the guest take two bites before a specific check-back while a correction is still possible.", "Choose approach now, wait, or prepare silently for three table moments.", "Pause and read before every non-routine approach.", ["Autopilot check-backs", "Hovering or long disappearances"], "Where did better timing improve an interaction?"),
  mastermind(9, "personalization", "Personalization", "Use the clue already offered", "What clue has the guest already given us?", "Personalization uses a shared occasion, preference, time constraint, or prior visit to shape one appropriate part of the experience.", "A guest who loved a bright, not-too-sweet margarita receives a relevant current recommendation instead of the whole menu again.", "Use one guest clue to create a natural follow-through that does not feel invasive.", "Use one real guest detail to personalize an experience.", ["Relevant and restrained", "Does not feel like surveillance or a sales trick"], "What detail made an experience feel less generic?"),
  mastermind(10, "hospitality-story", "Hospitality Story", "Turn great moments into culture", "What did someone do during this cycle that deserves to be copied?", "Specific recognition names the clue, the action, and why it mattered so the whole room can repeat it.", "Not 'Sam crushed it'; name the ferry-time clue, the pacing action, and the stress it removed.", "Tell one 30-second story: what was noticed, what was done, and why it mattered.", "Create one final hospitality moment worth telling tomorrow.", ["Specific behavior", "Missing details are requested"], "Which behavior should become part of every shift?"),
] as const;

const passionSessions = [
  mastermind(1, "beyond-good", "Beyond 'It's Good'", "Describe why an item matters", "Can you recommend a favorite without good, amazing, or delicious?", "Generic praise gives no decision help. Explain what makes the item distinctive, who it fits, and the experience to expect.", "Describe Yuca Poppers through the crisp shell, soft savory center, bright guacamole, and easy-to-share fit.", "Give a 20-second current-menu recommendation without generic praise or an ingredient dump.", "Use one sensory detail and a point of view with a guest.", ["Truth and specificity", "Description helps the decision"], "Which description made a guest more confident?"),
  mastermind(2, "sell-through-contrast", "Sell Through Contrast", "Set expectations with accurate contrast", "What becomes clearer when you explain what an item is not?", "Truthful contrast makes style and fit understandable without insulting the item.", "Hang 10 is bright, citrus-forward, and clean rather than a sugary frozen margarita.", "Describe one food and one drink using a truthful contrast.", "Use one contrast statement in a real recommendation.", ["Contrast stays positive", "No false or stale claims"], "What expectation did contrast help set?"),
  mastermind(3, "ask-before-recommending", "Ask Before Recommending", "Earn the right to guide", "What is the smallest useful question you can ask?", "One efficient preference question prevents menu dumping and makes the recommendation relevant.", "Are you leaning bright and refreshing or smoky and spicy?", "A guest gives a vague request; ask one question before choosing a direction.", "Ask a useful preference question before three recommendations.", ["Question is efficient", "Answer actually shapes the choice"], "Which question produced the best recommendation?"),
  mastermind(4, "open-the-experience", "Open the Experience", "Create curiosity before taking orders", "How can an opening recommendation feel like care instead of an add-on?", "A relevant opening direction helps the table picture the experience; it is not a memorized appetizer pitch.", "For a first-time sharing table, explain street-taco size and offer one current shareable before mains.", "Create two natural openings for different guest profiles.", "Use one guided opening recommendation before taking the order.", ["No monologue", "Direction fits the table"], "Did the opening create curiosity or just add cost?"),
  mastermind(5, "take-a-position", "Take a Position", "Reduce uncertainty with confidence", "Why does 'either one is good' fail the guest?", "After learning the preference, choose a direction and explain why. Confidence should come from fit and current knowledge.", "For what you described, I would choose the Jerk Shrimp Tacos.", "Respond to two preferences with one recommendation and one reason.", "Use 'For what you described...' in one real interaction.", ["Recommendation fits", "No promise that the guest must love it"], "Where did taking a position make the decision easier?"),
  mastermind(6, "texture-sells", "Texture Sells", "Make the bite understandable", "Which texture word helps someone picture the food?", "Texture often gives more useful information than a list of ingredients.", "Yuca Poppers: crisp outside, soft and savory in the center, with creamy guacamole and bright sauces.", "Describe one current item through texture in one sentence.", "Use one texture-led description with a guest.", ["Sensory accuracy", "Concise, current description"], "Which texture word helped a guest decide?"),
  mastermind(7, "describe-experience", "Describe the Experience", "Sell the feeling, not the inventory", "Can you describe an item without listing every ingredient?", "Translate the build into the way it eats or drinks: bright, filling, crisp, smoky, shareable, tropical, or refreshing.", "The Zuma Beach Bowl eats fresh and filling at the same time, with vegetables, quinoa, and crunch.", "Describe one food without naming an ingredient.", "Give one experience-led description.", ["No empty adjectives", "No overpromise"], "What experience did you help a guest picture?"),
  mastermind(8, "pair-with-purpose", "Pair With Purpose", "Explain why two choices work together", "What makes a pairing useful rather than automatic?", "A pairing needs a reason connected to flavor, texture, heat, richness, or refreshment.", "Pineapple Basil Smash adds herbal pineapple lift alongside Jerk Shrimp Tacos; Hang 10's lime and salt cut through Yuca Poppers.", "Choose one verified food-and-drink pairing and explain the reason.", "Offer one reasoned pairing after learning the guest's preference.", ["Current, approved items only", "Reason is specific and restrained"], "Which pairing genuinely improved an order?"),
  mastermind(9, "not-hungry", "When They Are Not Hungry", "Right-size the experience", "How do we guide without pushing when appetite is small?", "Respect appetite while still helping. Recommend the right amount, not the largest amount.", "If you want one thing in the middle, I would choose Yuca Poppers; if you want lighter, mix two tacos instead.", "Role-play 'We are not that hungry' with one right-sized recommendation.", "Make one right-sized recommendation without pressure.", ["Respects appetite", "No oversized automatic recommendation"], "Did we respect appetite while still being useful?"),
  mastermind(10, "twenty-second-challenge", "Twenty-Second Challenge", "Combine the full formula", "Can you learn, recommend, and describe in twenty seconds?", "Use Observe, Ask, Interpret, Recommend, Describe naturally and efficiently.", "You said bright and not sweet, so I would go Hang 10. It is citrus-forward, clean, and the salt rim keeps it lively.", "Deliver a 20-second recommendation for a surprise guest profile.", "Deliver your cleanest complete recommendation of the cycle.", ["Preference learned", "Current facts", "Clear point of view", "Human pace"], "Which part of the formula now feels natural?"),
] as const;

const recoverySessions = [
  mastermind(1, "listen-without-interrupting", "Listen Without Interrupting", "Hear the concern beneath the complaint", "What does the guest care about beyond the first sentence?", "Do not prepare a defense while the guest talks. Listen for impact, emotion, expectation, and the outcome they need.", "A complaint about a long wait may also be about feeling forgotten and unable to plan.", "One person speaks for 30 seconds; the listener summarizes without rebuttal.", "Summarize the concern before proposing a solution.", ["No interruption", "Summary captures more than the literal words"], "What did the guest actually care about?"),
  mastermind(2, "apologize-no-excuses", "Apologize Without Excuses", "Acknowledge before explaining", "What makes an apology lower the temperature?", "Apologize for the experience and accept responsibility to care for it; context can wait.", "You should not have waited that long without an update. I am getting one now.", "Rewrite three excuse-first apologies into direct acknowledgment.", "Give any necessary apology before explanation.", ["No 'but'", "Acknowledgment is specific"], "Did the apology lower the temperature?"),
  mastermind(3, "replace-but", "Replace 'But'", "Stay on the guest's team", "What word quietly turns an apology into a debate?", "But often cancels ownership. Replace it with what you can do, what you will verify, and when you will return.", "Instead of 'I am sorry, but that is policy,' say 'Here is what I can do; let me confirm the next step.'", "Rapid-fire replace five recovery 'buts'.", "Catch and replace every recovery 'but'.", ["No blame or policy shield", "Action remains honest"], "Which phrase kept us on the same team?"),
  mastermind(4, "own-the-problem", "Own the Problem", "Walk it to the solution", "When is a handoff actually complete?", "If a problem reaches you, own it until solved or physically and verbally transferred to a named person who accepts it.", "Do not point toward a server; introduce the owner, state the request, receive confirmation, and follow up.", "Practice a warm transfer for three common requests.", "Walk every problem to a person or solution.", ["Named owner", "Confirmation and follow-up"], "Which problem stayed yours until the guest felt closure?"),
  mastermind(5, "ticket-time-recovery", "Ticket-Time Recovery", "Update before frustration spikes", "When should a guest hear about a delay?", "Find aging tickets early, give an accurate update, and keep the table cared for while the item moves.", "You have waited longer than you should have. I am checking the exact status and will return in two minutes.", "Role-play a 30-minute delay with two proactive updates.", "Find one aging ticket early and update before being chased.", ["Accuracy and timing", "No vague promises"], "Where did an update prevent frustration?"),
  mastermind(6, "incorrect-entree", "Incorrect Entrée", "Repair the whole table experience", "Who needs care when one plate is wrong?", "Own the missed item, protect food safety, involve the MOD, and care for the rest of the table while the correction moves.", "Acknowledge the error, remove or manage the item appropriately, set a realistic update, and follow up with everyone affected.", "Run a wrong-item recovery with one guest waiting while others have food.", "Manage both the correction and the table's pace.", ["No blame", "Rest of table is not forgotten"], "Did we repair the table, not only the plate?"),
  mastermind(7, "guest-dislikes-item", "They Simply Do Not Like It", "Separate preference from preparation", "Can a correctly made item still be wrong for this guest?", "Do not debate taste. Ask what missed - sweetness, spice, texture, or style - then guide the replacement from the answer.", "I am sorry this is not landing for you. Is it the sweetness, spice, or overall style?", "Recover without insulting the dish or making the guest wrong.", "Ask one preference question before a replacement recommendation.", ["No defensiveness", "Replacement fits new information"], "Was the issue preparation, expectation, or preference?"),
  mastermind(8, "recovery-follow-up", "The Recovery Follow-Up", "Verify the emotion, not only the transaction", "Why is removing an item from the check not the end?", "Operational action does not prove trust is repaired. Return personally and ask whether the solution actually worked.", "I wanted to come back personally and make sure the replacement is right and that we have truly taken care of this.", "Practice a ten-second follow-up specific to the original concern.", "Follow up on every recovery before departure.", ["Specific, personal follow-up", "Arrives in time to fix another miss"], "Which follow-up proved whether recovery worked?"),
  mastermind(9, "think-beyond-complaint", "Think Beyond the Complaint", "Find the system behind the miss", "If this happened tomorrow, what would we wish we changed tonight?", "After care is restored, capture the standard, owner, trigger, method, verification, and recovery that failed.", "A missed allergy communication requires a full system review, not a reminder to one person.", "Run the six-part System Test on a recent complaint.", "Record one system lesson from a recovery.", ["Root cause is specific", "Action is more than 'remind everyone'"], "What will change so tomorrow's team is less likely to repeat it?"),
  mastermind(10, "last-certification", "Full L.A.S.T. Certification", "Combine care and learning", "Can we stay calm, human, and decisive from first sentence through follow-up?", "The structure lives in the teammate's thinking while the language stays natural: Listen, Apologize, Solve, Think.", "Complete the full model without announcing the acronym's letters.", "Run a surprise 90-second scenario and explain the Think step.", "Use the full model on any real recovery and log evidence.", ["Listening", "Acknowledgment", "Ownership", "Follow-up", "System thinking"], "Which L.A.S.T. step needs another cycle?"),
] as const;

const accountabilitySessions = [
  mastermind(1, "feedback-not-disrespect", "Feedback Is Not Disrespect", "Separate correction from attack", "Why can respectful correction still feel uncomfortable?", "Discomfort is not disrespect. Healthy accountability names behavior, connects it to a shared standard, and requests a reset.", "'Your station has been below standard twice' is coachable; 'You are lazy' attacks identity.", "Convert two labels into neutral observations and clear actions.", "Give one timely behavioral correction without apology or aggression.", ["Tone, privacy, specificity", "Employee knows what to change"], "Did feedback protect the standard and dignity?"),
  mastermind(2, "heard-response", "The 'Heard' Response", "Receive before explaining", "What becomes possible when the first response is Heard?", "Heard signals the standard and action were received. Fix first; give operationally useful context after the reset.", "Heard. Fixed. Can you show me what you want next time so I hit it consistently?", "Receive, fix, then ask one useful clarification without defense.", "Use Heard as the first response to every valid correction.", ["No counter-accusation or résumé speech", "Clarification serves execution"], "Where did clean receiving save time or tension?"),
  mastermind(3, "ten-for-ten", "10 for 10", "Reset drift before it compounds", "What small disorder could become the next bottleneck?", "10 for 10 is a neutral, roughly 30-second return to standard. Anyone can call it; leaders participate and verify.", "10 for 10, bar. Glassware home, trash clear, garnish full - beautiful, that is our standard.", "Create three station misses and complete the reset without blame.", "Use one appropriate reset only if the room actually drifts.", ["Timely, shared, complete", "Released without lingering emotion"], "Did the reset protect the next hour?"),
  mastermind(4, "keep-start-stop", "Keep / Start / Stop", "Make coaching balanced and actionable", "What should continue, begin, and end?", "Keep reinforces behavior worth repeating; Start names a missing action; Stop names behavior creating friction. Never invent praise.", "Keep your table energy. Start checking the pass. Stop walking past food because it is not yours.", "Give a 30-second Keep / Start / Stop for a food-running miss.", "Use the framework once and confirm the reset.", ["Behavior, not personality", "One clear action per category"], "What is now easier to repeat or change?"),
  mastermind(5, "behavior-not-identity", "Behavior, Not Identity", "Remove labels from coaching", "Can a person act carelessly without being a careless person?", "Coach what can be observed and changed. Identity labels create shame and argument; behavior creates a path forward.", "You argued before acknowledging two corrections is usable; your attitude sucks is not.", "Rewrite five labels as observation, standard, and next action.", "Catch every personality label before it leaves your mouth.", ["No always, never, lazy, careless", "Evidence is quotable"], "What exact behavior needs to change?"),
  mastermind(6, "challenge-up", "Challenge Up Respectfully", "Protect the standard across titles", "How can someone challenge a leader without a power contest?", "Challenge upward with timely facts, appropriate privacy, and the shared outcome. Leaders reward the courage they request.", "I may be missing context, but the allergy item moved without verification. Can we pause and confirm?", "Team member challenges a manager; manager receives with Heard. Thank you.", "Raise one legitimate concern directly to the correct person.", ["Safety, facts, timing, tone", "No retaliation or dismissal"], "How did leadership respond when the standard moved upward?"),
  mastermind(7, "coach-a-peer", "Coach a Peer", "Share ownership without acting like a boss", "What makes peer coaching helpful instead of controlling?", "Peer accountability is brief, factual, and anchored in the shared standard. Transfer formal issues rather than escalating conflict.", "We have food sitting and both of us are clear. Can you grab 31 while I take 28?", "Practice one peer reset and one escalation after refusal.", "Protect one standard with clean peer language.", ["No bossy tone or embarrassment", "Formal conflict transfers appropriately"], "Where did peer accountability help without drama?"),
  mastermind(8, "receive-from-anyone", "Receive Feedback From Anyone", "Let the best information win", "What does a junior employee learn when a leader gets defensive?", "Titles do not create immunity. Thank the person, check the standard, correct, and follow up.", "A new host catches an expired restroom check; the manager says Heard, fixes it, and recognizes the catch.", "The junior person gives a correction; the leader practices receiving and acting.", "Invite one piece of upward feedback and do not explain first.", ["No power signals or dismissal", "Behavior actually changes"], "What did someone see that leadership needed to hear?"),
  mastermind(9, "correct-without-embarrassment", "Correct Without Embarrassment", "Choose the right audience and moment", "When should correction be public, and when private?", "Correct risk immediately; protect dignity. A short public safety cue may be necessary, while deeper coaching usually belongs in private.", "At the pass: Allergy hold - verify now. In private later: observation, standard, risk, and next rep.", "Sort five scenarios into immediate cue, private coach, or formal follow-up.", "Use the smallest audience that can safely correct the issue.", ["No sarcasm or public lecture", "Safety corrections are not delayed"], "Did correction preserve the standard and ability to recover?"),
  mastermind(10, "accountability-reflection", "Accountability Reflection", "Make clean feedback cultural", "What accountability behavior should this team keep, start, and stop?", "No-ego culture means feedback travels quickly in every direction and people recover fast. Vocabulary alone is not proof.", "Keep clean resets. Start recognizing people who receive well. Stop debating before fixing.", "Complete a team Keep / Start / Stop about feedback.", "Demonstrate the cleanest receive-and-reset behavior of the cycle.", ["Standards protected", "Fear or ego still slowing action"], "What will prove two weeks from now that accountability changed?"),
] as const;

export const MASTERMIND_CYCLES = [
  {
    id: "mastermind-hospitality",
    slug: "unconditional-hospitality",
    title: "Cycle 1 - Unconditional Hospitality",
    behaviorFamily: "Awareness, anticipation, and care",
    standard: "Name the behavior in pre-shift, observe it during service, coach or reinforce it live, and close the loop after the shift.",
    sessions: hospitalitySessions,
  },
  {
    id: "mastermind-passion-selling",
    slug: "passion-selling",
    title: "Cycle 2 - Passion Selling",
    behaviorFamily: "Confident, personal recommendations",
    standard: "Use current sources and the full Observe > Ask > Interpret > Recommend > Describe formula without pressure or invention.",
    sessions: passionSessions,
  },
  {
    id: "mastermind-last",
    slug: "last-recovery",
    title: "Cycle 3 - L.A.S.T. Recovery",
    behaviorFamily: "Guest recovery and system learning",
    standard: "Care for the guest first, own the problem through follow-up, then improve the system behind the miss.",
    sessions: recoverySessions,
  },
  {
    id: "mastermind-accountability",
    slug: "accountability-without-ego",
    title: "Cycle 4 - Accountability Without Ego",
    behaviorFamily: "Direct feedback that protects people and standards",
    standard: "Coach observable behavior, receive with Heard, create the next rep, and verify the reset without humiliation or theater.",
    sessions: accountabilitySessions,
  },
] as const satisfies readonly MastermindCycle[];

export const MASTERMIND_SESSION_COUNT = MASTERMIND_CYCLES.reduce(
  (total, cycle) => total + cycle.sessions.length,
  0
);

const sessionBlocks = (session: MastermindSession): readonly ContentBlock[] => [
  {
    type: "callout",
    title: `Day ${session.day}: ${session.title}`,
    body: `${session.focus}. ${session.teachingPoint} Example: ${session.example}`,
    tone: "sand",
  },
  {
    type: "practice",
    title: `Five-minute drill - ${session.title}`,
    prompt: `${session.openingQuestion} ${session.drill}`,
    successCriteria: session.managerObserves,
  },
  {
    type: "field-assignment",
    title: "Today's floor challenge",
    prompt: session.floorChallenge,
    successCriteria: [...session.managerObserves, `Close with: ${session.closeQuestion}`],
  },
];

export const MASTERMIND_MODULES: readonly CurriculumModule[] = MASTERMIND_CYCLES.map(
  (cycle, index) => ({
    id: `cur-mastermind-${cycle.slug}`,
    slug: `mastermind-${cycle.slug}`,
    title: cycle.title,
    summary: `${cycle.behaviorFamily}. Ten shifts, one five-minute behavior rep per shift.`,
    audience: LEADERSHIP_AUDIENCE,
    estimatedMinutes: 50,
    outcomes: [
      "Run all ten pre-shift sessions in sequence.",
      "Observe and coach each day's behavior during live service.",
      "Repeat a day when behavior has not transferred to the floor.",
    ],
    ...(index > 0 ? { prerequisites: [`cur-mastermind-${MASTERMIND_CYCLES[index - 1].slug}`] } : {}),
    tags: ["daily-mastermind", `cycle-${index + 1}`, "leadership", "floor-training"],
    sourceIds: ["leadership-os-1", "hospitality-reset-2026-08"],
    content: [
      { type: "standard", title: "Cycle standard", body: cycle.standard, tone: "orange" },
      ...cycle.sessions.flatMap(sessionBlocks),
    ],
    assessment: {
      passingScore: 100,
      retryLimit: 0,
      practicalRequired: true,
      questions: [
        {
          id: `mastermind-${cycle.slug}-reflection`,
          type: "short-answer",
          prompt: "Name the behavior that changed, the floor evidence, and the behavior that still needs another cycle.",
          rubric: ["Specific behavior", "Live evidence", "No attendance-as-proof", "Next reinforcement named"],
        },
        {
          id: `mastermind-${cycle.slug}-practical`,
          type: "practical",
          prompt: "Deliver one surprise day from the cycle and show how it will be observed and reinforced during service.",
          rubric: ["One idea", "One example", "Real rep", "Floor challenge", "Observation", "End-of-shift close"],
        },
      ],
    },
  })
);

export const MASTERMIND_PROGRAM = {
  id: "program-daily-masterminds",
  slug: "daily-masterminds",
  title: "Daily Masterminds",
  summary: "One behavior. Repeated. Coached live. Reinforced after the shift.",
  audience: LEADERSHIP_AUDIENCE,
  version: "2.0",
  effectiveDate: "2026-08-23",
  moduleIntervalDays: 14,
  moduleIds: MASTERMIND_MODULES.map((module) => module.id),
  completionRule: "manager-assigned",
  certification: {
    knowledgeScore: 100,
    practicalRequired: true,
    liveObservationRequired: true,
    auditDays: [14, 30],
  },
} as const satisfies CurriculumProgram;
