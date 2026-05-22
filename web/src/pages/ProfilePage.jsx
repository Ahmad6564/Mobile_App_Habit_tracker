import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "../components/Icon";
import { computeStreak, useAppStore } from "../store/useAppStore";

const GENDERS = ["", "Female", "Male", "Non-binary", "Prefer not to say"];

function calcAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function bmi(h, w) {
  const hm = Number(h) / 100;
  const wk = Number(w);
  if (!hm || !wk) return null;
  return (wk / (hm * hm)).toFixed(1);
}

function ProfilePage() {
  const { profile, updateProfile, habits, posts } = useAppStore();
  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const longestStreak = useMemo(
    () => habits.reduce((m, h) => Math.max(m, computeStreak(h)), 0),
    [habits]
  );
  const age = calcAge(profile.dob);
  const bmiVal = bmi(profile.heightCm, profile.weightKg);

  return (
    <div className="stack">
      <div className="profile-head card">
        <div className="profile-avatar">
          {(form.name || "U").charAt(0).toUpperCase()}
        </div>
        <div className="grow">
          <h2 className="hero-title">{profile.name || "Your profile"}</h2>
          <p className="muted small">@{profile.username || "you"} · {profile.country || "—"} · {profile.timezone}</p>
          <div className="profile-stats">
            <span><Icon name="habit" size={14} /> {habits.length} habits</span>
            <span><Icon name="flame" size={14} /> {longestStreak}d longest streak</span>
            <span><Icon name="community" size={14} /> {posts.length} posts</span>
            {age != null && <span><Icon name="user" size={14} /> {age} yrs</span>}
            {bmiVal && <span><Icon name="spark" size={14} /> BMI {bmiVal}</span>}
          </div>
        </div>
        <Link to="/referral" className="ghost-btn"><Icon name="refer" size={16} /> Refer</Link>
      </div>

      <form className="card form-card" onSubmit={submit}>
        <h4>Personal info</h4>
        <div className="grid-2">
          <label>
            Display name
            <input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </label>
          <label>
            Username
            <input value={form.username} onChange={(e) => set("username", e.target.value.replace(/\s/g, ""))} />
          </label>
        </div>
        <div className="grid-3">
          <label>
            Date of birth
            <input type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
          </label>
          <label>
            Gender
            <select value={form.gender} onChange={(e) => set("gender", e.target.value)}>
              {GENDERS.map((g) => <option key={g} value={g}>{g || "—"}</option>)}
            </select>
          </label>
          <label>
            Country
            <input value={form.country} onChange={(e) => set("country", e.target.value)} placeholder="PK, US, UK…" />
          </label>
        </div>
        <div className="grid-3">
          <label>
            Height (cm)
            <input type="number" min="50" max="250" value={form.heightCm} onChange={(e) => set("heightCm", e.target.value)} />
          </label>
          <label>
            Weight (kg)
            <input type="number" min="20" max="400" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} />
          </label>
          <label>
            Timezone
            <input value={form.timezone} onChange={(e) => set("timezone", e.target.value)} />
          </label>
        </div>
        <label>
          Bio
          <textarea
            value={form.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="A short intro to your followers"
          />
        </label>
        <label>
          What are you working on?
          <textarea
            value={form.goalsStatement}
            onChange={(e) => set("goalsStatement", e.target.value)}
            placeholder="e.g. Run a 10k by August, build a daily reading habit"
          />
        </label>
        <div className="row-end">
          {saved && <span className="muted small">Saved ✓</span>}
          <button type="submit" className="primary-btn">Save profile</button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
