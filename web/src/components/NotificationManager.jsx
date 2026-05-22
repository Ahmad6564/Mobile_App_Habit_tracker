import { useEffect, useRef } from "react";
import { today, useAppStore } from "../store/useAppStore";

// Schedules browser notifications:
//  - At settings.reminderTime if any habit is incomplete for today
//  - On mount (once per day) if a task is due today
function NotificationManager() {
  const { habits, tasks, settings } = useAppStore();
  const lastTaskAlertRef = useRef("");
  const timerRef = useRef(null);

  // Daily reminder for missed habits (scheduled at reminderTime, local)
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (!settings?.notifications) return undefined;
    if (!("Notification" in window) || Notification.permission !== "granted") return undefined;

    const [hh, mm] = (settings.reminderTime || "21:30").split(":").map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hh, mm, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 1);
    const ms = target.getTime() - now.getTime();

    timerRef.current = window.setTimeout(() => {
      const t = today();
      const missed = habits.filter((h) => (h.logs?.[t] || 0) < h.goal);
      if (missed.length) {
        try {
          new Notification("HabitForge reminder", {
            body: `You missed ${missed.length} habit${missed.length > 1 ? "s" : ""} today: ${missed
              .slice(0, 3)
              .map((h) => h.name)
              .join(", ")}${missed.length > 3 ? "…" : ""}`,
            tag: `missed-${t}`
          });
        } catch {
          /* ignore */
        }
      }
    }, ms);

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [habits, settings?.notifications, settings?.reminderTime]);

  // Task-due-today notification (fired once per day)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!settings?.notifications) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const t = today();
    if (lastTaskAlertRef.current === t) return;
    const due = tasks.filter((task) => !task.done && task.due === t);
    if (due.length === 0) return;

    try {
      new Notification("Tasks due today", {
        body: `${due.length} task${due.length > 1 ? "s" : ""}: ${due
          .slice(0, 3)
          .map((task) => task.title)
          .join(", ")}${due.length > 3 ? "…" : ""}`,
        tag: `due-${t}`
      });
      lastTaskAlertRef.current = t;
    } catch {
      /* ignore */
    }
  }, [tasks, settings?.notifications]);

  return null;
}

export default NotificationManager;
