import type {
  CurriculumTopicRecord,
  VideoLessonMaterialRecord,
  VideoLessonRecord,
} from "./lmsTypes";

export function extractYouTubeVideoId(rawUrl: string): string | null {
  const input = String(rawUrl || "").trim();
  if (!input) return null;

  // Allow plain 11-char video ID directly as convenience
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const normalized = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const url = new URL(normalized);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = url.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;

      const parts = url.pathname.split("/").filter(Boolean);
      if (
        parts.length >= 2 &&
        ["embed", "shorts", "live", "v"].includes(parts[0]) &&
        /^[a-zA-Z0-9_-]{11}$/.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function normalizeVideoSourceInput(input: {
  sourceType?: string;
  videoUrl: string;
}): {
  sourceType: "UPLOADED_VIDEO" | "YOUTUBE" | "EXTERNAL_LINK";
  videoUrl: string;
  youtubeVideoId?: string;
} {
  const rawUrl = String(input.videoUrl || "").trim();
  if (!rawUrl) {
    throw new Error("A video file or YouTube / lesson link is required.");
  }

  if (input.sourceType === "UPLOADED_VIDEO") {
    return {
      sourceType: "UPLOADED_VIDEO",
      videoUrl: rawUrl,
    };
  }

  const ytId = extractYouTubeVideoId(rawUrl);
  if (ytId) {
    return {
      sourceType: "YOUTUBE",
      videoUrl: `https://www.youtube.com/watch?v=${ytId}`,
      youtubeVideoId: ytId,
    };
  }

  if (input.sourceType === "YOUTUBE") {
    throw new Error(
      "Could not recognize a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)."
    );
  }

  // Validate external HTTP/HTTPS/local path
  if (
    !rawUrl.startsWith("/api/") &&
    !/^https?:\/\/.+/i.test(rawUrl)
  ) {
    throw new Error("Please provide a valid YouTube link, uploaded video, or https:// URL.");
  }

  return {
    sourceType: "EXTERNAL_LINK",
    videoUrl: rawUrl,
  };
}

function escapePdfText(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function wrapTextLines(text: string, maxChars = 84): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const trimmed = rawLine.trimEnd();
    if (!trimmed) {
      out.push("");
      continue;
    }
    const words = trimmed.split(/\s+/);
    let current = "";
    for (const word of words) {
      if (!current) {
        current = word;
      } else if (current.length + 1 + word.length <= maxChars) {
        current += " " + word;
      } else {
        out.push(current);
        current = word;
      }
    }
    if (current) out.push(current);
  }
  return out;
}

/**
 * Generates a valid, clean multi-line PDF document buffer for downloadable lesson study sheets.
 */
export function buildSimplePdfBuffer(
  title: string,
  subtitle: string,
  bodyText: string
): Buffer {
  const headerLines = [
    { text: "LEARNOVA DIGITAL ACADEMY · CURRICULUM STUDY MATERIAL", bold: true, size: 10 },
    { text: title, bold: true, size: 15 },
    { text: subtitle, bold: false, size: 10 },
    { text: "--------------------------------------------------------------------------------", bold: false, size: 9 },
  ];

  const wrappedBody = wrapTextLines(bodyText, 86).map((line) => ({
    text: line,
    bold: /^\d+\.|^[A-Z][A-Z\s/&-]{3,}:?$/.test(line.trim()),
    size: 10.5,
  }));

  const allLines = [...headerLines, ...wrappedBody];
  const linesPerPage = 46;
  const pageChunks: Array<typeof allLines> = [];
  for (let i = 0; i < allLines.length; i += linesPerPage) {
    pageChunks.push(allLines.slice(i, i + linesPerPage));
  }
  if (pageChunks.length === 0) pageChunks.push(headerLines);

  // Build PDF objects:
  // 1 = Catalog, 2 = Pages, 3 = F1 (Helvetica), 4 = F2 (Helvetica-Bold), then pairs of (Page, Content)
  const objects: string[] = [];
  const pageObjIds: number[] = [];

  let nextObjId = 5;
  const pageAndContentObjs: Array<{ id: number; body: string }> = [];

  for (const chunk of pageChunks) {
    const pageId = nextObjId++;
    const contentId = nextObjId++;
    pageObjIds.push(pageId);

    const streamOps: string[] = ["BT", "50 755 Td"];
    let yOffset = 0;
    for (const item of chunk) {
      const fontName = item.bold ? "/F2" : "/F1";
      const lineHeight = item.size > 12 ? 20 : 14.5;
      if (yOffset > 0) {
        streamOps.push(`0 -${lineHeight} Td`);
      }
      streamOps.push(`${fontName} ${item.size} Tf`);
      streamOps.push(`(${escapePdfText(item.text)}) Tj`);
      yOffset += lineHeight;
    }
    streamOps.push("ET");
    const streamStr = streamOps.join("\n");

    pageAndContentObjs.push({
      id: pageId,
      body: `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    });
    pageAndContentObjs.push({
      id: contentId,
      body: `<< /Length ${Buffer.byteLength(streamStr, "utf8")} >>\nstream\n${streamStr}\nendstream`,
    });
  }

  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjIds.length} >>`;
  objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  objects[4] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;
  for (const obj of pageAndContentObjs) {
    objects[obj.id] = obj.body;
  }

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = Buffer.byteLength(pdf, "utf8");
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let id = 1; id < objects.length; id++) {
    pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

function makeSeedMaterial(
  videoId: string,
  matId: string,
  title: string,
  type: VideoLessonMaterialRecord["type"],
  fileName: string,
  contentText: string,
  now: string
): VideoLessonMaterialRecord {
  return {
    id: matId,
    title,
    type,
    fileName,
    mimeType: "application/pdf",
    fileSizeBytes: Buffer.byteLength(contentText, "utf8") + 1200,
    url: `/api/lms/videos/materials/download?videoId=${encodeURIComponent(videoId)}&materialId=${encodeURIComponent(matId)}`,
    contentText,
    createdAt: now,
  };
}

export function createInitialVideoCurriculum(): {
  curriculumTopics: CurriculumTopicRecord[];
  videoLessons: VideoLessonRecord[];
} {
  const now = new Date().toISOString();

  const topics: CurriculumTopicRecord[] = [
    {
      id: "top-math-t1-indices",
      subjectId: "sub-math",
      termId: "term-first-2025",
      classLevelId: "lvl-ss2",
      topicOrder: 1,
      weekLabel: "Week 1–2",
      title: "Logarithms & Laws of Indices",
      description:
        "Simplifying fractional and negative indices, standard form, and antilogarithm tables for WAEC calculations.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-math-t2-quadratics",
      subjectId: "sub-math",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 1,
      weekLabel: "Week 1–3",
      title: "Quadratic Equations & Discriminant Methods",
      description:
        "Factorisation, completing the square, quadratic formula, and symmetric roots of WAEC & JAMB past problems.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-math-t2-trig",
      subjectId: "sub-math",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 2,
      weekLabel: "Week 4–6",
      title: "Trigonometric Ratios, Sine & Cosine Rules",
      description:
        "Angles of elevation and depression, bearings, and solving non-right-angled triangles.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-math-t3-stats",
      subjectId: "sub-math",
      termId: "term-third-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 1,
      weekLabel: "Week 1–2",
      title: "Cumulative Frequency Curves (Ogive) & Variance",
      description:
        "Grouped data distributions, median & quartiles estimation from ogives, and standard deviation.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-eng-t2-essay",
      subjectId: "sub-eng",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 1,
      weekLabel: "Week 1–2",
      title: "WAEC Argumentative & Formal Letter Writing",
      description:
        "Structuring openings, paragraph cohesion, tone register, and avoiding mechanical accuracy penalties.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-eng-t2-oral",
      subjectId: "sub-eng",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 2,
      weekLabel: "Week 3–4",
      title: "Oral English: Vowel Contrasts, Stress & Intonation",
      description:
        "Distinguishing minimal pairs, emphatic stress rules, and JAMB Test of Orals patterns.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-phy-t2-motion",
      subjectId: "sub-phy",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 1,
      weekLabel: "Week 1–2",
      title: "Newton's Laws of Motion & Linear Momentum",
      description:
        "Impulse, conservation of linear momentum, elastic/inelastic collisions, and recoil velocity calculations.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-phy-t2-waves",
      subjectId: "sub-phy",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 2,
      weekLabel: "Week 3–5",
      title: "Mechanical Waves, Sound & Optics Refraction",
      description:
        "Wave equation v = f*lambda, standing waves, Snell's law, and convex/concave lens ray diagrams.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-bio-t2-genetics",
      subjectId: "sub-bio",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 1,
      weekLabel: "Week 1–3",
      title: "Mendelian Genetics, Punnett Squares & Inheritance",
      description:
        "Monohybrid crosses, sex-linked traits, sickle-cell inheritance patterns, and ABO blood group genotypes.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "top-chem-t2-stoich",
      subjectId: "sub-chem",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      topicOrder: 1,
      weekLabel: "Week 1–3",
      title: "Mole Concept, Molarity & Volumetric Titration",
      description:
        "Calculating molar mass, percentage purity, acid-base titration stoichiometry, and WAEC practical tips.",
      isPublished: true,
      createdBy: "system-seed",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const videos: VideoLessonRecord[] = [
    {
      id: "vid-math-t1-indices-yt",
      topicId: "top-math-t1-indices",
      subjectId: "sub-math",
      termId: "term-first-2025",
      classLevelId: "lvl-ss2",
      title: "Understanding Laws of Exponents & Fractional Indices",
      description:
        "Curated visual walkthrough of positive, zero, negative, and rational exponents with step-by-step exercises.",
      sourceType: "YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=lDie9CnFgUg",
      youtubeVideoId: "lDie9CnFgUg",
      durationLabel: "11:20",
      materials: [
        makeSeedMaterial(
          "vid-math-t1-indices-yt",
          "mat-indices-sheet",
          "Laws of Indices & Logarithms Formula Sheet (PDF)",
          "PDF",
          "Laws-of-Indices-Formula-Sheet.pdf",
          `KEY LAWS OF INDICES (WAEC / NECO REVISION SHEET)

1. Multiplication Law: a^m * a^n = a^(m + n)
2. Division Law: a^m / a^n = a^(m - n)   (where a != 0)
3. Power of a Power: (a^m)^n = a^(mn)
4. Zero Index: a^0 = 1   (where a != 0)
5. Negative Index: a^(-n) = 1 / a^n
6. Fractional Index: a^(p/q) = (qth root of a)^p

WORKED PRACTICE QUESTIONS
Q1. Simplify: 27^(2/3) * 9^(-1/2)
Solution: 27^(2/3) = (3^3)^(2/3) = 3^2 = 9. 9^(-1/2) = 1/3. Result = 9 * (1/3) = 3.

Q2. Solve for x: 2^(2x - 1) = 16
Solution: 16 = 2^4, so 2x - 1 = 4 => 2x = 5 => x = 2.5.

SELF-CHECK DRILL
1. Evaluate (64/27)^(-2/3)
2. Solve 3^(x+1) = 1/81
3. Express 0.00045 in standard form.`,
          now
        ),
      ],
      uploadedByUserId: "system-seed",
      uploadedByName: "Learnova Curriculum Desk",
      uploadedByRole: "ADMIN",
      status: "PUBLISHED",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "vid-math-t2-quadratics-yt",
      topicId: "top-math-t2-quadratics",
      subjectId: "sub-math",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      title: "Solving Quadratic Equations by Factoring & Formula",
      description:
        "Curated explanation covering discriminant analysis, completing the square, and root relationships.",
      sourceType: "YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=IlNAJl36-10",
      youtubeVideoId: "IlNAJl36-10",
      durationLabel: "14:05",
      materials: [
        makeSeedMaterial(
          "vid-math-t2-quadratics-yt",
          "mat-quadratics-guide",
          "Quadratic Equations & Discriminant Worksheet (PDF)",
          "WORKSHEET",
          "Quadratic-Equations-Worksheet.pdf",
          `QUADRATIC EQUATIONS & DISCRIMINANT SUMMARY

1. Standard Form: ax^2 + bx + c = 0   (a != 0)
2. Quadratic Formula: x = [-b +/- sqrt(b^2 - 4ac)] / (2a)
3. Discriminant D = b^2 - 4ac:
   - D > 0 : Two distinct real roots
   - D = 0 : Equal / repeated real roots
   - D < 0 : No real roots (complex roots)
4. Sum & Product of Roots (alpha, beta):
   - alpha + beta = -b / a
   - alpha * beta = c / a

WAEC PRACTICE EXERCISES
1. Find the values of k for which x^2 + kx + 9 = 0 has equal roots.
2. Solve 2x^2 - 5x - 3 = 0 by factorisation.
3. If alpha and beta are roots of 3x^2 - 6x + 2 = 0, find alpha^2 + beta^2.`,
          now
        ),
      ],
      uploadedByUserId: "system-seed",
      uploadedByName: "Learnova Curriculum Desk",
      uploadedByRole: "ADMIN",
      status: "PUBLISHED",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "vid-math-t2-trig-yt",
      topicId: "top-math-t2-trig",
      subjectId: "sub-math",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      title: "Trigonometry Basics: SOH CAH TOA & Angle Calculations",
      description:
        "Curated introduction to right-triangle ratios and bearing problem setup.",
      sourceType: "YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=PUB0TaZ7bhA",
      youtubeVideoId: "PUB0TaZ7bhA",
      durationLabel: "09:42",
      materials: [
        makeSeedMaterial(
          "vid-math-t2-trig-yt",
          "mat-trig-sheet",
          "SOH-CAH-TOA, Sine & Cosine Rule Reference (PDF)",
          "PDF",
          "Trigonometry-Sine-Cosine-Rules.pdf",
          `TRIGONOMETRIC RATIOS, SINE & COSINE RULES

1. Right-Angled Triangles:
   - sin(theta) = Opposite / Hypotenuse
   - cos(theta) = Adjacent / Hypotenuse
   - tan(theta) = Opposite / Adjacent
2. Sine Rule: a / sin A = b / sin B = c / sin C
3. Cosine Rule: a^2 = b^2 + c^2 - 2bc cos A
4. Area of Triangle: Area = 1/2 ab sin C

BEARINGS & ELEVATION TIPS
- Always measure bearings clockwise from North (000 deg to 360 deg).
- Sketch the triangle clearly before applying Sine or Cosine rule.`,
          now
        ),
      ],
      uploadedByUserId: "system-seed",
      uploadedByName: "Learnova Curriculum Desk",
      uploadedByRole: "ADMIN",
      status: "PUBLISHED",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "vid-phy-t2-motion-yt",
      topicId: "top-phy-t2-motion",
      subjectId: "sub-phy",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      title: "Newton's Three Laws & Conservation of Momentum",
      description:
        "Curated visual demonstration of inertia, F = ma, action-reaction pairs, and collision momentum.",
      sourceType: "YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=kKKM8Y-u7ds",
      youtubeVideoId: "kKKM8Y-u7ds",
      durationLabel: "11:04",
      materials: [
        makeSeedMaterial(
          "vid-phy-t2-motion-yt",
          "mat-phy-momentum",
          "Newton's Laws & Linear Momentum Revision Notes (PDF)",
          "NOTES",
          "Newtons-Laws-Momentum-Notes.pdf",
          `NEWTON'S LAWS OF MOTION & LINEAR MOMENTUM

1. First Law (Inertia): A body stays at rest or uniform velocity unless acted on by a net external force.
2. Second Law: Rate of change of momentum is proportional to applied force:
   F = m(v - u)/t = ma   (SI Unit: Newton, N)
3. Impulse: I = F * t = mv - mu   (Unit: N.s or kg.m/s)
4. Third Law: To every action, there is an equal and opposite reaction.
5. Conservation of Linear Momentum: m1*u1 + m2*u2 = m1*v1 + m2*v2

WAEC WORKED EXAMPLE
A 4 kg trolley moving at 6 m/s collides with and sticks to a stationary 2 kg trolley. Find their common velocity.
Solution: (4)(6) + (2)(0) = (4 + 2)v => 24 = 6v => v = 4 m/s.`,
          now
        ),
      ],
      uploadedByUserId: "system-seed",
      uploadedByName: "Learnova Curriculum Desk",
      uploadedByRole: "ADMIN",
      status: "PUBLISHED",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "vid-bio-t2-genetics-yt",
      topicId: "top-bio-t2-genetics",
      subjectId: "sub-bio",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      title: "Heredity, Punnett Squares & Dominant vs Recessive Traits",
      description:
        "Curated conceptual breakdown of alleles, genotypes, phenotypes, and monohybrid ratios.",
      sourceType: "YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=CBezq1fFUEA",
      youtubeVideoId: "CBezq1fFUEA",
      durationLabel: "10:18",
      materials: [
        makeSeedMaterial(
          "vid-bio-t2-genetics-yt",
          "mat-bio-genetics",
          "Mendelian Genetics & Punnett Square Practice Sheet (PDF)",
          "WORKSHEET",
          "Mendelian-Genetics-Punnett-Squares.pdf",
          `MENDELIAN GENETICS & INHERITANCE GUIDE

KEY DEFINITIONS
- Gene: Basic unit of heredity on DNA controlling a specific characteristic.
- Allele: Alternative form of a gene occupying the same locus (e.g. T or t).
- Genotype: Genetic makeup of an organism (TT, Tt, tt).
- Phenotype: Observable physical expression of a trait.

MONOHYBRID CROSS RATIO (Tt x Tt)
- Genotypic ratio: 1 TT : 2 Tt : 1 tt
- Phenotypic ratio: 3 Tall : 1 Short

SICKLE-CELL INHERITANCE (AS x AS)
- Offspring genotypes: 25% AA (normal), 50% AS (carrier), 25% SS (sickle-cell).`,
          now
        ),
      ],
      uploadedByUserId: "system-seed",
      uploadedByName: "Learnova Curriculum Desk",
      uploadedByRole: "ADMIN",
      status: "PUBLISHED",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "vid-chem-t2-stoich-yt",
      topicId: "top-chem-t2-stoich",
      subjectId: "sub-chem",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      title: "Stoichiometry, Moles & Balancing Chemical Equations",
      description:
        "Curated walkthrough of Avogadro's constant, molar mass conversions, and limiting reactants.",
      sourceType: "YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=UL1jmJaUkaQ",
      youtubeVideoId: "UL1jmJaUkaQ",
      durationLabel: "12:50",
      materials: [
        makeSeedMaterial(
          "vid-chem-t2-stoich-yt",
          "mat-chem-stoich",
          "Mole Concept & Titration Calculations Guide (PDF)",
          "PDF",
          "Mole-Concept-Titration-Guide.pdf",
          `MOLE CONCEPT & VOLUMETRIC TITRATION FORMULAS

1. Number of moles: n = Mass (g) / Molar Mass (g/mol)
2. Concentration: C = n / V(dm^3)   [Remember: 1000 cm^3 = 1 dm^3]
3. Titration Formula: (Ca * Va) / (Cb * Vb) = na / nb
4. Gas Volume at STP: 1 mole of any gas occupies 22.4 dm^3 at STP.

WAEC PRACTICAL TIP
- Always record burette readings to two decimal places (e.g. 24.50 cm^3).
- Use concordant titre values within +/- 0.20 cm^3 to calculate average volume.`,
          now
        ),
      ],
      uploadedByUserId: "system-seed",
      uploadedByName: "Learnova Curriculum Desk",
      uploadedByRole: "ADMIN",
      status: "PUBLISHED",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "vid-eng-t2-essay-yt",
      topicId: "top-eng-t2-essay",
      subjectId: "sub-eng",
      termId: "term-second-2026",
      classLevelId: "lvl-ss2",
      title: "Structuring High-Scoring Persuasive & Argumentative Essays",
      description:
        "Curated writing craft guide covering thesis clarity, paragraph transitions, and formal tone.",
      sourceType: "YOUTUBE",
      videoUrl: "https://www.youtube.com/watch?v=V7i48-o1w9Q",
      youtubeVideoId: "V7i48-o1w9Q",
      durationLabel: "08:30",
      materials: [
        makeSeedMaterial(
          "vid-eng-t2-essay-yt",
          "mat-eng-essay",
          "WAEC Formal Letter & Essay Marking Checklist (PDF)",
          "WORKSHEET",
          "WAEC-Essay-Checklist.pdf",
          `WAEC ESSAY & FORMAL LETTER WRITING CHECKLIST

MARKING SCHEME WEIGHTS (50 MARKS)
- Content (10 marks): Answer every part of the prompt thoroughly (450+ words).
- Organisation (10 marks): Clear greeting, salutation, heading, logical paragraphs, and formal close ("Yours faithfully," + signature + full name).
- Expression (20 marks): Formal diction, varied sentence structures, clear connectives.
- Mechanical Accuracy (10 marks): Check spelling, tense consistency, concord, and punctuation (avoid contractions like "don't" in formal letters).`,
          now
        ),
      ],
      uploadedByUserId: "system-seed",
      uploadedByName: "Learnova Curriculum Desk",
      uploadedByRole: "ADMIN",
      status: "PUBLISHED",
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    curriculumTopics: topics,
    videoLessons: videos,
  };
}

