export interface LiveClassItem {
  id: string;
  title: string;
  topic?: string;
  teacher: string;
  teacherAvatar?: string;
  subject: string;
  startTime: string;
  endTime: string;
  studentsCount: number;
  status: "live" | "scheduled" | "ended";
  meetLink?: string;
}

export const liveClasses: LiveClassItem[] = [
  {
    id: "math-001",
    title: "Mathematics Live Class",
    topic: "Quadratic Equations: Solving, Graphing and Applications",
    teacher: "Ms. Sarah Johnson",
    teacherAvatar:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    subject: "Mathematics",
    startTime: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 37 * 60 * 1000).toISOString(),
    studentsCount: 24,
    status: "live",
  },
  {
    id: "science-001",
    title: "Physics: Motion and Forces",
    topic: "Newton's Laws of Motion & Momentum",
    teacher: "Mr. James Adeleke",
    teacherAvatar:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    subject: "Physics",
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    studentsCount: 18,
    status: "scheduled",
  },
  {
    id: "chemistry-001",
    title: "Organic Chemistry",
    topic: "Hydrocarbons, Alkanes and Functional Groups",
    teacher: "Dr. Alex Okafor",
    teacherAvatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    subject: "Chemistry",
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    studentsCount: 22,
    status: "scheduled",
  },
];