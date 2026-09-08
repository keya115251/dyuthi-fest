export type EventCategory = {
  type: "solo" | "group" | "open" | "college";
  teamSize: { min: number | null; max: number | null } | null;
};
export type FestEvent = {
  slug: string;
  title: string;
  name: string;
  hosts: string;
  format: "band-only" | "solo-and-group" | "single";
  categories: EventCategory[] | null;
  eligibility: string;
  prize: string;
  registrationFee?: string;
  rules: string;
  description: string;
  image: string;
  bandSize?: { min: number; max: number };
  submissionFormat?: string;
  selectionCount?: number;
  performanceTime?: string;
  setupTime?: string;
  rulesPdf?: string;
  themeColors?: string[];
  decorImages?: {
    topLeft?: string;
    topRight?: string;
    bottomLeft?: string;
    bottomRight?: string;
  };
  crewSize?: { min: number; max: number };
  competitionCategories?: string[];
  ageGroups?: string[];
  danceForms?: string[];
  maxGroupSize?: number;
  round2Open?: boolean;
};

export const events: FestEvent[] = [
  {
  slug: "battle-of-the-bands",
  title: "Veni, Vidi, Vici.",
  name: "Battle of the Bands",
  hosts: "Chaitanya Geethi x Vaadya",
  format: "band-only",
  categories: null,
  eligibility: "Open to all colleges and schools",
  prize: "₹1,00,000",
  registrationFee: "₹100 for Round 1 entry, ₹400 per head for Round 2 (if selected)",
  rules: "All rock-adjacent genres welcome (fusion, metal, prog, etc).",
  description: "",
  image: "/events/battle-of-the-bands.jpg",
  bandSize: { min: 3, max: 10 },
  submissionFormat: "Online video submission (5–6 min max)",
  selectionCount: 15,
  performanceTime: "20 minutes",
  setupTime: "10 minutes (soundcheck + setup)",
  rulesPdf: "https://docs.google.com/document/d/1B6iVKGZfn49S16MM3c6iV7uI3chS7RWEs4eRv4rEq0c/edit?usp=sharing",
  themeColors: ["#B497CF", "#4d3dff", "#C9A0F5"],
  decorImages: {
    topLeft: "/decor/guitar.png",
    bottomRight: "/decor/drums.png",
  },
  round2Open: false, // flip to true once Round 2 goes live
},
  {
    slug: "hip-hop-dance",
    title: "3T's",
    name: "Hip Hop Dance",
    hosts: "United Dance Crew",
    format: "single",
    categories: null,
    eligibility: "Open to all colleges and schools",
    prize: "₹1,00,000",
    registrationFee: "₹3,115 per crew · ₹899 solo",
    rules: "All Hip-hop and western dance forms.",
    description: "",
    image: "/events/hip-hop-dance.jpg",
    rulesPdf: "https://docs.google.com/document/d/1fFMWl2X3m2FOW3qH_pu6b-o6PYn7GZZsCKQC3VTd--8/edit?usp=sharing",
    performanceTime: "4–8 minutes",
    crewSize: { min: 5, max: 25 },
    competitionCategories: ["Open Crew", "College Crew"],
    themeColors: ["#4d3dff", "#7FB8FF", "#8FE3D9"],
    decorImages: {
      topLeft: "/decor/dancer-side.png",
      bottomRight: "/decor/dancer-freeze.png",
    },
  },
  {
    slug: "classical-dance",
    title: "Aangikam",
    name: "Classical Dance",
    hosts: "Chaitanya Laasya",
    format: "single",
    categories: null,
    eligibility: "Open to all colleges and schools",
    prize: "₹1,00,000",
    registrationFee: "₹850 solo, ₹500 per head (group)",
    rules: "",
    description: "",
    image: "/events/classical-dance.jpg",
    rulesPdf: "https://docs.google.com/document/d/179IfUx-QTLEicf8yTfCkigOg7FtL2MgsEpJnLAeOaPE/edit?usp=sharing",
    performanceTime: "Solo: 4 minutes · Group: 8 minutes",
    ageGroups: ["Junior (up to 10th grade)", "Senior (11th grade onward)"],
    danceForms: [
      "Kuchipudi",
      "Bharatanatyam",
      "Kathak",
      "Kathakali",
      "Mohiniyattam",
      "Odissi",
      "Manipuri",
      "Sattriya",
      "Semi-classical",
      "Fusion",
    ],
    maxGroupSize: 10,
    themeColors: ["#F5C6E0", "#E888C4", "#B497CF"],
    decorImages: {
      bottomLeft: "/decor/ghungroo.png",
      topRight: "/decor/hands.png",
    },
  },
];