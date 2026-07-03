import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";

function SignUpPage() {
  const { register, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    age: "",
    gender: "prefer-not-to-say",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (isLoggedIn) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        age: Number(form.age) || 18,
        gender: form.gender,
        dateOfBirth: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="auth-wrap">
        <article className="card auth-card">
          <h3>Check your email</h3>
          <p>We sent a verification link to <strong>{form.email}</strong>. Verify your email then sign in.</p>
          <Link className="primary-btn" to="/auth/sign-in">Go to Sign In</Link>
        </article>
      </section>
    );
  }

  return (
    <section className="auth-wrap">
      <article className="card auth-card">
        <h3>Create Account</h3>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            First Name
            <input type="text" placeholder="First name" value={form.firstName} onChange={set("firstName")} required />
          </label>
          <label>
            Last Name
            <input type="text" placeholder="Last name" value={form.lastName} onChange={set("lastName")} required />
          </label>
          <label>
            Email
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} required />
          </label>
          <label>
            Password
            <input type="password" placeholder="Min 8 chars, upper+lower+digit+special" value={form.password} onChange={set("password")} required minLength={8} />
          </label>
          <label>
            Age
            <input type="number" placeholder="Age" value={form.age} onChange={set("age")} min={1} max={120} required />
          </label>
          <label>
            Gender
            <select value={form.gender} onChange={set("gender")}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </label>
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Get Started"}
          </button>
        </form>
        <p className="muted">
          Already have account? <Link to="/auth/sign-in">Sign in</Link>
        </p>
      </article>
    </section>
  );
}

export default SignUpPage;
