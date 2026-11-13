export interface SlideItem {
  title: string;
  subtitle: string;
  bullets: string[];
  formula?: string;
}

export interface LiveClassItem {
  id: string;
  title: string;
  topic: string;
  teacher: string;
  teacherAvatar: string;
  hostPoster: string;
  subject: string;
  classLevel: string;
  term: string;
  timeWat: string;
  examFocus: string;
  startTime: string;
  endTime: string;
  studentsCount: number;
  status: "waiting" | "live" | "scheduled" | "ended";
  slides?: SlideItem[];
}

export const DEFAULT_SLIDES_BY_ID: Record<string, SlideItem[]> = {
  "math-001": [
    {
      title: "Quadratic Equations & Parabolas",
      subtitle: "Standard form, factorization, and WAEC curve sketching",
      bullets: [
        "Standard equation: ax² + bx + c = 0 where a ≠ 0",
        "Vertex axis of symmetry occurs at x = -b / (2a)",
        "If a > 0 the curve opens upwards (minimum value); if a < 0 it opens downwards",
      ],
      formula: "x = (-b ± √(b² - 4ac)) / 2a",
    },
    {
      title: "Using the Discriminant (D)",
      subtitle: "Determining root nature without solving fully",
      bullets: [
        "D > 0: Two distinct real roots (cuts x-axis twice)",
        "D = 0: Equal repeated roots (tangent to x-axis)",
        "D < 0: No real roots (does not cross x-axis)",
      ],
      formula: "D = b² - 4ac",
    },
    {
      title: "WAEC Word Problem Modeling",
      subtitle: "Converting area and projectile statements into quadratics",
      bullets: [
        "Define unknown variable clearly with units (cm, m, seconds)",
        "Form equation, simplify to standard form, and factorize",
        "Verify physical validity — reject negative lengths or times",
      ],
      formula: "Area = x(x + 4) = 96  ⇒  x² + 4x - 96 = 0",
    },
  ],
  "science-001": [
    {
      title: "Newton's Laws & Linear Momentum",
      subtitle: "Mechanics, impulse, and conservation principles",
      bullets: [
        "First Law: Inertia resists change in velocity unless acted upon",
        "Second Law: Net force equals rate of change of momentum",
        "Third Law: Action and reaction act on different bodies",
      ],
      formula: "F = Δp / Δt = m(v - u) / t",
    },
    {
      title: "Collisions & Conservation",
      subtitle: "Elastic vs inelastic interactions in JAMB Physics",
      bullets: [
        "Total linear momentum before collision equals total after (isolated system)",
        "Kinetic energy is conserved only in elastic collisions",
        "Impulse equals area under Force–Time graph",
      ],
      formula: "m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂",
    },
  ],
  "chemistry-001": [
    {
      title: "Alkanes, Alkenes & Functional Groups",
      subtitle: "IUPAC nomenclature and homologous series",
      bullets: [
        "Alkanes (CₙH₂ₙ₊₂): Saturated single bonds, substitution reactions",
        "Alkenes (CₙH₂ₙ): Double C=C bond, decolorizes bromine water",
        "Alcohols (-OH) oxidize to alkanoic acids with acidified K₂Cr₂O₇",
      ],
      formula: "CₙH₂ₙ₊₂  |  CₙH₂ₙ  |  CₙH₂ₙ₋₂",
    },
  ],
};

export const liveClasses: LiveClassItem[] = [
  {
    id: "math-001",
    title: "SSS 2 Mathematics — Quadratic Equations",
    topic: "Solving, Vertex Graphing & WAEC Past Questions",
    teacher: "Mrs. Funke Adewale",
    teacherAvatar: "/images/avatar-funke.jpg",
    hostPoster: "/images/teacher-live-poster.jpg",
    subject: "Mathematics",
    classLevel: "SSS 2 Science",
    term: "2025/2026 Session · Second Term",
    timeWat: "08:30 AM – 09:30 AM WAT",
    examFocus: "WAEC & JAMB Core",
    startTime: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 38 * 60 * 1000).toISOString(),
    studentsCount: 24,
    status: "live",
    slides: DEFAULT_SLIDES_BY_ID["math-001"],
  },
  {
    id: "science-001",
    title: "SSS 2 Physics — Motion & Linear Momentum",
    topic: "Newton's Laws, Impulse & Conservation Problems",
    teacher: "Mr. Chinedu Emeka",
    teacherAvatar: "/images/avatar-chinedu.jpg",
    hostPoster: "/images/teacher-live-poster.jpg",
    subject: "Physics",
    classLevel: "SSS 2 Science",
    term: "2025/2026 Session · Second Term",
    timeWat: "10:00 AM – 11:00 AM WAT",
    examFocus: "WAEC & JAMB Science",
    startTime: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
    studentsCount: 18,
    status: "scheduled",
    slides: DEFAULT_SLIDES_BY_ID["science-001"],
  },
  {
    id: "chemistry-001",
    title: "SSS 3 Chemistry — Organic Hydrocarbons",
    topic: "IUPAC Naming, Isomerism & Combustion Reactions",
    teacher: "Dr. Ibrahim Bello",
    teacherAvatar: "/images/avatar-ibrahim.jpg",
    hostPoster: "/images/teacher-live-poster.jpg",
    subject: "Chemistry",
    classLevel: "SSS 3 Intensive",
    term: "2025/2026 Session · Second Term",
    timeWat: "01:00 PM – 02:00 PM WAT",
    examFocus: "NECO & WAEC Practical Prep",
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    studentsCount: 22,
    status: "scheduled",
    slides: DEFAULT_SLIDES_BY_ID["chemistry-001"],
  },
];