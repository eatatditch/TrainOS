import {
  LessonIntro,
  SectionBlock,
  StepBlock,
  CalloutBlock,
  KeyTakeaway,
} from "../blocks";

export function ServerCheckoutContent() {
  return (
    <div className="space-y-2">
      <LessonIntro
        title="Checkout & Payment Procedures"
        subtitle="Handle every transaction accurately, securely, and with professionalism."
        estimatedTime={10}
        tags={["Server", "Required"]}
        whyItMatters="The checkout experience is the last impression you leave. A smooth, fast close-out makes the guest feel taken care of. A fumbled one undoes the whole meal."
      />

      <SectionBlock title="Payment Methods">
        <SectionBlock title="Credit & Debit Cards">
          <p className="text-gray-700 text-sm leading-relaxed">
            The most common payment method. Process promptly and always return
            the card to the correct guest. Never walk away with a card without
            telling the guest you are processing it.
          </p>
        </SectionBlock>

        <SectionBlock title="Cash Payments">
          <p className="text-gray-700 text-sm leading-relaxed">
            Always bring the change back to the table. Never ask &ldquo;Do you
            want change?&rdquo; — this is a forbidden phrase. Count the change
            carefully before returning it to the guest.
          </p>
        </SectionBlock>

        <SectionBlock title="Gift Cards">
          <p className="text-gray-700 text-sm leading-relaxed">
            Swipe gift cards like a credit card in the POS. If the gift card
            does not cover the full balance, ask the guest for a second form of
            payment for the remaining amount. Always return the gift card to the
            guest with the remaining balance printed on the receipt.
          </p>
        </SectionBlock>

        <SectionBlock title="Comps & Voids">
          <p className="text-gray-700 text-sm leading-relaxed">
            Only a manager can authorize comps and voids. Never comp or void an
            item on your own. If a guest has a complaint that warrants a comp,
            get your manager to the table first, then process the comp with
            manager approval in the POS.
          </p>
        </SectionBlock>
      </SectionBlock>

      <SectionBlock title="Checkout Procedure">
        <StepBlock
          steps={[
            {
              title: "Print the Check",
              description:
                "Print the check only when the guest requests it or gives a clear signal they are ready. Never drop the check unsolicited — read the table.",
            },
            {
              title: "Present the Check",
              description:
                "Place the check in a clean presenter with a working pen. Thank the guest for dining with you as you set it down.",
              details: [
                "\"Thank you so much — no rush at all. I'll be right here when you're ready\"",
              ],
            },
            {
              title: "Pick Up Payment Promptly",
              description:
                "Once the guest places their card or cash in the presenter, pick it up within 1 minute. Do not let it sit.",
            },
            {
              title: "Process the Payment",
              description:
                "Process the payment accurately in the POS. For split checks, confirm which items go to which guest before processing.",
              details: [
                "Double-check the amount before swiping or running the card",
                "For splits, confirm the split before processing — not after",
              ],
            },
            {
              title: "Return the Payment",
              description:
                "Bring back the signed receipt, card, and any change within 2 minutes. Thank the guest again and invite them back.",
              details: [
                "\"We hope to see you again soon — have a great night!\"",
                "Make sure the correct card goes back to the correct guest",
              ],
            },
            {
              title: "Pre-Bus the Table",
              description:
                "As the guest is preparing to leave, begin pre-bussing the table. Reset it for the next party as soon as they depart.",
            },
          ]}
        />
      </SectionBlock>

      <CalloutBlock type="warning" title="Cash Handling Rule">
        <p>
          Never count money in view of guests. All cash handling and counting
          must be done at the POS station or in the back. Counting cash at the
          table looks unprofessional and creates a security risk.
        </p>
      </CalloutBlock>

      <CalloutBlock type="important" title="Split Checks">
        <p>
          Always ask at the beginning of the meal if the table would like
          separate checks. Setting up split checks upfront saves time and
          prevents errors at checkout. If they decide to split later, do it
          cheerfully — never show frustration.
        </p>
      </CalloutBlock>

      <KeyTakeaway
        items={[
          "Never ask \"Do you want change?\" — always bring it back",
          "Process payments within 2 minutes of receiving them",
          "Only managers can authorize comps and voids",
          "Never count cash in view of guests",
          "Ask about split checks early — not at the end of the meal",
          "The checkout is your last impression — make it smooth and gracious",
        ]}
      />
    </div>
  );
}
