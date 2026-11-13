export const CURRENT_ACADEMIC_TERM = "2025/2026 Session · Second Term (Week 7)";
export const TIMEZONE_LABEL = "WAT (Africa/Lagos)";

export function formatLagosTime(isoOrDate?: string | Date): string {
  const date = isoOrDate ? new Date(isoOrDate) : new Date();
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatLagosDate(isoOrDate?: string | Date): string {
  const date = isoOrDate ? new Date(isoOrDate) : new Date();
  return new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);
}

export interface StudentCourse {
  id: string;
  name: string;
  code: string;
  level: string;
  examTrack: string;
  teacher: string;
  lessons: number;
  completedLessons: number;
  topics: number;
  progress: number;
  nextTopic: string;
  description: string;
}

export const NIGERIAN_SUBJECTS: StudentCourse[] = [
  {
    id: "mathematics",
    name: "Mathematics",
    code: "MTH 201",
    level: "SSS 2 Science",
    examTrack: "WAEC & JAMB Core",
    teacher: "Mrs. Funke Adewale",
    lessons: 32,
    completedLessons: 23,
    topics: 12,
    progress: 72,
    nextTopic: "Quadratic Equations & Parabola Graphs",
    description: "Algebra, indices, geometry, trigonometry and calculus tailored to NERDC & WAEC syllabi.",
  },
  {
    id: "english",
    name: "English Language",
    code: "ENG 201",
    level: "SSS 2 Core",
    examTrack: "WAEC & NECO Core",
    teacher: "Mrs. Titilayo Ojo",
    lessons: 28,
    completedLessons: 22,
    topics: 10,
    progress: 79,
    nextTopic: "Comprehension, Lexis & Structure",
    description: "Essay writing, oral English, summary skills, and comprehension passages.",
  },
  {
    id: "physics",
    name: "Physics",
    code: "PHY 202",
    level: "SSS 2 Science",
    examTrack: "WAEC & JAMB",
    teacher: "Mr. Chinedu Emeka",
    lessons: 24,
    completedLessons: 16,
    topics: 8,
    progress: 67,
    nextTopic: "Newton's Laws & Linear Momentum",
    description: "Mechanics, optics, waves, electricity and practical laboratory preparation.",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    code: "CHM 203",
    level: "SSS 2 Science",
    examTrack: "WAEC & NECO",
    teacher: "Dr. Ibrahim Bello",
    lessons: 22,
    completedLessons: 11,
    topics: 9,
    progress: 50,
    nextTopic: "Hydrocarbons & Organic Functional Groups",
    description: "Atomic structure, stoichiometry, periodicity, acids, bases and organic chemistry.",
  },
  {
    id: "biology",
    name: "Biology",
    code: "BIO 201",
    level: "SSS 2 Science",
    examTrack: "WAEC & JAMB",
    teacher: "Mrs. Ngozi Nwosu",
    lessons: 25,
    completedLessons: 13,
    topics: 11,
    progress: 52,
    nextTopic: "Cell Structure, Osmosis & Diffusion",
    description: "Cell biology, ecology, genetics, mammalian anatomy and Nigerian ecosystems.",
  },
  {
    id: "civic-education",
    name: "Civic Education",
    code: "CIV 201",
    level: "SSS 2 Compulsory",
    examTrack: "WAEC & NECO",
    teacher: "Mr. Babatunde Salami",
    lessons: 18,
    completedLessons: 15,
    topics: 7,
    progress: 83,
    nextTopic: "Constitutional Democracy & Rule of Law",
    description: "Citizenship, national values, human rights and public institutions in Nigeria.",
  },
];

export interface TimetableSlot {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
  timeWat: string;
  subject: string;
  classLevel: string;
  teacher: string;
  roomOrClassId: string;
  mode: "Live Class" | "CBT Practice" | "Lab Review";
}

export const WEEKLY_TIMETABLE: TimetableSlot[] = [
  {
    id: "tt-1",
    day: "Monday",
    timeWat: "08:30 AM – 09:30 AM WAT",
    subject: "Mathematics",
    classLevel: "SSS 2 Science",
    teacher: "Mrs. Funke Adewale",
    roomOrClassId: "math-001",
    mode: "Live Class",
  },
  {
    id: "tt-2",
    day: "Monday",
    timeWat: "10:00 AM – 11:00 AM WAT",
    subject: "Physics",
    classLevel: "SSS 2 Science",
    teacher: "Mr. Chinedu Emeka",
    roomOrClassId: "science-001",
    mode: "Live Class",
  },
  {
    id: "tt-3",
    day: "Tuesday",
    timeWat: "09:00 AM – 10:00 AM WAT",
    subject: "English Language",
    classLevel: "SSS 2 Core",
    teacher: "Mrs. Titilayo Ojo",
    roomOrClassId: "english-001",
    mode: "Live Class",
  },
  {
    id: "tt-4",
    day: "Wednesday",
    timeWat: "11:30 AM – 12:30 PM WAT",
    subject: "Chemistry",
    classLevel: "SSS 2 Science",
    teacher: "Dr. Ibrahim Bello",
    roomOrClassId: "chemistry-001",
    mode: "Live Class",
  },
  {
    id: "tt-5",
    day: "Thursday",
    timeWat: "02:00 PM – 03:00 PM WAT",
    subject: "Biology",
    classLevel: "SSS 2 Science",
    teacher: "Mrs. Ngozi Nwosu",
    roomOrClassId: "biology-001",
    mode: "Lab Review",
  },
  {
    id: "tt-6",
    day: "Friday",
    timeWat: "10:00 AM – 11:00 AM WAT",
    subject: "JAMB / WAEC CBT Mock",
    classLevel: "SSS 2 – SSS 3",
    teacher: "Academic Assessment Unit",
    roomOrClassId: "math-001",
    mode: "CBT Practice",
  },
];

export interface StudentAssignmentItem {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  teacher: string;
  dueDate: string;
  marks: number;
  status: "Pending" | "Submitted" | "Graded";
  score?: number;
  instructions: string;
}

export const NIGERIAN_ASSIGNMENTS: StudentAssignmentItem[] = [
  {
    id: "quadratic-equations",
    title: "Quadratic Equations & Factorization Worksheet",
    subject: "Mathematics",
    classLevel: "SSS 2 Science",
    teacher: "Mrs. Funke Adewale",
    dueDate: "Tomorrow, 6:00 PM WAT",
    marks: 100,
    status: "Pending",
    instructions:
      "Solve by factorization and formula method: (1) x² + 5x + 6 = 0, (2) 2x² - 7x + 3 = 0, (3) Sketch y = x² - 4x + 3 showing vertex and intercepts.",
  },
  {
    id: "newtons-laws",
    title: "Newton's Laws & Momentum Calculations",
    subject: "Physics",
    classLevel: "SSS 2 Science",
    teacher: "Mr. Chinedu Emeka",
    dueDate: "Friday, 4:00 PM WAT",
    marks: 100,
    status: "Pending",
    instructions:
      "State Newton's three laws of motion and calculate impulse for a 1,200 kg vehicle decelerating from 25 m/s to rest in 4 seconds.",
  },
  {
    id: "waec-essay",
    title: "WAEC Formal Letter & Comprehension Summary",
    subject: "English Language",
    classLevel: "SSS 2 Core",
    teacher: "Mrs. Titilayo Ojo",
    dueDate: "Submitted",
    marks: 50,
    status: "Graded",
    score: 43,
    instructions:
      "Write a formal letter to your Local Government Education Authority proposing solar power for community school libraries (450 words).",
  },
  {
    id: "cell-structure",
    title: "Plant & Animal Cell Ultrastructure",
    subject: "Biology",
    classLevel: "SSS 2 Science",
    teacher: "Mrs. Ngozi Nwosu",
    dueDate: "Submitted",
    marks: 100,
    status: "Submitted",
    instructions:
      "Compare eukaryotic plant and animal cells across 5 organelles and explain plasmolysis in yam strips.",
  },
];

export const NIGERIAN_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Mathematics Live Class is active",
    detail: "Mrs. Funke Adewale started Quadratic Equations (SSS 2)",
    time: "Now · WAT",
    href: "/live-classes/math-001",
    unread: true,
  },
  {
    id: "n2",
    title: "Assignment due tomorrow",
    detail: "Quadratic Equations & Factorization Worksheet due 6:00 PM WAT",
    time: "35 mins ago",
    href: "/assignments",
    unread: true,
  },
  {
    id: "n3",
    title: "WAEC English Essay graded",
    detail: "You scored 43/50 (86%) with teacher remarks",
    time: "2 hours ago",
    href: "/assignments",
    unread: false,
  },
];

export const TEACHER_CLASSES = [
  {
    id: "math-001",
    className: "SSS 2 Science — Cohort A",
    subject: "Mathematics",
    schedule: "Mon & Wed · 08:30 AM WAT",
    studentsCount: 38,
    attendanceRate: 94,
    pendingSubmissions: 9,
    nextTopic: "Quadratic Equations & Parabola Vertex",
    status: "live" as const,
  },
  {
    id: "science-001",
    className: "SSS 2 Science — Cohort B",
    subject: "Physics",
    schedule: "Tue & Thu · 10:00 AM WAT",
    studentsCount: 34,
    attendanceRate: 91,
    pendingSubmissions: 6,
    nextTopic: "Newton's Laws & Momentum",
    status: "scheduled" as const,
  },
  {
    id: "sss3-jamb",
    className: "SSS 3 WAEC & JAMB Intensive",
    subject: "Further Mathematics",
    schedule: "Fri · 02:00 PM WAT",
    studentsCount: 45,
    attendanceRate: 97,
    pendingSubmissions: 4,
    nextTopic: "Differential Calculus Past Questions",
    status: "scheduled" as const,
  },
];

export const TEACHER_STUDENTS = [
  { id: "st-1", name: "Chidi Nwankwo", classLevel: "SSS 2 Science", attendance: "96%", avgScore: "88%", assignmentsDone: "11/12", status: "On Track" },
  { id: "st-2", name: "Amina Yusuf", classLevel: "SSS 2 Science", attendance: "98%", avgScore: "92%", assignmentsDone: "12/12", status: "Top Performer" },
  { id: "st-3", name: "Toluwani Adeyemi", classLevel: "SSS 2 Science", attendance: "89%", avgScore: "76%", assignmentsDone: "10/12", status: "On Track" },
  { id: "st-4", name: "Kelechi Okafor", classLevel: "SSS 2 Science", attendance: "78%", avgScore: "64%", assignmentsDone: "8/12", status: "Needs Attention" },
  { id: "st-5", name: "Zainab Musa", classLevel: "SSS 3 Intensive", attendance: "95%", avgScore: "85%", assignmentsDone: "11/12", status: "On Track" },
  { id: "st-6", name: "Damilola Balogun", classLevel: "SSS 3 Intensive", attendance: "92%", avgScore: "81%", assignmentsDone: "10/12", status: "On Track" },
];
