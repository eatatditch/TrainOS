export const COMPANY_FACTS = {
  controlledAt: "2026-08-24",
  officialSource: "https://www.eatatditch.com/locations",
  name: "Ditch Kitchen & Surf Bar",
  owner: "Tracy Smith",
  generalEmail: "info@eatatditch.com",
  website: "https://www.eatatditch.com",
  cateringUrl: "https://www.eatatditch.com/catering",
  locations: [
    {
      key: "bay-shore",
      name: "Bay Shore",
      address: "25 Bayview Avenue, Bay Shore, NY 11706",
      phoneDisplay: "631.206.0420",
      phoneDial: "6312060420",
    },
    {
      key: "port-jefferson",
      name: "Port Jefferson",
      address: "140 Main Street, Port Jefferson, NY 11777",
      phoneDisplay: "631.509.0132",
      phoneDial: "6315090132",
    },
  ],
} as const;

export type CompanyFactAnswer = {
  verdict: "info";
  title: string;
  answer: string;
  items: string[];
};

const locationLine = (location: (typeof COMPANY_FACTS.locations)[number]) =>
  `${location.name}: ${location.address} · ${location.phoneDisplay}`;

/** Deterministic answers for volatile operational facts that should not be left
 * to model recall or duplicated as prompt prose. */
export function answerCompanyFactQuestion(
  query: string,
): CompanyFactAnswer | null {
  const normalized = query.toLowerCase();
  const asksOwner = /\b(owner|owns|ownership|tracy)\b/.test(normalized);
  if (asksOwner) {
    return {
      verdict: "info",
      title: "Ditch ownership",
      answer: `${COMPANY_FACTS.owner} is the owner of Ditch.`,
      items: [],
    };
  }

  if (/\b(catering|cater|private\s+(party|event))\b/.test(normalized)) {
    return {
      verdict: "info",
      title: "Catering + private events",
      answer: `Use the official inquiry form at ${COMPANY_FACTS.cateringUrl}. General questions can go to ${COMPANY_FACTS.generalEmail}.`,
      items: [],
    };
  }

  if (/\b(how many|number of|total)\s+locations?\b/.test(normalized)) {
    return {
      verdict: "info",
      title: "Two Ditch locations",
      answer: COMPANY_FACTS.locations.map(locationLine).join(" | "),
      items: [],
    };
  }

  const asksLocationFact =
    /\b(address|phone|number|location|located|directions|where)\b/.test(
      normalized,
    );
  if (asksLocationFact) {
    const portJeff = /\b(port\s*jeff(?:erson)?|pj)\b/.test(normalized);
    const bayShore = /\bbay\s*shore\b/.test(normalized);
    const matches = COMPANY_FACTS.locations.filter((location) =>
      location.key === "port-jefferson" ? portJeff : bayShore,
    );
    const locations = matches.length > 0 ? matches : COMPANY_FACTS.locations;
    return {
      verdict: "info",
      title: locations.length === 1 ? `${locations[0].name} contact` : "Ditch locations",
      answer: locations.map(locationLine).join(" | "),
      items: [],
    };
  }

  if (/\b(email|contact|donat|press|media|partnership|vendor)\b/.test(normalized)) {
    return {
      verdict: "info",
      title: "Ditch contact",
      answer: `Use ${COMPANY_FACTS.generalEmail} for general inquiries. Website: ${COMPANY_FACTS.website}.`,
      items: [],
    };
  }

  return null;
}

export function companyFactsPrompt(): string {
  return [
    `Controlled ${COMPANY_FACTS.controlledAt} from ${COMPANY_FACTS.officialSource}.`,
    `Full name: ${COMPANY_FACTS.name}.`,
    `Owner: ${COMPANY_FACTS.owner}.`,
    `Locations: ${COMPANY_FACTS.locations.map(locationLine).join(" | ")}.`,
    `General contact: ${COMPANY_FACTS.generalEmail}.`,
    `Official website: ${COMPANY_FACTS.website}. Catering form: ${COMPANY_FACTS.cateringUrl}.`,
    "Opening dates and any contact not listed here are not in the controlled record; say you do not have a verified answer instead of guessing.",
  ].join("\n- ");
}
