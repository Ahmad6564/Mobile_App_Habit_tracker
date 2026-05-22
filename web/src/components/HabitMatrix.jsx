import { useState } from "react";
import Icon from "./Icon";
import { today } from "../store/useAppStore";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function HabitMatrix({ habits, weeks, weekStats, onToggle }) {
  const todayKey = today();
  const [expanded, setExpanded] = useState(false);

  // Find which week contains today
  const currentWeekIdx = weeks.findIndex((days) => days.includes(todayKey));
  const activeWeekIdx = currentWeekIdx >= 0 ? currentWeekIdx : weeks.length - 1;

  // Show only the current week unless expanded
  const visibleWeeks = expanded ? weeks : [weeks[activeWeekIdx]].filter(Boolean);
  const visibleStats = expanded ? weekStats : [weekStats[activeWeekIdx]].filter(Boolean);
  const visibleWeekOffset = expanded ? 0 : activeWeekIdx;

  return (
    <div className="matrix-outer">
      <div className="matrix-toolbar">
        <button
          className="ghost-btn small"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show current week" : "Show full month"}
        </button>
      </div>
      <div className="matrix-wrap">
      <table className="matrix-table">
        <colgroup>
          <col className="col-habit" />
          <col className="col-goal" />
          <col className="col-done" />
        </colgroup>
        <thead>
          <tr className="week-row">
            <th rowSpan={3} className="sticky-col sticky-habit">Habit</th>
            <th rowSpan={3} className="sticky-col sticky-goal num">Goal</th>
            <th rowSpan={3} className="sticky-col sticky-done num">Done</th>
            {visibleWeeks.map((days, wi) => (
              <th key={wi} className="week-head" colSpan={days.length}>
                WEEK {visibleWeekOffset + wi + 1}
              </th>
            ))}
          </tr>
          <tr className="dow-row">
            {visibleWeeks.map((days, wi) =>
              days.map((d, i) => {
                const lbl = d ? DOW[new Date(d + "T00:00:00").getDay()] : "";
                return <th key={`${wi}-${i}`} className="dow">{lbl}</th>;
              })
            )}
          </tr>
          <tr className="num-row">
            {visibleWeeks.map((days, wi) =>
              days.map((d, i) => (
                <th key={`${wi}-${i}-n`} className={d === todayKey ? "today" : ""}>
                  {d ? new Date(d + "T00:00:00").getDate() : ""}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {habits.map((h) => {
            const doneCount = visibleWeeks
              .flat()
              .filter(Boolean)
              .reduce((acc, d) => acc + (h.logs?.[d] >= h.goal ? 1 : 0), 0);
            return (
              <tr key={h.id}>
                <td className="habit-cell sticky-col sticky-habit">
                  <span className="habit-cell-inner">
                    <span className="dot" style={{ background: h.color }} />
                    <span
                      className="habit-icon-bubble"
                      style={{ background: `${h.color}33`, color: h.color }}
                    >
                      <Icon name={h.icon} size={14} />
                    </span>
                    <span className="habit-name">{h.name}</span>
                  </span>
                </td>
                <td className="num sticky-col sticky-goal">{h.goal}</td>
                <td className="num sticky-col sticky-done done-count">{doneCount}</td>
                {visibleWeeks.map((days, wi) =>
                  days.map((d, i) => {
                    if (!d) return <td key={`${wi}-${i}-c`} className="cell empty" />;
                    const val = h.logs?.[d] || 0;
                    const filled = val >= h.goal;
                    const future = d > todayKey;
                    return (
                      <td
                        key={`${wi}-${i}-c`}
                        className={`cell ${filled ? "filled" : ""} ${future ? "future" : ""} ${d === todayKey ? "is-today" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => !future && onToggle?.(h.id, d)}
                          aria-label={`${h.name} ${d}`}
                          disabled={future}
                        >
                          {filled ? <Icon name="check" size={14} /> : ""}
                        </button>
                      </td>
                    );
                  })
                )}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="weekly-progress-row">
            <td colSpan={3} className="sticky-col sticky-habit foot-label">
              Weekly Progress
            </td>
            {visibleStats.map((w, wi) => (
              <td key={`wp-${wi}`} className="week-progress-cell" colSpan={w.days.length}>
                <div className="wp-bar">
                  <div
                    className="wp-fill"
                    style={{ width: `${Math.max(2, w.pct)}%` }}
                  />
                  <span className="wp-text">
                    {w.pct}% · {w.fullChecks}/{w.possibleChecks}
                  </span>
                </div>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
      </div>
    </div>
  );
}

export default HabitMatrix;
