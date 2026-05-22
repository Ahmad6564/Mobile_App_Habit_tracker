import { useState } from "react";
import Icon, { HABIT_ICONS } from "../components/Icon";
import { computeStreak, today, useAppStore } from "../store/useAppStore";

const PRESETS = [
  { name: "Workout", icon: "gym", unit: "session", goal: 1, category: "Fitness" },
  { name: "Walk 10k Steps", icon: "walk", unit: "steps", goal: 10000, category: "Fitness" },
  { name: "Drink Water", icon: "water", unit: "glasses", goal: 8, category: "Health" },
  { name: "Read", icon: "book", unit: "pages", goal: 20, category: "Growth" },
  { name: "Sleep 8h", icon: "sleep", unit: "hours", goal: 8, category: "Health" },
  { name: "Journal", icon: "journal", unit: "entry", goal: 1, category: "Mind" },
  { name: "Meditate", icon: "meditate", unit: "minutes", goal: 10, category: "Mind" },
  { name: "Learn Code", icon: "code", unit: "minutes", goal: 30, category: "Growth" }
];

const CATEGORIES = ["General", "Fitness", "Health", "Mind", "Growth", "Diet", "Work", "Social"];

function HabitsPage() {
  const { habits, addHabit, deleteHabit, toggleHabit, updateHabit } = useAppStore();
  const [draft, setDraft] = useState({
    name: "",
    icon: "spark",
    goal: 1,
    unit: "times",
    category: "General"
  });
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState(null);
  const todayKey = today();

  const submit = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    addHabit(draft);
    setDraft({ name: "", icon: "spark", goal: 1, unit: "times", category: "General" });
  };

  const startEdit = (h) => {
    setEditingId(h.id);
    setEdit({ name: h.name, icon: h.icon, goal: h.goal, unit: h.unit, category: h.category });
  };

  const saveEdit = () => {
    updateHabit(editingId, edit);
    setEditingId(null);
    setEdit(null);
  };

  const filtered = habits;

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <h3>Habits</h3>
          <p className="muted small">Build any habit. Daily, weekly, or monthly cadence.</p>
        </div>
      </div>

      <div className="grid-2 align-start">
        <form className="card form-card" onSubmit={submit}>
          <h4>Create a habit</h4>

          <label>
            Habit name
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="e.g. Morning run, Read 20 pages, Cold shower"
              required
            />
          </label>

          <div className="grid-3">
            <label>
              Goal
              <input
                type="number"
                min="1"
                value={draft.goal}
                onChange={(e) => setDraft({ ...draft, goal: Number(e.target.value) })}
              />
            </label>
            <label>
              Unit
              <input
                value={draft.unit}
                onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                placeholder="glasses, pages, minutes"
              />
            </label>
            <label>
              Category
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>

          <label>
            Icon
            <div className="icon-picker">
              {HABIT_ICONS.map((i) => (
                <button
                  type="button"
                  key={i}
                  className={`icon-chip${draft.icon === i ? " active" : ""}`}
                  onClick={() => setDraft({ ...draft, icon: i })}
                  aria-label={i}
                >
                  <Icon name={i} size={18} />
                </button>
              ))}
            </div>
          </label>

          <div className="row-end">
            <button type="submit" className="primary-btn">
              <Icon name="plus" size={14} /> Add habit
            </button>
          </div>

          <div className="presets">
            <p className="muted small">Quick presets</p>
            <div className="preset-row">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  className="preset-chip"
                  onClick={() => addHabit(p)}
                >
                  <Icon name={p.icon} size={14} /> {p.name}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="card">
          <div className="card-head">
            <h4>Your habits ({filtered.length})</h4>
            <span className="muted small">Click the circle to log 1 done today. Streak = consecutive days you hit your goal.</span>
          </div>
          <ul className="habit-list">
            {filtered.map((h) => {
              const done = (h.logs?.[todayKey] || 0) >= h.goal;
              const streak = computeStreak(h);
              const isEditing = editingId === h.id;
              if (isEditing) {
                return (
                  <li key={h.id} className="habit-row editing">
                    <div className="edit-grid">
                      <input
                        value={edit.name}
                        onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                        placeholder="Name"
                      />
                      <input
                        type="number"
                        min="1"
                        value={edit.goal}
                        onChange={(e) => setEdit({ ...edit, goal: Number(e.target.value) })}
                      />
                      <input
                        value={edit.unit}
                        onChange={(e) => setEdit({ ...edit, unit: e.target.value })}
                      />
                      <select
                        value={edit.category}
                        onChange={(e) => setEdit({ ...edit, category: e.target.value })}
                      >
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="icon-picker compact">
                        {HABIT_ICONS.map((i) => (
                          <button
                            type="button"
                            key={i}
                            className={`icon-chip${edit.icon === i ? " active" : ""}`}
                            onClick={() => setEdit({ ...edit, icon: i })}
                          >
                            <Icon name={i} size={14} />
                          </button>
                        ))}
                      </div>
                      <div className="edit-actions">
                        <button type="button" className="primary-btn small" onClick={saveEdit}>
                          Save
                        </button>
                        <button type="button" className="ghost-btn small" onClick={() => setEditingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  </li>
                );
              }
              return (
                <li key={h.id} className="habit-row">
                  <button
                    className={`check ${done ? "checked" : ""}`}
                    style={{ borderColor: h.color }}
                    onClick={() => toggleHabit(h.id)}
                    title={done ? "Already done today — click to uncheck" : "Log 1 done for today"}
                  >
                    {done ? <Icon name="check" size={14} /> : ""}
                  </button>
                  <span className="habit-icon-bubble" style={{ background: `${h.color}33`, color: h.color }}>
                    <Icon name={h.icon} size={16} />
                  </span>
                  <div className="grow">
                    <strong>{h.name}</strong>
                    <p className="muted small">
                      {h.goal} {h.unit} · {h.category} · streak {streak}d
                    </p>
                  </div>
                  <button className="ghost-btn small" onClick={() => startEdit(h)} aria-label="Edit habit">
                    <Icon name="edit" size={14} />
                  </button>
                  <button
                    className="ghost-btn small danger"
                    onClick={() => deleteHabit(h.id)}
                    aria-label="Delete habit"
                  >
                    <Icon name="trash" size={14} />
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && <p className="muted">No habits match.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HabitsPage;
