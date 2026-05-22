import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="auth-wrap">
      <article className="card auth-card">
        <h3>Page Not Found</h3>
        <p className="muted">The page you are looking for does not exist.</p>
        <Link className="primary-btn" to="/dashboard">
          Back to Dashboard
        </Link>
      </article>
    </section>
  );
}

export default NotFoundPage;
