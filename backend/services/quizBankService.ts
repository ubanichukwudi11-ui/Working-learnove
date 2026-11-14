import { Type } from "@google/genai";
import { ai, GEMINI_MODELS } from "@backend/ai/geminiClient";
import type { TopicQuizQuestion } from "./lmsTypes";

export interface TimedCbtPack {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  examBody: "WAEC" | "JAMB UTME" | "NECO";
  durationMinutes: number;
  questions: TopicQuizQuestion[];
}

export const CURRICULUM_QUIZ_BANK: TopicQuizQuestion[] = [
  // Quadratic Equations (top-math-t2-quadratics)
  {
    id: "q-quad-1",
    subjectId: "sub-math",
    topicId: "top-math-t2-quadratics",
    examTag: "WAEC",
    prompt: "Find the roots of the quadratic equation 2x^2 - 5x - 3 = 0.",
    options: ["x = 3 or x = -1/2", "x = -3 or x = 1/2", "x = 3 or x = 1/2", "x = -2 or x = 3/2"],
    correctAnswer: "x = 3 or x = -1/2",
    explanation: "Factorising gives (2x + 1)(x - 3) = 0, hence x = -1/2 or x = 3.",
  },
  {
    id: "q-quad-2",
    subjectId: "sub-math",
    topicId: "top-math-t2-quadratics",
    examTag: "JAMB",
    prompt: "For what positive value of k does x^2 + kx + 9 = 0 have equal (repeated) roots?",
    options: ["3", "6", "9", "18"],
    correctAnswer: "6",
    explanation: "For equal roots, discriminant b^2 - 4ac = 0 => k^2 - 4(1)(9) = 0 => k^2 = 36 => k = 6.",
  },
  {
    id: "q-quad-3",
    subjectId: "sub-math",
    topicId: "top-math-t2-quadratics",
    examTag: "WAEC",
    prompt: "If alpha and beta are roots of 3x^2 - 6x + 2 = 0, what is alpha + beta?",
    options: ["2", "-2", "2/3", "-6"],
    correctAnswer: "2",
    explanation: "Sum of roots alpha + beta = -b/a = -(-6)/3 = 2.",
  },
  {
    id: "q-quad-4",
    subjectId: "sub-math",
    topicId: "top-math-t2-quadratics",
    examTag: "NECO",
    prompt: "What is the value of the discriminant for 2x^2 + 3x + 5 = 0?",
    options: ["-31", "31", "49", "-11"],
    correctAnswer: "-31",
    explanation: "D = b^2 - 4ac = 3^2 - 4(2)(5) = 9 - 40 = -31 (no real roots).",
  },
  {
    id: "q-quad-5",
    subjectId: "sub-math",
    topicId: "top-math-t2-quadratics",
    examTag: "JAMB",
    prompt: "Form the quadratic equation whose roots are 4 and -3.",
    options: ["x^2 - x - 12 = 0", "x^2 + x - 12 = 0", "x^2 - 7x + 12 = 0", "x^2 - x + 12 = 0"],
    correctAnswer: "x^2 - x - 12 = 0",
    explanation: "(x - 4)(x + 3) = x^2 - x - 12 = 0.",
  },

  // Logarithms & Indices (top-math-t1-indices)
  {
    id: "q-ind-1",
    subjectId: "sub-math",
    topicId: "top-math-t1-indices",
    examTag: "WAEC",
    prompt: "Simplify 27^(2/3) * 9^(-1/2).",
    options: ["3", "9", "1/3", "27"],
    correctAnswer: "3",
    explanation: "27^(2/3) = 3^2 = 9, and 9^(-1/2) = 1/3. Product = 9 * 1/3 = 3.",
  },
  {
    id: "q-ind-2",
    subjectId: "sub-math",
    topicId: "top-math-t1-indices",
    examTag: "JAMB",
    prompt: "Solve for x if 2^(2x - 1) = 16.",
    options: ["2.5", "2", "1.5", "3"],
    correctAnswer: "2.5",
    explanation: "16 = 2^4 => 2x - 1 = 4 => 2x = 5 => x = 2.5.",
  },
  {
    id: "q-ind-3",
    subjectId: "sub-math",
    topicId: "top-math-t1-indices",
    examTag: "WAEC",
    prompt: "Evaluate (64/27)^(-2/3).",
    options: ["9/16", "16/9", "4/3", "3/4"],
    correctAnswer: "9/16",
    explanation: "(64/27)^(-2/3) = (27/64)^(2/3) = (3/4)^2 = 9/16.",
  },
  {
    id: "q-ind-4",
    subjectId: "sub-math",
    topicId: "top-math-t1-indices",
    examTag: "NECO",
    prompt: "Express 0.00045 in standard form.",
    options: ["4.5 x 10^-4", "4.5 x 10^-3", "45 x 10^-5", "4.5 x 10^4"],
    correctAnswer: "4.5 x 10^-4",
    explanation: "Moving the decimal point 4 places to the right gives 4.5 x 10^-4.",
  },

  // Trigonometry (top-math-t2-trig)
  {
    id: "q-trig-1",
    subjectId: "sub-math",
    topicId: "top-math-t2-trig",
    examTag: "WAEC",
    prompt: "In a right-angled triangle ABC with angle C = 90°, if sin A = 3/5, find cos A.",
    options: ["4/5", "3/4", "5/4", "2/5"],
    correctAnswer: "4/5",
    explanation: "By Pythagoras 3-4-5 triple, adjacent side = 4, so cos A = 4/5.",
  },
  {
    id: "q-trig-2",
    subjectId: "sub-math",
    topicId: "top-math-t2-trig",
    examTag: "JAMB",
    prompt: "The bearing of town Q from town P is 065°. What is the bearing of P from Q?",
    options: ["245°", "115°", "295°", "155°"],
    correctAnswer: "245°",
    explanation: "Back bearing = 065° + 180° = 245°.",
  },
  {
    id: "q-trig-3",
    subjectId: "sub-math",
    topicId: "top-math-t2-trig",
    examTag: "WAEC",
    prompt: "Which formula correctly states the Cosine Rule for side a in triangle ABC?",
    options: [
      "a^2 = b^2 + c^2 - 2bc cos A",
      "a^2 = b^2 + c^2 + 2bc cos A",
      "a / cos A = b / cos B",
      "a^2 = b^2 - c^2 - 2bc sin A",
    ],
    correctAnswer: "a^2 = b^2 + c^2 - 2bc cos A",
    explanation: "Standard Cosine Rule: a^2 = b^2 + c^2 - 2bc cos A.",
  },

  // Physics: Newton's Laws (top-phy-t2-motion)
  {
    id: "q-phy-1",
    subjectId: "sub-phy",
    topicId: "top-phy-t2-motion",
    examTag: "WAEC",
    prompt: "A 4 kg trolley moving at 6 m/s collides and sticks to a stationary 2 kg trolley. Find their common velocity.",
    options: ["4 m/s", "3 m/s", "6 m/s", "2 m/s"],
    correctAnswer: "4 m/s",
    explanation: "Momentum conserved: (4)(6) + (2)(0) = (4 + 2)v => 24 = 6v => v = 4 m/s.",
  },
  {
    id: "q-phy-2",
    subjectId: "sub-phy",
    topicId: "top-phy-t2-motion",
    examTag: "JAMB",
    prompt: "What is the SI unit of impulse?",
    options: ["N·s (or kg·m/s)", "Joule", "Watt", "N/m^2"],
    correctAnswer: "N·s (or kg·m/s)",
    explanation: "Impulse = Force × time = change in momentum, measured in N·s or kg·m/s.",
  },
  {
    id: "q-phy-3",
    subjectId: "sub-phy",
    topicId: "top-phy-t2-motion",
    examTag: "WAEC",
    prompt: "Calculate the net force required to accelerate a 1,200 kg car from rest to 20 m/s in 8 seconds.",
    options: ["3,000 N", "2,400 N", "4,800 N", "1,500 N"],
    correctAnswer: "3,000 N",
    explanation: "a = (20 - 0)/8 = 2.5 m/s^2. F = ma = 1200 × 2.5 = 3,000 N.",
  },
  {
    id: "q-phy-4",
    subjectId: "sub-phy",
    topicId: "top-phy-t2-motion",
    examTag: "NECO",
    prompt: "Which of Newton's laws explains why passengers jerk forward when a bus brakes suddenly?",
    options: [
      "First Law (Inertia)",
      "Second Law (F = ma)",
      "Third Law (Action-Reaction)",
      "Law of Universal Gravitation",
    ],
    correctAnswer: "First Law (Inertia)",
    explanation: "Newton's First Law states a body continues in uniform motion unless acted on by an external net force.",
  },

  // Physics: Waves & Optics (top-phy-t2-waves)
  {
    id: "q-phy-w1",
    subjectId: "sub-phy",
    topicId: "top-phy-t2-waves",
    examTag: "JAMB",
    prompt: "A wave has frequency 500 Hz and wavelength 0.68 m. Calculate its speed.",
    options: ["340 m/s", "735 m/s", "170 m/s", "680 m/s"],
    correctAnswer: "340 m/s",
    explanation: "Wave velocity v = f × λ = 500 × 0.68 = 340 m/s.",
  },
  {
    id: "q-phy-w2",
    subjectId: "sub-phy",
    topicId: "top-phy-t2-waves",
    examTag: "WAEC",
    prompt: "Snell's law of refraction relates angles of incidence (i) and refraction (r) as:",
    options: [
      "sin i / sin r = constant (n)",
      "cos i / cos r = constant",
      "i × r = constant",
      "tan i + tan r = 1",
    ],
    correctAnswer: "sin i / sin r = constant (n)",
    explanation: "Refractive index n = sin(i) / sin(r) for two given media.",
  },

  // Biology: Genetics (top-bio-t2-genetics)
  {
    id: "q-bio-1",
    subjectId: "sub-bio",
    topicId: "top-bio-t2-genetics",
    examTag: "WAEC",
    prompt: "When two heterozygous tall pea plants (Tt × Tt) are crossed, what is the expected phenotypic ratio?",
    options: ["3 Tall : 1 Short", "1 Tall : 1 Short", "2 Tall : 1 Short", "100% Tall"],
    correctAnswer: "3 Tall : 1 Short",
    explanation: "Tt × Tt yields genotypes TT, Tt, Tt, tt -> 3 Tall : 1 Short.",
  },
  {
    id: "q-bio-2",
    subjectId: "sub-bio",
    topicId: "top-bio-t2-genetics",
    examTag: "JAMB",
    prompt: "If both parents carry the sickle-cell trait (genotype AS × AS), what is the probability of having a child with SS?",
    options: ["25% (1 in 4)", "50% (1 in 2)", "75% (3 in 4)", "0%"],
    correctAnswer: "25% (1 in 4)",
    explanation: "AS × AS produces 1 AA : 2 AS : 1 SS, giving a 25% probability of SS.",
  },
  {
    id: "q-bio-3",
    subjectId: "sub-bio",
    topicId: "top-bio-t2-genetics",
    examTag: "WAEC",
    prompt: "What term describes the observable physical traits of an organism resulting from its genes?",
    options: ["Phenotype", "Genotype", "Allele", "Locus"],
    correctAnswer: "Phenotype",
    explanation: "Phenotype refers to expressed physical or biochemical characteristics.",
  },

  // Chemistry: Stoichiometry (top-chem-t2-stoich)
  {
    id: "q-chem-1",
    subjectId: "sub-chem",
    topicId: "top-chem-t2-stoich",
    examTag: "WAEC",
    prompt: "How many moles are present in 20 g of NaOH? (Na=23, O=16, H=1)",
    options: ["0.50 mol", "1.00 mol", "0.25 mol", "2.00 mol"],
    correctAnswer: "0.50 mol",
    explanation: "Molar mass of NaOH = 23 + 16 + 1 = 40 g/mol. Moles = 20 / 40 = 0.50 mol.",
  },
  {
    id: "q-chem-2",
    subjectId: "sub-chem",
    topicId: "top-chem-t2-stoich",
    examTag: "JAMB",
    prompt: "What volume does 2 moles of oxygen gas occupy at STP? (Molar volume = 22.4 dm^3)",
    options: ["44.8 dm^3", "22.4 dm^3", "11.2 dm^3", "67.2 dm^3"],
    correctAnswer: "44.8 dm^3",
    explanation: "At STP, volume = n × 22.4 dm^3 = 2 × 22.4 = 44.8 dm^3.",
  },
  {
    id: "q-chem-3",
    subjectId: "sub-chem",
    topicId: "top-chem-t2-stoich",
    examTag: "WAEC",
    prompt: "During acid-base titration, concordant burette readings should fall within:",
    options: ["±0.20 cm^3", "±2.00 cm^3", "±5.00 cm^3", "±1.50 cm^3"],
    correctAnswer: "±0.20 cm^3",
    explanation: "WAEC volumetric analysis requires concordant titres within ±0.20 cm^3.",
  },

  // English Language (top-eng-t2-essay)
  {
    id: "q-eng-1",
    subjectId: "sub-eng",
    topicId: "top-eng-t2-essay",
    examTag: "WAEC",
    prompt: "Which complimentary close is required at the end of a formal letter addressed to a Principal or Commissioner?",
    options: ["Yours faithfully,", "Yours sincerely,", "Best wishes,", "Your lovely student,"],
    correctAnswer: "Yours faithfully,",
    explanation: "Formal letters in WAEC require 'Yours faithfully,' followed by signature and full name.",
  },
  {
    id: "q-eng-2",
    subjectId: "sub-eng",
    topicId: "top-eng-t2-essay",
    examTag: "JAMB",
    prompt: "Identify the sentence with correct subject-verb concord:",
    options: [
      "Neither the teacher nor the students were late.",
      "Neither the teacher nor the students was late.",
      "Each of the prefects were awarded.",
      "The committee have differing opinions today.",
    ],
    correctAnswer: "Neither the teacher nor the students were late.",
    explanation: "By the rule of proximity with 'neither...nor', the verb agrees with 'students' (plural).",
  },
  {
    id: "q-eng-3",
    subjectId: "sub-eng",
    topicId: "top-eng-t2-essay",
    examTag: "WAEC",
    prompt: "In WAEC Essay Marking, which section carries the highest mark allocation (20/50)?",
    options: ["Expression", "Content", "Organisation", "Mechanical Accuracy"],
    correctAnswer: "Expression",
    explanation: "WAEC 50-mark rubric allocates Content (10), Organisation (10), Expression (20), Mechanical Accuracy (10).",
  },
];

export const TIMED_CBT_PACKS: TimedCbtPack[] = [
  {
    id: "cbt-waec-math",
    title: "WAEC SS2/SS3 Mathematics Objective Drill",
    subjectId: "sub-math",
    subjectName: "Mathematics",
    examBody: "WAEC",
    durationMinutes: 10,
    questions: CURRICULUM_QUIZ_BANK.filter((q) => q.subjectId === "sub-math").slice(0, 8),
  },
  {
    id: "cbt-jamb-phy",
    title: "JAMB UTME Physics Mechanics & Waves Mock",
    subjectId: "sub-phy",
    subjectName: "Physics",
    examBody: "JAMB UTME",
    durationMinutes: 8,
    questions: CURRICULUM_QUIZ_BANK.filter((q) => q.subjectId === "sub-phy"),
  },
  {
    id: "cbt-waec-science-combo",
    title: "Combined Science Sprint (Bio, Chem & English)",
    subjectId: "sub-bio",
    subjectName: "Biology / Chemistry / English",
    examBody: "NECO",
    durationMinutes: 12,
    questions: CURRICULUM_QUIZ_BANK.filter(
      (q) =>
        q.subjectId === "sub-bio" ||
        q.subjectId === "sub-chem" ||
        q.subjectId === "sub-eng"
    ),
  },
];

export function getTopicQuizQuestions(
  topicId?: string | null,
  subjectId?: string | null
): TopicQuizQuestion[] {
  if (topicId) {
    const exact = CURRICULUM_QUIZ_BANK.filter((q) => q.topicId === topicId);
    if (exact.length > 0) return exact;
  }
  if (subjectId) {
    const subMatch = CURRICULUM_QUIZ_BANK.filter((q) => q.subjectId === subjectId);
    if (subMatch.length > 0) return subMatch.slice(0, 5);
  }
  return CURRICULUM_QUIZ_BANK.slice(0, 5);
}

export async function generateTopicQuizWithGemini(input: {
  subjectName: string;
  subjectId: string;
  topicTitle: string;
  topicId?: string;
  topicDescription?: string;
}): Promise<{ questions: TopicQuizQuestion[]; generatedByAi: boolean }> {
  const fallback = getTopicQuizQuestions(input.topicId, input.subjectId);
  if (!process.env.GEMINI_API_KEY) {
    return { questions: fallback, generatedByAi: false };
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODELS.FAST,
      contents: `Generate 4 multiple-choice exam questions aligned with Nigerian WAEC/JAMB SS2-SS3 standards for:
Subject: ${input.subjectName}
Topic: ${input.topicTitle}
Details: ${input.topicDescription || ""}

Each question MUST have exactly 4 concise options, one exact matching correctAnswer string from those 4 options, and a 1-sentence worked explanation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  prompt: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  examTag: { type: Type.STRING },
                },
                required: ["prompt", "options", "correctAnswer", "explanation"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}") as {
      questions?: Array<{
        prompt: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
        examTag?: string;
      }>;
    };

    const valid = (parsed.questions || [])
      .filter(
        (q) =>
          q.prompt &&
          Array.isArray(q.options) &&
          q.options.length >= 4 &&
          q.options.includes(q.correctAnswer)
      )
      .slice(0, 5)
      .map((q, idx) => ({
        id: `ai-quiz-${Date.now()}-${idx}`,
        subjectId: input.subjectId,
        topicId: input.topicId,
        examTag: q.examTag || "WAEC / Nova AI",
        prompt: q.prompt,
        options: q.options.slice(0, 4),
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }));

    if (valid.length >= 2) {
      return { questions: valid, generatedByAi: true };
    }
  } catch (err) {
    console.warn("AI topic quiz generation fell back to bank:", err);
  }

  return { questions: fallback, generatedByAi: false };
}
