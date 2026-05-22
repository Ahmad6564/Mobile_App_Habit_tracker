import { useMemo } from "react";
import { today, useAppStore } from "../store/useAppStore";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarPage() {
  const {
    habits,
    tasks,
    viewYear,
    viewMonth,
    isCurrentMonth,
    goPrevMonth,
    goNextMonth,
    goThisMonth
  } = useAppStore();
  const todayKey = today();

  const grid = useMemo(() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay(); // 0 Sun..6 Sat
    const lead = firstDow === 0 ? 6 : firstDow - 1; // pad so Mon is first
    const last = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < lead; i += 1) cells.push(null);
    for (let d = 1; d <= last; d += 1) {
      const date = new Date(viewYear, viewMonth, d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${day}`;

      const totalGoal = habits.reduce((s, h) => s + h.goal, 0);
      const totalDone = habits.reduce(
        (s, h) => s + Math.min(h.goal, h.logs?.[key] || 0),
        0
      );
      const pct = totalGoal ? Math.round((totalDone / totalGoal) * 100) : 0;
      const dayHabits = habits.filter((h) => (h.logs?.[key] || 0) >= h.goal);
      const dayTasks = (tasks || []).filter((t) => t.due === key);
      cells.push({ key, day: d, pct, dayHabits, dayTasks, isToday: key === todayKey });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [habits, tasks, viewYear, viewMonth, todayKey]);

  const monthHabitsDone = grid.filter(Boolean).reduce(
    (s, c) => s + c.dayHabits.length,
    0
  );
  const fullDays = grid.filter((c) => c && c.pct >= 100).length;

  return (
    <section className="stack">
      <div className="card month-bar">
        <div className="month-left">
          <p className="eyebrow">Calendar</p>
          <h2 className="hero-title">
            {MONTHS[viewMonth]} <span className="muted small">{viewYear}</span>
          </h2>
        </div>
        <div className="month-nav">
          <button className="ghost-btn" onClick={goPrevMonth}>◀ Prev</button>
          <button
            className={`ghost-btn ${isCurrentMonth ? "active" : ""}`}
            onClick={goThisMonth}
          >
            This Month
          </button>
          <button className="ghost-btn" onClick={goNextMonth}>Next ▶</button>
        </div>
        <div className="month-meta">
          <div><span className="muted small">Habits done</span><strong>{monthHabitsDone}</strong></div>
          <div><span className="muted small">Perfect days</span><strong>{fullDays}</strong></div>
        </div>
        <div className="month-actions">
          <span className="cal-legend">
            <i className="lvl lvl-1" /><i className="lvl lvl-2" /><i className="lvl lvl-3" /><i className="lvl lvl-4" />
            <span className="muted small">low → high</span>
          </span>
        </div>
      </div>

      <div className="card">
        <div className="cal-grid-head">
          {DOW.map((d) => (
            <span key={d} className="cal-dow">{d}</span>
          ))}
        </div>
        <div className="cal-grid">
          {grid.map((cell, i) => {
            if (!cell) return <div key={i} className="cal-cell empty" />;
            const lvl =
              cell.pct >= 100 ? 4 :
              cell.pct >= 66 ? 3 :
              cell.pct >= 33 ? 2 :
              cell.pct > 0 ? 1 : 0;
            return (
              <div
                key={i}
                className={`cal-cell lvl-${lvl}${cell.isToday ? " today" : ""}`}
                title={`${cell.key} · ${cell.pct}% habits · ${cell.dayTasks.length} task(s)`}
              >
                <div className="cal-head">
                  <span className="cal-day">{cell.day}</span>
                  <span className="cal-pct">{cell.pct}%</span>
                </div>
                <div className="cal-icons">
                  {cell.dayHabits.slice(0, 4).map((h) => (
                    <span key={h.id} title={h.name}>{h.icon}</span>
                  ))}
                  {cell.dayHabits.length > 4 && (
                    <span className="more">+{cell.dayHabits.length - 4}</span>
                  )}
                </div>
                {cell.dayTasks.length > 0 && (
                  <span className="cal-tasks">📋 {cell.dayTasks.length}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CalendarPage;
