import { Link } from "react-router-dom";

function SignUpPage() {
  return (
    <section className="auth-wrap">
      <article className="card auth-card">
        <h3>Create Account</h3>
        <label>
          Name
          <input type="text" placeholder="Your name" />
        </label>
        <label>
          Email
          <input type="email" placeholder="you@example.com" />
        </label>
        <label>
          Password
          <input type="password" placeholder="Create a strong password" />
        </label>
        <Link className="primary-btn" to="/dashboard">
          Get Started
        </Link>
        <p className="muted">
          Already have account? <Link to="/auth/sign-in">Sign in</Link>
        </p>
      </article>
    </section>
  );
}

export default SignUpPage;
