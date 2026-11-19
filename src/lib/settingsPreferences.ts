export interface LearnovaNotificationPrefs {
  liveClassAlerts: boolean;
  timetableChanges: boolean;
  assignmentReminders: boolean;
  billingUpdates: boolean;
  applicationUpdates: boolean;
}

export interface LearnovaAccessibilityPrefs {
  reducedMotion: boolean;
  highContrast: boolean;
  lowDataMode: boolean;
}

export const DEFAULT_NOTIFICATION_PREFS: LearnovaNotificationPrefs = {
  liveClassAlerts: true,
  timetableChanges: true,
  assignmentReminders: true,
  billingUpdates: true,
  applicationUpdates: true,
};

export const DEFAULT_ACCESSIBILITY_PREFS: LearnovaAccessibilityPrefs = {
  reducedMotion: false,
  highContrast: false,
  lowDataMode: true,
};

export function readNotificationPrefs(): LearnovaNotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_PREFS;
  try {
    const raw = localStorage.getItem("learnova_notification_prefs");
    if (!raw) return DEFAULT_NOTIFICATION_PREFS;
    return { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_PREFS;
  }
}

export function saveNotificationPrefs(prefs: LearnovaNotificationPrefs) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("learnova_notification_prefs", JSON.stringify(prefs));
  } catch {}
}

export function readAccessibilityPrefs(): LearnovaAccessibilityPrefs {
  if (typeof window === "undefined") return DEFAULT_ACCESSIBILITY_PREFS;
  try {
    const reducedMotion = localStorage.getItem("learnova_reduced_motion") === "true";
    const highContrast = localStorage.getItem("learnova_high_contrast") === "true";
    const lowDataRaw = localStorage.getItem("learnova_low_data_mode");
    const lowDataMode = lowDataRaw === null ? true : lowDataRaw === "true";
    return { reducedMotion, highContrast, lowDataMode };
  } catch {
    return DEFAULT_ACCESSIBILITY_PREFS;
  }
}

export function applyAccessibilityPrefsToDocument(prefs: LearnovaAccessibilityPrefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.toggle("learnova-reduced-motion", prefs.reducedMotion);
  root.classList.toggle("learnova-high-contrast", prefs.highContrast);
}

export function saveAccessibilityPrefs(prefs: LearnovaAccessibilityPrefs) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("learnova_reduced_motion", String(prefs.reducedMotion));
      localStorage.setItem("learnova_high_contrast", String(prefs.highContrast));
      localStorage.setItem("learnova_low_data_mode", String(prefs.lowDataMode));
    } catch {}
  }
  applyAccessibilityPrefsToDocument(prefs);
}
