import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/useAuth";

function SignInPage() {
  const { login, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (isLoggedIn) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-wrap">
      <article className="card auth-card">
        <h3>Sign In</h3>
        {error && <p className="error-msg">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
        <p className="muted">
          New here? <Link to="/auth/sign-up">Create account</Link>
        </p>
      </article>
    </section>
  );
}

export default SignInPage;
