import crypto from "crypto";
import fs from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import {
  appendAuditLog,
  appendNotification,
  fetchDirectoryUsers,
  loadLmsState,
  mutateLmsState,
} from "./lmsDb";
import { getSupabaseServerClient } from "./supabaseServer";
import type { AuthenticatedSessionUser } from "./serverAuth";
import type {
  CurriculumTopicRecord,
  VideoLessonMaterialRecord,
  VideoLessonRecord,
  VideoPublishStatus,
  VideoUploadRequestRecord,
} from "./lmsTypes";

export class VideoServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

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

export async function getVideoLessonsOverview(user: AuthenticatedSessionUser) {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isTeacher = user.role === "TEACHER";

  const [state, users] = await Promise.all([
    loadLmsState(),
    isAdmin ? fetchDirectoryUsers() : Promise.resolve([]),
  ]);

  const classLevels = isAdmin
    ? state.classLevels
    : state.classLevels.filter((c) => c.isActive);
  const subjects = isAdmin
    ? state.subjects
    : state.subjects.filter((s) => s.isActive);

  const topics = (state.curriculumTopics || [])
    .filter((t) => isAdmin || isTeacher || t.isPublished)
    .sort((a, b) => a.topicOrder - b.topicOrder);

  const videos = (state.videoLessons || []).filter((v) => {
    if (isAdmin) return true;
    if (isTeacher) {
      return v.status === "PUBLISHED" || v.uploadedByUserId === user.id;
    }
    return v.status === "PUBLISHED";
  });

  const requests = isAdmin
    ? state.videoUploadRequests || []
    : isTeacher
    ? (state.videoUploadRequests || []).filter(
        (r) => r.teacherUserId === user.id
      )
    : [];

  const enrolment =
    user.role === "STUDENT"
      ? state.studentEnrolments.find((e) => e.studentUserId === user.id) ||
        null
      : null;
  const entitlement =
    user.role === "STUDENT"
      ? state.studentEntitlements.find((e) => e.studentUserId === user.id) ||
        null
      : null;

  const approvedPairs = isTeacher
    ? state.teacherApprovals.filter(
        (a) => a.teacherUserId === user.id && a.status === "APPROVED"
      )
    : [];

  const teachers = isAdmin
    ? users
        .filter((u) => u.role === "TEACHER" && u.status !== "REJECTED")
        .map((u) => ({
          id: u.id,
          fullName: u.fullName,
          email: u.email,
          status: u.status,
          approvals: state.teacherApprovals
            .filter((a) => a.teacherUserId === u.id && a.status === "APPROVED")
            .map((a) => ({
              subjectId: a.subjectId,
              subjectName: a.subjectName,
              classLevelId: a.classLevelId,
              classLevelName: a.classLevelName,
            })),
        }))
    : [];

  return {
    role: user.role,
    classLevels,
    subjects,
    terms: state.terms,
    sessions: state.sessions,
    topics,
    videos,
    requests,
    teachers,
    approvedPairs,
    enrolment,
    entitlement,
  };
}

export async function handleVideoLessonsMutation(
  user: AuthenticatedSessionUser,
  body: Record<string, unknown>
) {
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const isTeacher = user.role === "TEACHER";
  const action = String(body.action || "");

  if (action === "RECORD_VIDEO_VIEW") {
    const videoId = String(body.videoId || "");
    const updated = await mutateLmsState((state) => {
      const video = (state.videoLessons || []).find((v) => v.id === videoId);
      if (!video) throw new VideoServiceError("Video lesson not found.", 400);
      video.viewCount = (video.viewCount || 0) + 1;
      return video;
    });
    return { success: true, video: updated };
  }

  if (!isAdmin && !isTeacher) {
    throw new VideoServiceError(
      "Only teachers and administrators can modify video lessons.",
      403
    );
  }

  const result = await mutateLmsState(async (state) => {
    if (!Array.isArray(state.curriculumTopics)) state.curriculumTopics = [];
    if (!Array.isArray(state.videoLessons)) state.videoLessons = [];
    if (!Array.isArray(state.videoUploadRequests))
      state.videoUploadRequests = [];

    switch (action) {
      case "CREATE_TOPIC": {
        const subjectId = String(body.subjectId || "").trim();
        const termId = String(body.termId || "").trim();
        const classLevelId = String(body.classLevelId || "").trim();
        const title = String(body.title || "").trim();
        const description = String(body.description || "").trim();
        const weekLabel = String(body.weekLabel || "").trim();

        if (!subjectId || !termId || !classLevelId || !title) {
          throw new Error(
            "Subject, term, class level, and topic title are required."
          );
        }

        if (isTeacher && !isAdmin) {
          const hasApproval = state.teacherApprovals.some(
            (a) =>
              a.teacherUserId === user.id &&
              a.subjectId === subjectId &&
              a.status === "APPROVED"
          );
          if (
            state.teacherApprovals.some((a) => a.teacherUserId === user.id) &&
            !hasApproval
          ) {
            throw new Error(
              "You can only add topics for subjects you are approved to teach."
            );
          }
        }

        const existingCount = state.curriculumTopics.filter(
          (t) =>
            t.subjectId === subjectId &&
            t.termId === termId &&
            t.classLevelId === classLevelId
        ).length;

        const now = new Date().toISOString();
        const created: CurriculumTopicRecord = {
          id: `top-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          subjectId,
          termId,
          classLevelId,
          topicOrder: Number(body.topicOrder) || existingCount + 1,
          weekLabel: weekLabel || `Topic ${existingCount + 1}`,
          title,
          description:
            description ||
            "Structured curriculum topic with recorded walkthroughs and curated resources.",
          isPublished: true,
          createdBy: user.id,
          createdAt: now,
          updatedAt: now,
        };

        state.curriculumTopics.push(created);
        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "CREATE_CURRICULUM_TOPIC",
          entityType: "curriculum_topic",
          entityId: created.id,
          metadata: { subjectId, termId, classLevelId, title },
        });

        return { topic: created };
      }

      case "DELETE_TOPIC": {
        if (!isAdmin) {
          throw new Error("Only administrators can remove curriculum topics.");
        }
        const topicId = String(body.topicId || "");
        const before = state.curriculumTopics.length;
        state.curriculumTopics = state.curriculumTopics.filter(
          (t) => t.id !== topicId
        );
        if (state.curriculumTopics.length === before) {
          throw new Error("Topic not found.");
        }
        state.videoLessons = state.videoLessons.filter(
          (v) => v.topicId !== topicId
        );
        state.videoUploadRequests = state.videoUploadRequests.filter(
          (r) => r.topicId !== topicId
        );
        return { deletedTopicId: topicId };
      }

      case "CREATE_VIDEO_LESSON": {
        const topicId = String(body.topicId || "").trim();
        const title = String(body.title || "").trim();
        const description = String(body.description || "").trim();
        const durationLabel = String(body.durationLabel || "").trim();
        const requestId = String(body.requestId || "").trim() || undefined;
        const rawSourceType = String(body.sourceType || "YOUTUBE");
        const rawVideoUrl = String(body.videoUrl || "").trim();

        const topic = state.curriculumTopics.find((t) => t.id === topicId);
        if (!topic) {
          throw new Error("Selected curriculum topic was not found.");
        }
        if (!title) {
          throw new Error("Video lesson title is required.");
        }

        const normalized = normalizeVideoSourceInput({
          sourceType: rawSourceType,
          videoUrl: rawVideoUrl,
        });

        const rawMaterials = Array.isArray(body.materials) ? body.materials : [];
        const incomingMaterials: VideoLessonMaterialRecord[] = rawMaterials
          .filter(
            (m): m is Record<string, unknown> =>
              Boolean(m && typeof m === "object" && "title" in m && "url" in m && m.title && m.url)
          )
          .map((m) => ({
            id: `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: String(m.title).trim(),
            type: (["PDF", "WORKSHEET", "SLIDES", "NOTES", "LINK"].includes(
              String(m.type)
            )
              ? m.type
              : "PDF") as VideoLessonMaterialRecord["type"],
            url: String(m.url).trim(),
            fileName: m.fileName ? String(m.fileName) : undefined,
            mimeType: m.mimeType ? String(m.mimeType) : undefined,
            fileSizeBytes: m.fileSizeBytes
              ? Number(m.fileSizeBytes)
              : undefined,
            contentText: m.contentText ? String(m.contentText) : undefined,
            createdAt: new Date().toISOString(),
          }));

        const now = new Date().toISOString();
        const created: VideoLessonRecord = {
          id: `vid-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          topicId: topic.id,
          subjectId: topic.subjectId,
          termId: topic.termId,
          classLevelId: topic.classLevelId,
          title,
          description:
            description ||
            `${topic.title} video lesson curated for Nigerian curriculum learners.`,
          sourceType: normalized.sourceType,
          videoUrl: normalized.videoUrl,
          youtubeVideoId: normalized.youtubeVideoId,
          storagePath: body.storagePath ? String(body.storagePath) : undefined,
          mimeType: body.mimeType ? String(body.mimeType) : undefined,
          fileSizeBytes: body.fileSizeBytes
            ? Number(body.fileSizeBytes)
            : undefined,
          durationLabel: durationLabel || undefined,
          materials: incomingMaterials,
          uploadedByUserId: user.id,
          uploadedByName: user.fullName,
          uploadedByRole: user.role,
          status: "PUBLISHED",
          requestId,
          viewCount: 0,
          createdAt: now,
          updatedAt: now,
        };

        state.videoLessons.unshift(created);

        if (requestId) {
          const reqRecord = state.videoUploadRequests.find(
            (r) => r.id === requestId
          );
          if (reqRecord) {
            reqRecord.fulfilledVideoId = created.id;
            reqRecord.status = isAdmin ? "APPROVED" : "SUBMITTED";
            reqRecord.updatedAt = now;

            if (!isAdmin) {
              appendNotification(state, {
                recipientUserId: reqRecord.requestedByUserId,
                recipientRole: "ALL_ADMINS",
                category: "VIDEO_LESSON",
                title: `Video Lesson Submitted: ${topic.title}`,
                message: `${user.fullName} uploaded "${created.title}" in response to your topic video request.`,
                href: "/admin/videos",
              });
            }
          }
        }

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "CREATE_VIDEO_LESSON",
          entityType: "video_lesson",
          entityId: created.id,
          metadata: {
            topicId: topic.id,
            sourceType: created.sourceType,
            requestId,
          },
        });

        return { video: created };
      }

      case "DELETE_VIDEO_LESSON": {
        const videoId = String(body.videoId || "");
        const existing = state.videoLessons.find((v) => v.id === videoId);
        if (!existing) throw new Error("Video lesson not found.");
        if (!isAdmin && existing.uploadedByUserId !== user.id) {
          throw new Error(
            "You can only delete video lessons that you uploaded."
          );
        }
        state.videoLessons = state.videoLessons.filter(
          (v) => v.id !== videoId
        );
        return { deletedVideoId: videoId };
      }

      case "UPDATE_VIDEO_STATUS": {
        if (!isAdmin) {
          throw new Error("Only administrators can moderate video status.");
        }
        const videoId = String(body.videoId || "");
        const status = String(body.status || "PUBLISHED") as VideoPublishStatus;
        const reviewNotes = String(body.reviewNotes || "").trim();

        const video = state.videoLessons.find((v) => v.id === videoId);
        if (!video) throw new Error("Video lesson not found.");

        video.status = status;
        if (reviewNotes) video.reviewNotes = reviewNotes;
        video.updatedAt = new Date().toISOString();

        if (
          status === "REVISION_REQUESTED" &&
          video.uploadedByUserId !== user.id
        ) {
          appendNotification(state, {
            recipientUserId: video.uploadedByUserId,
            recipientRole: "TEACHER",
            category: "VIDEO_LESSON",
            title: `Revision Requested: ${video.title}`,
            message:
              reviewNotes ||
              "An administrator requested an update to your uploaded topic video.",
            href: "/teacher/videos",
          });
        }

        return { video };
      }

      case "ASSIGN_VIDEO_REQUEST": {
        if (!isAdmin) {
          throw new Error(
            "Only administrators can assign teacher video upload requests."
          );
        }
        const topicId = String(body.topicId || "").trim();
        const teacherUserId = String(body.teacherUserId || "").trim();
        const instructions = String(body.instructions || "").trim();
        const dueDate = String(body.dueDate || "").trim() || undefined;

        const topic = state.curriculumTopics.find((t) => t.id === topicId);
        if (!topic) throw new Error("Please select a valid curriculum topic.");
        if (!teacherUserId) throw new Error("Please select a teacher.");

        const users = await fetchDirectoryUsers();
        const teacher = users.find((u) => u.id === teacherUserId);
        if (!teacher) throw new Error("Selected teacher account not found.");

        const subject = state.subjects.find((s) => s.id === topic.subjectId);
        const term = state.terms.find((t) => t.id === topic.termId);

        const now = new Date().toISOString();
        const created: VideoUploadRequestRecord = {
          id: `vreq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          topicId: topic.id,
          subjectId: topic.subjectId,
          termId: topic.termId,
          classLevelId: topic.classLevelId,
          teacherUserId: teacher.id,
          teacherName: teacher.fullName,
          requestedByUserId: user.id,
          requestedByName: user.fullName,
          instructions:
            instructions ||
            `Please record and upload a clear video lesson covering "${topic.title}".`,
          dueDate,
          status: "REQUESTED",
          createdAt: now,
          updatedAt: now,
        };

        state.videoUploadRequests.unshift(created);

        appendNotification(state, {
          recipientUserId: teacher.id,
          recipientRole: "TEACHER",
          category: "VIDEO_LESSON",
          title: `Video Upload Requested: ${topic.title}`,
          message: `${subject?.name || "Subject"} (${term?.name || "Term"}): ${created.instructions}`,
          href: "/teacher/videos",
        });

        appendAuditLog(state, {
          actorUserId: user.id,
          actorEmail: user.email,
          actorRole: user.role,
          action: "ASSIGN_VIDEO_UPLOAD_REQUEST",
          entityType: "video_upload_request",
          entityId: created.id,
          metadata: {
            topicId: topic.id,
            teacherUserId: teacher.id,
            dueDate,
          },
        });

        return { request: created };
      }

      case "REVIEW_VIDEO_REQUEST": {
        if (!isAdmin) {
          throw new Error("Only administrators can review upload requests.");
        }
        const requestId = String(body.requestId || "");
        const decision = String(body.decision || "APPROVED") as
          | "APPROVED"
          | "REVISION_REQUESTED";
        const adminReviewNotes = String(body.adminReviewNotes || "").trim();

        const reqRecord = state.videoUploadRequests.find(
          (r) => r.id === requestId
        );
        if (!reqRecord) throw new Error("Upload request not found.");

        reqRecord.status = decision;
        if (adminReviewNotes) reqRecord.adminReviewNotes = adminReviewNotes;
        reqRecord.updatedAt = new Date().toISOString();

        if (reqRecord.fulfilledVideoId) {
          const vid = state.videoLessons.find(
            (v) => v.id === reqRecord.fulfilledVideoId
          );
          if (vid) {
            vid.status =
              decision === "APPROVED" ? "PUBLISHED" : "REVISION_REQUESTED";
            if (adminReviewNotes) vid.reviewNotes = adminReviewNotes;
            vid.updatedAt = reqRecord.updatedAt;
          }
        }

        const topic = state.curriculumTopics.find(
          (t) => t.id === reqRecord.topicId
        );

        appendNotification(state, {
          recipientUserId: reqRecord.teacherUserId,
          recipientRole: "TEACHER",
          category: "VIDEO_LESSON",
          title:
            decision === "APPROVED"
              ? `Video Approved: ${topic?.title || "Topic Lesson"}`
              : `Revision Needed: ${topic?.title || "Topic Lesson"}`,
          message:
            adminReviewNotes ||
            (decision === "APPROVED"
              ? "Your video submission has been approved and is live for students."
              : "Please review the admin feedback and upload an updated video."),
          href: "/teacher/videos",
        });

        return { request: reqRecord };
      }

      case "ATTACH_VIDEO_MATERIAL": {
        const videoId = String(body.videoId || "").trim();
        const title = String(body.title || "").trim();
        const url = String(body.url || "").trim();
        const contentText = String(body.contentText || "").trim();
        const type = (["PDF", "WORKSHEET", "SLIDES", "NOTES", "LINK"].includes(
          String(body.type)
        )
          ? body.type
          : "PDF") as VideoLessonMaterialRecord["type"];

        const video = state.videoLessons.find((v) => v.id === videoId);
        if (!video) throw new Error("Video lesson not found.");
        if (!isAdmin && video.uploadedByUserId !== user.id) {
          throw new Error(
            "You can only attach study materials to your own uploaded videos."
          );
        }
        if (!title) throw new Error("Material title is required.");
        if (!url && !contentText) {
          throw new Error("Attach a file/link or provide study notes text.");
        }

        const matId = `mat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const resolvedUrl =
          url ||
          `/api/lms/videos/materials/download?videoId=${encodeURIComponent(
            video.id
          )}&materialId=${encodeURIComponent(matId)}`;

        const createdMat: VideoLessonMaterialRecord = {
          id: matId,
          title,
          type,
          url: resolvedUrl,
          fileName: body.fileName ? String(body.fileName) : `${title}.pdf`,
          mimeType: body.mimeType ? String(body.mimeType) : "application/pdf",
          fileSizeBytes: body.fileSizeBytes
            ? Number(body.fileSizeBytes)
            : undefined,
          contentText: contentText || undefined,
          createdAt: now,
        };

        if (!Array.isArray(video.materials)) video.materials = [];
        video.materials.push(createdMat);
        video.updatedAt = now;
        return { video, material: createdMat };
      }

      case "REMOVE_VIDEO_MATERIAL": {
        const videoId = String(body.videoId || "").trim();
        const materialId = String(body.materialId || "").trim();
        const video = state.videoLessons.find((v) => v.id === videoId);
        if (!video) throw new Error("Video lesson not found.");
        if (!isAdmin && video.uploadedByUserId !== user.id) {
          throw new Error("You can only remove materials from your own videos.");
        }
        video.materials = (video.materials || []).filter(
          (m) => m.id !== materialId
        );
        video.updatedAt = new Date().toISOString();
        return { video };
      }

      default:
        throw new Error("Unsupported video lessons action.");
    }
  });

  return { success: true, ...result };
}

const VIDEO_BUCKET = "learnova-video-lessons";
const MAX_VIDEO_BYTES = 85 * 1024 * 1024;
const ALLOWED_VIDEO_MIME_EXT: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
  "video/x-m4v": ".m4v",
  "video/ogg": ".ogv",
};

export async function uploadVideoLessonFile(
  user: AuthenticatedSessionUser,
  file: FormDataEntryValue | null
) {
  if (!file || !(file instanceof File)) {
    throw new VideoServiceError(
      "Please select a video file (.mp4, .webm, or .mov) to upload.",
      400
    );
  }
  if (file.size === 0) {
    throw new VideoServiceError("Uploaded video file appears empty.", 400);
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new VideoServiceError(
      "Video file exceeds the 85 MB browser upload limit. Compress the video or attach a YouTube link instead.",
      400
    );
  }

  const mimeType = (file.type || "video/mp4").split(";")[0].trim().toLowerCase();
  const rawExt = path.extname(file.name || "").toLowerCase();
  const ext =
    ALLOWED_VIDEO_MIME_EXT[mimeType] ||
    ([".mp4", ".webm", ".mov", ".m4v", ".ogv"].includes(rawExt)
      ? rawExt
      : ".mp4");

  if (
    !mimeType.startsWith("video/") &&
    ![".mp4", ".webm", ".mov", ".m4v", ".ogv"].includes(rawExt)
  ) {
    throw new VideoServiceError(
      "Only video files (.mp4, .webm, .mov, .m4v) are accepted.",
      400
    );
  }

  const safeBase = (file.name || "lesson")
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 48);
  const filename = `${Date.now()}_${user.id.slice(0, 8)}_${safeBase}${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  try {
    const sb = getSupabaseServerClient();
    const { data: buckets } = await sb.storage.listBuckets();
    if (!buckets?.some((b) => b.id === VIDEO_BUCKET)) {
      await sb.storage.createBucket(VIDEO_BUCKET, { public: true });
    }
    const { error: uploadErr } = await sb.storage
      .from(VIDEO_BUCKET)
      .upload(filename, bytes, {
        contentType: mimeType || "video/mp4",
        upsert: false,
      });

    if (!uploadErr) {
      const { data: pub } = sb.storage.from(VIDEO_BUCKET).getPublicUrl(filename);
      if (pub?.publicUrl) {
        return {
          success: true,
          videoUrl: pub.publicUrl,
          storagePath: `supabase://${VIDEO_BUCKET}/${filename}`,
          mimeType: mimeType || "video/mp4",
          fileSizeBytes: file.size,
        };
      }
    }
  } catch (sbErr) {
    console.warn("Supabase video storage upload fallback to local disk:", sbErr);
  }

  const uploadDir = path.join(process.cwd(), ".aistudio", "uploads", "videos");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), bytes);

  return {
    success: true,
    videoUrl: `/api/lms/videos/stream/${encodeURIComponent(filename)}`,
    storagePath: `local://${filename}`,
    mimeType: mimeType || "video/mp4",
    fileSizeBytes: file.size,
  };
}

const MATERIALS_BUCKET = "learnova-lesson-materials";
const MAX_MATERIAL_BYTES = 25 * 1024 * 1024;
const ALLOWED_MATERIAL_EXTS = new Set([
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".txt",
  ".md",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
]);

function inferMaterialType(
  ext: string
): "PDF" | "SLIDES" | "WORKSHEET" | "NOTES" {
  if (ext === ".pdf") return "PDF";
  if (ext === ".ppt" || ext === ".pptx") return "SLIDES";
  if (ext === ".doc" || ext === ".docx" || ext === ".csv") return "WORKSHEET";
  return "NOTES";
}

export async function uploadVideoMaterialFile(
  file: FormDataEntryValue | null
) {
  if (!file || !(file instanceof File)) {
    throw new VideoServiceError(
      "Please attach a document, slide deck, or study sheet file.",
      400
    );
  }
  if (file.size === 0) {
    throw new VideoServiceError("Uploaded file is empty.", 400);
  }
  if (file.size > MAX_MATERIAL_BYTES) {
    throw new VideoServiceError(
      "Study material file must be 25MB or smaller.",
      400
    );
  }

  const ext = path.extname(file.name || "").toLowerCase() || ".pdf";
  if (!ALLOWED_MATERIAL_EXTS.has(ext)) {
    throw new VideoServiceError(
      "Unsupported material format. Upload .pdf, .doc, .docx, .ppt, .pptx, .txt, .md, .csv, or image files.",
      400
    );
  }

  const safeBase = path
    .basename(file.name, ext)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 48);
  const uniqueName = `${Date.now()}_${crypto.randomBytes(4).toString("hex")}_${safeBase || "material"}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";

  try {
    const sb = getSupabaseServerClient();
    const { data: buckets } = await sb.storage.listBuckets();
    if (!buckets?.some((b) => b.name === MATERIALS_BUCKET)) {
      await sb.storage.createBucket(MATERIALS_BUCKET, {
        public: true,
        fileSizeLimit: MAX_MATERIAL_BYTES,
      });
    }

    const { error: uploadErr } = await sb.storage
      .from(MATERIALS_BUCKET)
      .upload(uniqueName, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (!uploadErr) {
      const { data: publicUrlData } = sb.storage
        .from(MATERIALS_BUCKET)
        .getPublicUrl(uniqueName);

      return {
        success: true,
        url: publicUrlData.publicUrl,
        fileName: file.name,
        mimeType,
        fileSizeBytes: file.size,
        materialType: inferMaterialType(ext),
        storage: "supabase",
      };
    }
  } catch {
    // Fall back to persistent local disk directory
  }

  const dir = path.join(process.cwd(), ".aistudio", "uploads", "materials");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, uniqueName), buffer);

  return {
    success: true,
    url: `/api/lms/videos/materials/download?file=${encodeURIComponent(uniqueName)}`,
    fileName: file.name,
    mimeType,
    fileSizeBytes: file.size,
    materialType: inferMaterialType(ext),
    storage: "local",
  };
}

const MATERIAL_CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function sanitizeDownloadName(
  raw: string,
  fallback = "learnova-study-material.pdf"
): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || fallback;
}

export async function resolveVideoMaterialDownload(params: {
  localFileParam?: string | null;
  videoId?: string;
  materialId?: string;
}): Promise<
  | { kind: "redirect"; url: string }
  | { kind: "bytes"; data: Uint8Array; contentType: string; fileName: string }
> {
  const { localFileParam, videoId = "", materialId = "" } = params;

  if (localFileParam) {
    const safeName = path.basename(localFileParam);
    const fullPath = path.join(
      process.cwd(),
      ".aistudio",
      "uploads",
      "materials",
      safeName
    );
    try {
      const buf = await readFile(fullPath);
      const ext = path.extname(safeName).toLowerCase();
      return {
        kind: "bytes",
        data: new Uint8Array(buf),
        contentType: MATERIAL_CONTENT_TYPES[ext] || "application/octet-stream",
        fileName: sanitizeDownloadName(safeName),
      };
    } catch {
      throw new VideoServiceError("Material file not found.", 404);
    }
  }

  if (!videoId) {
    throw new VideoServiceError(
      "Specify videoId or file to download lesson material.",
      400
    );
  }

  const state = await loadLmsState();
  const video = (state.videoLessons || []).find((v) => v.id === videoId);
  if (!video) {
    throw new VideoServiceError("Video lesson not found.", 404);
  }

  const subject = state.subjects.find((s) => s.id === video.subjectId);
  const term = state.terms.find((t) => t.id === video.termId);
  const topic = (state.curriculumTopics || []).find(
    (t) => t.id === video.topicId
  );

  const material = materialId
    ? (video.materials || []).find((m) => m.id === materialId)
    : undefined;

  if (
    material &&
    material.url &&
    !material.url.startsWith("/api/lms/videos/materials/download")
  ) {
    if (material.type === "LINK") {
      return { kind: "redirect", url: material.url };
    }
    try {
      const remoteRes = await fetch(material.url);
      if (remoteRes.ok) {
        const arrBuf = await remoteRes.arrayBuffer();
        const fileName = sanitizeDownloadName(
          material.fileName || `${material.title}.pdf`
        );
        return {
          kind: "bytes",
          data: new Uint8Array(arrBuf),
          contentType:
            material.mimeType ||
            remoteRes.headers.get("content-type") ||
            "application/octet-stream",
          fileName,
        };
      }
    } catch {
      // Fall back to generating a clean PDF study guide below if remote fetch fails
    }
  }

  const subtitle = `${subject?.name || "Subject"} · ${term?.name || "Academic Term"} · ${topic?.title || "Topic"}`;
  const pdfTitle =
    material?.title || `${video.title} — Lesson Summary Sheet`;
  const bodyText =
    material?.contentText ||
    `TOPIC OVERVIEW\n${topic?.title || video.title}\n${topic?.description || ""}\n\nVIDEO LESSON SUMMARY\n${video.title}\nPresenter: ${video.uploadedByName}\nDuration: ${video.durationLabel || "Self-paced"}\n\nLESSON NOTES\n${video.description}\n\nSTUDY CHECKLIST\n1. Watch the complete video walkthrough and pause to replicate worked steps.\n2. Save key formulas and definitions to your Learnova Study Notebook.\n3. Ask Nova AI for 3 WAEC/JAMB practice questions on this topic to test mastery.`;

  const pdfBuffer = buildSimplePdfBuffer(pdfTitle, subtitle, bodyText);
  const downloadFileName = sanitizeDownloadName(
    material?.fileName || `${video.title}-Study-Sheet.pdf`
  );

  return {
    kind: "bytes",
    data: new Uint8Array(pdfBuffer),
    contentType: "application/pdf",
    fileName: downloadFileName,
  };
}

const STREAM_MIME_BY_EXT: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".ogv": "video/ogg",
};

export function resolveLocalVideoStreamFile(rawFilename: string) {
  const safeName = path.basename(decodeURIComponent(rawFilename || ""));
  if (!safeName) {
    throw new VideoServiceError("Invalid filename.", 400);
  }

  const filePath = path.join(
    process.cwd(),
    ".aistudio",
    "uploads",
    "videos",
    safeName
  );
  if (!fs.existsSync(filePath)) {
    throw new VideoServiceError("Video file not found.", 404);
  }

  const stat = fs.statSync(filePath);
  const ext = path.extname(safeName).toLowerCase();
  return {
    filePath,
    totalSize: stat.size,
    contentType: STREAM_MIME_BY_EXT[ext] || "video/mp4",
  };
}

export async function listVideoQuestions(filters: {
  videoId?: string;
  topicId?: string;
}) {
  const state = await loadLmsState();
  const items = (state.videoQuestions || []).filter((q) => {
    if (filters.videoId && q.videoId !== filters.videoId) return false;
    if (filters.topicId && q.topicId !== filters.topicId) return false;
    return true;
  });

  return items.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function askVideoQuestion(
  user: AuthenticatedSessionUser,
  input: {
    videoId?: string;
    topicId?: string;
    question?: string;
    timestampLabel?: string;
  }
) {
  const videoId = String(input.videoId || "").trim();
  const topicId = String(input.topicId || "").trim();
  const question = String(input.question || "").trim();
  const timestampLabel = String(input.timestampLabel || "").trim() || undefined;

  if (!videoId || !topicId || !question) {
    throw new VideoServiceError(
      "Video ID, topic ID, and question text are required.",
      400
    );
  }

  return mutateLmsState((state) => {
    const video = state.videoLessons.find((v) => v.id === videoId);
    const item = {
      id: `vqa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      videoId,
      topicId,
      timestampLabel,
      authorUserId: user.id,
      authorName: user.fullName,
      authorRole: user.role,
      question,
      replies: [],
      createdAt: new Date().toISOString(),
    };
    state.videoQuestions.unshift(item);

    if (video && video.uploadedByUserId !== user.id) {
      appendNotification(state, {
        recipientUserId:
          video.uploadedByUserId === "system-seed"
            ? "ALL_ADMINS"
            : video.uploadedByUserId,
        recipientRole:
          video.uploadedByUserId === "system-seed" ? "ALL_ADMINS" : undefined,
        category: "VIDEO_LESSON",
        title: "New Topic Question Posted",
        message: `${user.fullName} asked on "${video.title}"${
          timestampLabel ? ` (${timestampLabel})` : ""
        }: "${question.slice(0, 80)}"`,
        href: `/videos?videoId=${encodeURIComponent(video.id)}&topicId=${encodeURIComponent(
          topicId
        )}`,
      });
    }

    return item;
  });
}

export async function replyToVideoQuestion(
  user: AuthenticatedSessionUser,
  input: {
    questionId?: string;
    body?: string;
    isAiAssisted?: boolean;
  }
) {
  const questionId = String(input.questionId || "").trim();
  const replyBody = String(input.body || "").trim();
  const isAiAssisted = Boolean(input.isAiAssisted);

  if (!questionId || !replyBody) {
    throw new VideoServiceError(
      "Question ID and reply body are required.",
      400
    );
  }

  try {
    return await mutateLmsState((state) => {
      const q = state.videoQuestions.find((item) => item.id === questionId);
      if (!q) throw new Error("Question thread not found.");
      const reply = {
        id: `vqr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        authorUserId: user.id,
        authorName: user.fullName,
        authorRole: user.role,
        body: replyBody,
        isAiAssisted,
        createdAt: new Date().toISOString(),
      };
      q.replies.push(reply);

      if (q.authorUserId !== user.id) {
        appendNotification(state, {
          recipientUserId: q.authorUserId,
          category: "VIDEO_LESSON",
          title: "Reply to Your Video Question",
          message: `${user.fullName} replied to your question on this lesson.`,
          href: `/videos?videoId=${encodeURIComponent(q.videoId)}&topicId=${encodeURIComponent(
            q.topicId
          )}`,
        });
      }

      return q;
    });
  } catch (err: unknown) {
    const msg = (err as { message?: string })?.message;
    throw new VideoServiceError(msg || "Failed to post reply.", 404);
  }
}

