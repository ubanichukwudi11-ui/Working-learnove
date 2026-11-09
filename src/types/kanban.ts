export type TaskStatus =
  | "todo"
  | "progress"
  | "completed";

export interface KanbanTask {
  id: string;
  title: string;
  status: TaskStatus;
}