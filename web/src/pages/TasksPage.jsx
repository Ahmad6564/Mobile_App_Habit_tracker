import { useMemo, useState } from "react";
import { today, useAppStore } from "../store/useAppStore";

const PRIORITIES = ["low", "medium", "high"];

const formatGroup = (key) => {
  if (!key) return "No date";
  const t = today();
  if (key === t) return "Today";
  const d = new Date(key + "T00:00:00");
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomKey = tom.toISOString().slice(0, 10);
  if (key === tomKey) return "Tomorrow";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
};

function TasksPage() {
  const { tasks, addTask, toggleTask, deleteTask } = useAppStore();
  const todayKey = today();
  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    due: todayKey,
    priority: "medium"
  });
  const [filter, setFilter] = useState("all");

  const submit = (e) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    addTask(draft);
    setDraft({ ...draft, title: "", notes: "" });
  };

  const counts = {
    all: tasks.length,
    open: tasks.filter((t) => !t.done).length,
    today: tasks.filter((t) => t.due === todayKey && !t.done).length,
    overdue: tasks.filter((t) => t.due < todayKey && !t.done).length,
    done: tasks.filter((t) => t.done).length
  };

  const filtered = tasks.filter((t) => {
    if (filter === "open") return !t.done;
    if (filter === "done") return t.done;
    if (filter === "today") return t.due === todayKey && !t.done;
    if (filter === "overdue") return t.due < todayKey && !t.done;
    return true;
  });

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((t) => {
      const k = t.done ? "done" : t.due || "none";
      groups[k] = groups[k] || [];
      groups[k].push(t);
    });
    const keys = Object.keys(groups).sort((a, b) => {
      if (a === "done") return 1;
      if (b === "done") return -1;
      return a.localeCompare(b);
    });
    return keys.map((k) => ({ key: k, items: groups[k] }));
  }, [filtered]);

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <h3>Tasks</h3>
          <p className="muted small">Quick to-dos alongside your habits.</p>
        </div>
        <div className="tabs wrap">
          {["all", "today", "overdue", "open", "done"].map((f) => (
            <button
              key={f}
              className={`tab${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f} <span className="count">{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="priority-legend card">
        <strong>Priority guide</strong>
        <span><i className="pill p-high">high</i> Must do today — blocks something or has a hard deadline.</span>
        <span><i className="pill p-medium">medium</i> Important but flexible by a day or two.</span>
        <span><i className="pill p-low">low</i> Nice to have — do it when energy is free.</span>
      </div>

      <div className="task-summary">
        <div className="task-stat">
          <span className="muted small">Open</span>
          <strong>{counts.open}</strong>
        </div>
        <div className="task-stat warn">
          <span className="muted small">Overdue</span>
          <strong>{counts.overdue}</strong>
        </div>
        <div className="task-stat">
          <span className="muted small">Due today</span>
          <strong>{counts.today}</strong>
        </div>
        <div className="task-stat ok">
          <span className="muted small">Done</span>
          <strong>{counts.done}</strong>
        </div>
      </div>

      <div className="grid-2 align-start">
        <form className="card form-card task-form" onSubmit={submit}>
          <h4>New task</h4>
          <label>
            Title
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Schedule dentist appointment"
              required
            />
          </label>
          <label>
            Notes
            <textarea
              value={draft.notes}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Optional details"
            />
          </label>
          <div className="grid-2">
            <label>
              Due
              <input
                type="date"
                value={draft.due}
                onChange={(e) => setDraft({ ...draft, due: e.target.value })}
              />
            </label>
            <label>
              Priority
              <div className="priority-row">
                {PRIORITIES.map((p) => (
                  <button
                    type="button"
                    key={p}
                    className={`pri-chip p-${p}${draft.priority === p ? " active" : ""}`}
                    onClick={() => setDraft({ ...draft, priority: p })}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <div className="row-end">
            <button type="submit" className="primary-btn">+ Add task</button>
          </div>
        </form>

        <div className="card task-board">
          {grouped.length === 0 && <p className="muted">Nothing matches this filter.</p>}
          {grouped.map((g) => (
            <div key={g.key} className="task-group">
              <div className="task-group-head">
                <strong>{g.key === "done" ? "Completed" : formatGroup(g.key)}</strong>
                <span className="muted small">{g.items.length}</span>
              </div>
              <ul className="task-list">
                {g.items.map((t) => {
                  const overdue = !t.done && t.due && t.due < todayKey;
                  return (
                    <li
                      key={t.id}
                      className={`task-row priority-${t.priority}${t.done ? " done" : ""}${overdue ? " overdue" : ""}`}
                    >
                      <button
                        className={`check ${t.done ? "checked" : ""}`}
                        onClick={() => toggleTask(t.id)}
                        aria-label="Toggle task"
                      >
                        {t.done ? "✓" : ""}
                      </button>
                      <div className="grow">
                        <strong>{t.title}</strong>
                        {t.notes && <p className="muted small">{t.notes}</p>}
                        <p className="task-meta">
                          <span className={`pill p-${t.priority}`}>{t.priority}</span>
                          {t.due && (
                            <span className={`due ${overdue ? "warn" : ""}`}>
                              📅 {formatGroup(t.due)}
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        className="ghost-btn small"
                        onClick={() => deleteTask(t.id)}
                        aria-label="Delete task"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TasksPage;
