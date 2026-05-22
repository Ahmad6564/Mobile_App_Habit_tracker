import { Link } from "react-router-dom";
import PieChart from "../components/PieChart";
import HabitMatrix from "../components/HabitMatrix";
import Icon from "../components/Icon";
import { useAppStore } from "../store/useAppStore";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function DashboardPage() {
  const {
    habits,
    tasks,
    stats,
    toggleHabit,
    viewYear,
    viewMonth,
    isCurrentMonth,
    goPrevMonth,
    goNextMonth,
    goThisMonth
  } = useAppStore();
  const openTasks = tasks.filter((t) => !t.done).length;

  return (
    <div className="dashboard">
      <section className="month-bar card">
        <div className="month-left">
          <p className="eyebrow">Habit Tracker</p>
          <h2 className="hero-title">
            {MONTHS[viewMonth]} <span className="muted small">{viewYear}</span>
          </h2>
        </div>
        <div className="month-nav">
          <button className="ghost-btn" onClick={goPrevMonth} aria-label="Previous month">◀ Prev</button>
          <button
            className={`ghost-btn ${isCurrentMonth ? "active" : ""}`}
            onClick={goThisMonth}
          >
            This Month
          </button>
          <button className="ghost-btn" onClick={goNextMonth} aria-label="Next month">Next ▶</button>
        </div>
        <div className="month-meta">
          <div><span className="muted small">Habits</span><strong>{habits.length}</strong></div>
          <div><span className="muted small">Tasks</span><strong>{openTasks}</strong></div>
          <div><span className="muted small">Month avg</span><strong>{stats.monthAvg}%</strong></div>
        </div>
        <div className="month-actions">
          <Link className="primary-btn" to="/habits">+ Habit</Link>
          <Link className="ghost-btn" to="/tasks">+ Task</Link>
        </div>
      </section>

      <section className="card matrix-card">
        <div className="card-head">
          <h3>Daily Habits Matrix</h3>
          <p className="muted small">
            Click any cell to mark the day complete.{" "}
            {isCurrentMonth ? "Today is highlighted." : "Viewing historical month."}
          </p>
        </div>
        {habits.length === 0 ? (
          <div className="empty">
            <p>No habits yet.</p>
            <Link className="primary-btn" to="/habits">Create your first habit</Link>
          </div>
        ) : (
          <HabitMatrix
            habits={habits}
            weeks={stats.weeks}
            weekStats={stats.weekStats}
            onToggle={toggleHabit}
          />
        )}
      </section>

      <section className="analytics-row">
        <div className="card pie-card">
          <div className="card-head">
            <h3>Daily Progress</h3>
            <span className="chip">{stats.todayInMonth ? "Today" : "Last day"}</span>
          </div>
          <PieChart
            done={stats.todayItemsDone}
            total={stats.todayItemsTotal}
            label={`${stats.todayItemsDone}/${stats.todayItemsTotal} items`}
          />
          <div className="pie-split">
            <span><i className="bullet done" /> Habits {stats.todayHabitsDone}/{habits.length}</span>
            <span><i className="bullet pending" /> Tasks {stats.todayTasksDone}/{tasks.length}</span>
          </div>
        </div>

        <div className="card pie-card">
          <div className="card-head">
            <h3>Total Progress</h3>
            <span className="chip">{MONTHS[viewMonth]}</span>
          </div>
          <PieChart
            done={stats.monthTotalDone}
            total={stats.monthTotalGoal}
            label={`${stats.monthTotalDone}/${stats.monthTotalGoal} units`}
          />
          <p className="muted small center">
            Sum of done vs total goals for the whole month.
          </p>
        </div>

        <div className="card top-card">
          <div className="card-head">
            <h3>Top Habits</h3>
            <Link to="/habits" className="link">manage</Link>
          </div>
          <ol className="top-list">
            {stats.top.length === 0 && (
              <p className="muted">Add a habit to see rankings.</p>
            )}
            {stats.top.map((h, i) => (
              <li key={h.id}>
                <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                <span className="icon" style={{ color: h.color }}>
                  <Icon name={h.icon} size={18} />
                </span>
                <span className="name">{h.name}</span>
                <span className="bar">
                  <span
                    style={{
                      width: `${Math.min(100, h.pct)}%`,
                      background: h.color
                    }}
                  />
                </span>
                <strong>{h.pct}%</strong>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

export default DashboardPage;
