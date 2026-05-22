import { Link } from "react-router-dom";

function SignInPage() {
  return (
    <section className="auth-wrap">
      <article className="card auth-card">
        <h3>Sign In</h3>
        <label>
          Email
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" placeholder="********" />
        </label>
        <Link className="primary-btn" to="/dashboard">
          Continue
        </Link>
        <p className="muted">
          New here? <Link to="/auth/sign-up">Create account</Link>
        </p>
      </article>
    </section>
  );
}

export default SignInPage;
