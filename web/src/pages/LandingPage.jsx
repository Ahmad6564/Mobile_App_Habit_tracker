import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-glow" />
      <section className="landing-hero">
        <p className="badge">Habit + Community + AI</p>
        <h1>Build better routines. Show your journey. Eat smarter with AI.</h1>
        <p>
          Track daily, weekly, and monthly habits, share reels and stories with the community,
          and get instant nutrition insights from meal photos.
        </p>
        <div className="hero-actions">
          <Link className="primary-btn" to="/auth/sign-up">
            Start Free
          </Link>
          <Link className="ghost-btn" to="/dashboard">
            View Demo Dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
