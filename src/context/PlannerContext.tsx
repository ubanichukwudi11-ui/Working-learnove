"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  PlannerNotification,
  PlannerState,
} from "@/types/planner";

interface PlannerContextType extends PlannerState {
  addXP: (amount: number) => void;
  addCoins: (amount: number) => void;

  setTaskStats: (
    completed: number,
    total: number
  ) => void;

  addNotification: (
    message: string
  ) => void;
}

const PlannerContext =
  createContext<PlannerContextType | null>(
    null
  );

export function PlannerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] =
    useState<PlannerState>({
      xp: 0,
      coins: 0,
      completedTasks: 0,
      totalTasks: 0,
      notifications: [],
    });

  useEffect(() => {
    const saved =
      localStorage.getItem("planner-state");

    if (saved) {
      setState(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "planner-state",
      JSON.stringify(state)
    );
  }, [state]);

  const addXP = (amount: number) => {
    setState((prev) => ({
      ...prev,
      xp: prev.xp + amount,
    }));
  };

  const addCoins = (amount: number) => {
    setState((prev) => ({
      ...prev,
      coins: prev.coins + amount,
    }));
  };

  const setTaskStats = (
    completed: number,
    total: number
  ) => {
    setState((prev) => ({
      ...prev,
      completedTasks: completed,
      totalTasks: total,
    }));
  };

  const addNotification = (
    message: string
  ) => {
    const notification: PlannerNotification =
      {
        id: crypto.randomUUID(),
        message,
        createdAt:
          new Date().toISOString(),
      };

    setState((prev) => ({
      ...prev,
      notifications: [
        notification,
        ...prev.notifications,
      ],
    }));
  };

  return (
    <PlannerContext.Provider
      value={{
        ...state,
        addXP,
        addCoins,
        setTaskStats,
        addNotification,
      }}
    >
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const context =
    useContext(PlannerContext);

  if (!context) {
    throw new Error(
      "usePlanner must be used inside PlannerProvider"
    );
  }

  return context;
}