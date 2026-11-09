export interface PlannerNotification {
  id: string;
  message: string;
  createdAt: string;
}

export interface PlannerState {
  xp: number;
  coins: number;
  completedTasks: number;
  totalTasks: number;
  notifications: PlannerNotification[];
}