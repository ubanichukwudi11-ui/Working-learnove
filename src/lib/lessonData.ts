export const lessonData = {
  mathematics: {
    algebra: [
      {
        slug: "introduction-to-algebra",
        title: "Introduction to Algebra",
        youtubeId: "NybHckSEQBI",
        duration: "12 mins",
        xp: 20,
        notes: `
Algebra is a branch of mathematics that uses letters and symbols to represent numbers.

Key Concepts:
• Variables represent unknown values.
• Constants remain fixed.
• Expressions combine numbers and variables.

Example:
x + 5 = 10
Solve for x.
        `,
      },
      {
        slug: "variables-and-constants",
        title: "Variables and Constants",
        youtubeId: "LwCRRUa8yTU",
        duration: "15 mins",
        xp: 20,
        notes: `
Variables can change.

Examples:
x, y, z

Constants stay the same.

Examples:
5, 10, 100

Equation:
x + 5 = 20
        `,
      },
      {
        slug: "algebraic-expressions",
        title: "Algebraic Expressions",
        youtubeId: "grnP3mduZkM",
        duration: "18 mins",
        xp: 25,
        notes: `
Algebraic expressions combine:

• Variables
• Numbers
• Operations

Examples:
2x + 5
3y - 8
        `,
      },
      {
        slug: "linear-equations",
        title: "Linear Equations",
        youtubeId: "6x4Z4b3F9mQ",
        duration: "20 mins",
        xp: 25,
        notes: `
Linear equations contain variables raised only to power 1.

Example:
2x + 4 = 12

Solve:
2x = 8
x = 4
        `,
      },
      {
        slug: "simultaneous-equations",
        title: "Simultaneous Equations",
        youtubeId: "wTj0HjP8W2Y",
        duration: "22 mins",
        xp: 30,
        notes: `
Two equations solved together.

Example:

x + y = 10
x - y = 2

Solution:
x = 6
y = 4
        `,
      },
      {
        slug: "word-problems",
        title: "Word Problems",
        youtubeId: "lFlu60qs7_4",
        duration: "25 mins",
        xp: 30,
        notes: `
Translate real-life situations into equations.

Steps:

1. Read carefully
2. Identify unknowns
3. Form equations
4. Solve
5. Check answers
        `,
      },
    ],

    geometry: [
      {
        slug: "introduction-to-geometry",
        title: "Introduction to Geometry",
        youtubeId: "302eJ3TzJQU",
        duration: "12 mins",
        xp: 20,
        notes: `
Geometry studies shapes, sizes, and positions.

Examples:
• Points
• Lines
• Angles
• Shapes
        `,
      },
    ],

    trigonometry: [
      {
        slug: "introduction-to-trigonometry",
        title: "Introduction to Trigonometry",
        youtubeId: "PUB0TaZ7bhA",
        duration: "14 mins",
        xp: 20,
        notes: `
Trigonometry studies relationships between angles and sides.

SOH CAH TOA
        `,
      },
    ],
  },

  physics: {
    mechanics: [
      {
        slug: "motion-and-speed",
        title: "Motion and Speed",
        youtubeId: "ZmWzwq2z8ZY",
        duration: "16 mins",
        xp: 20,
        notes: `
Speed = Distance ÷ Time

Motion describes movement from one position to another.
        `,
      },
    ],
  },

  chemistry: {
    atoms: [
      {
        slug: "introduction-to-atoms",
        title: "Introduction to Atoms",
        youtubeId: "FSyAehMdpyI",
        duration: "15 mins",
        xp: 20,
        notes: `
Atoms are the building blocks of matter.

They contain:
• Protons
• Neutrons
• Electrons
        `,
      },
    ],
  },

  biology: {
    cells: [
      {
        slug: "introduction-to-cells",
        title: "Introduction to Cells",
        youtubeId: "URUJD5NEXC8",
        duration: "15 mins",
        xp: 20,
        notes: `
Cells are the basic units of life.

Types:
• Plant cells
• Animal cells
        `,
      },
    ],
  },
} as const;