import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import { useAppStore } from "../store/useAppStore";

function ReferralPage() {
  const { profile } = useAppStore();
  const [copied, setCopied] = useState("");

  const link = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/auth/sign-up?ref=${profile.referralCode}`;
  }, [profile.referralCode]);

  const copy = async (value, key) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* ignore */
    }
  };

  const shareNow = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on HabitForge",
          text: `I am building habits on HabitForge. Use my code ${profile.referralCode} when you sign up.`,
          url: link
        });
      } catch {
        /* ignore */
      }
    } else {
      copy(link, "share");
    }
  };

  const channels = [
    {
      key: "whatsapp",
      label: "WhatsApp",
      url: `https://wa.me/?text=${encodeURIComponent(`Join me on HabitForge — ${link}`)}`
    },
    {
      key: "twitter",
      label: "X / Twitter",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent("Building habits the smart way on HabitForge")}&url=${encodeURIComponent(link)}`
    },
    {
      key: "email",
      label: "Email",
      url: `mailto:?subject=${encodeURIComponent("Join HabitForge")}&body=${encodeURIComponent(`Use my code ${profile.referralCode}: ${link}`)}`
    }
  ];

  return (
    <div className="stack">
      <div className="card referral-hero">
        <div>
          <p className="eyebrow">Refer a friend</p>
          <h2 className="hero-title">Build habits together</h2>
          <p className="muted">
            Share HabitForge with friends. Both of you get a streak boost and a referral badge
            when they sign up with your code.
          </p>
        </div>
        <div className="referral-code">
          <span className="muted small">Your code</span>
          <strong>{profile.referralCode}</strong>
          <button className="ghost-btn small" onClick={() => copy(profile.referralCode, "code")}>
            {copied === "code" ? "Copied ✓" : "Copy"}
          </button>
        </div>
      </div>

      <div className="card form-card">
        <h4><Icon name="share" size={16} /> Share link</h4>
        <div className="link-row">
          <input readOnly value={link} />
          <button className="primary-btn small" onClick={() => copy(link, "link")}>
            {copied === "link" ? "Copied ✓" : "Copy link"}
          </button>
        </div>
        <div className="share-row">
          {channels.map((c) => (
            <a key={c.key} className="ghost-btn" href={c.url} target="_blank" rel="noreferrer">
              {c.label}
            </a>
          ))}
          <button className="primary-btn" onClick={shareNow}>
            <Icon name="share" size={14} /> Share
          </button>
        </div>
      </div>

      <div className="card">
        <h4>How it works</h4>
        <ol className="how-list">
          <li>Send your code or link to a friend.</li>
          <li>They sign up and enter your code on the signup screen.</li>
          <li>You both unlock a 7-day streak shield and the “Mentor” badge.</li>
          <li>Track your referrals from your profile.</li>
        </ol>
      </div>
    </div>
  );
}

export default ReferralPage;
