import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { useAppStore } from "../store/useAppStore";

function SettingsPage() {
  const { settings, updateSettings, setTheme, profile } = useAppStore();
  const [perm, setPerm] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [saved, setSaved] = useState(false);

  const set = (k, v) => updateSettings({ [k]: v });

  const requestPermission = async () => {
    if (typeof Notification === "undefined") {
      alert("This browser does not support notifications.");
      return;
    }
    const result = await Notification.requestPermission();
    setPerm(result);
    if (result === "granted") set("notifications", true);
  };

  const sendTest = () => {
    if (perm !== "granted") return;
    new Notification("HabitForge test", {
      body: `Reminders are set for ${settings.reminderTime}. We will nudge you if any habit is missed.`
    });
  };

  return (
    <div className="stack">
      <h3>Settings</h3>

      <div className="card form-card">
        <h4><Icon name="sun" size={16} /> Appearance</h4>
        <div className="theme-row">
          <button
            className={`theme-chip${settings.theme === "dark" ? " active" : ""}`}
            onClick={() => setTheme("dark")}
          >
            <Icon name="moon" size={16} /> Dark
          </button>
          <button
            className={`theme-chip${settings.theme === "light" ? " active" : ""}`}
            onClick={() => setTheme("light")}
          >
            <Icon name="sun" size={16} /> Light
          </button>
        </div>
      </div>

      <div className="card form-card">
        <h4><Icon name="bell" size={16} /> Notifications</h4>
        <p className="muted small">
          We will remind you before midnight (your local timezone) if you have missed any habit today,
          and ping you when a task is due today.
        </p>

        <div className="perm-row">
          <strong>Permission:</strong>
          <span className={`pill ${perm === "granted" ? "p-low" : perm === "denied" ? "p-high" : "p-medium"}`}>{perm}</span>
          {perm !== "granted" && (
            <button className="primary-btn small" onClick={requestPermission}>Enable notifications</button>
          )}
          {perm === "granted" && (
            <button className="ghost-btn small" onClick={sendTest}>Send test</button>
          )}
        </div>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.notifications}
            onChange={(e) => set("notifications", e.target.checked)}
            disabled={perm !== "granted"}
          />
          <span>Send me reminders</span>
        </label>

        <label>
          Reminder time (local)
          <input
            type="time"
            value={settings.reminderTime}
            onChange={(e) => set("reminderTime", e.target.value)}
          />
        </label>

        <p className="muted small">
          Timezone detected: <strong>{profile.timezone || "—"}</strong>
        </p>
      </div>

      <div className="card form-card">
        <h4><Icon name="user" size={16} /> Privacy</h4>
        <label>
          Profile visibility
          <select
            value={settings.privacy}
            onChange={(e) => set("privacy", e.target.value)}
          >
            <option value="public">Public</option>
            <option value="followers">Followers only</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label>
          Daily calorie target
          <input
            type="number"
            value={settings.calorieTarget}
            onChange={(e) => set("calorieTarget", Number(e.target.value) || 2000)}
          />
        </label>
      </div>

      <div className="card form-card">
        <h4><Icon name="refer" size={16} /> Invite friends</h4>
        <p className="muted small">Share your code — both of you get a perk when they sign up.</p>
        <Link className="primary-btn" to="/referral">Open referral page</Link>
      </div>

      <div className="row-end">
        {saved && <span className="muted small">Saved ✓</span>}
      </div>
    </div>
  );
}

export default SettingsPage;
