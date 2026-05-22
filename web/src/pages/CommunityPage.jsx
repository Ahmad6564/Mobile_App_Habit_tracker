import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

function PostCard({ post, onLike, onSave, onRepost, onComment, onDeleteComment }) {
  const [draft, setDraft] = useState("");
  const [showAll, setShowAll] = useState(false);
  const visibleComments = showAll ? post.comments : post.comments.slice(-2);

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onComment(post.id, draft);
    setDraft("");
  };

  return (
    <article className={`post-card ${post.kind === "reel" ? "reel" : ""}`}>
      <header className="post-head">
        <span className="avatar-bubble">{post.avatar}</span>
        <div className="grow">
          <strong>{post.user}</strong>
          <p className="muted small">
            {post.kind === "reel" ? "Reel" : "Post"} · {post.createdAt}
          </p>
        </div>
        {post.kind === "reel" && <span className="pill p-medium">REEL</span>}
      </header>

      {post.image && (
        <div className={`post-media ${post.kind === "reel" ? "reel-media" : ""}`}>
          <img src={post.image} alt={post.caption} loading="lazy" />
        </div>
      )}

      <div className="post-body">
        <p>{post.caption}</p>
        {post.tags?.length > 0 && (
          <p className="tag-row">
            {post.tags.map((t) => (
              <span key={t} className="tag">#{t}</span>
            ))}
          </p>
        )}
      </div>

      <div className="post-actions">
        <button className={`action ${post.liked ? "active" : ""}`} onClick={() => onLike(post.id)}>
          {post.liked ? "♥" : "♡"} {post.likes}
        </button>
        <button className="action" onClick={() => setShowAll((s) => !s)}>
          💬 {post.comments.length}
        </button>
        <button className="action" onClick={() => onRepost(post.id)}>
          🔁 {post.reposts}
        </button>
        <button className={`action ${post.saved ? "active" : ""}`} onClick={() => onSave(post.id)}>
          {post.saved ? "🔖" : "📑"}
        </button>
        <button
          className="action"
          onClick={() => {
            if (navigator.share) {
              navigator.share({ title: post.user, text: post.caption }).catch(() => {});
            }
          }}
        >
          ↗ Share
        </button>
      </div>

      <div className="post-comments">
        {post.comments.length > 2 && !showAll && (
          <button className="link small" onClick={() => setShowAll(true)}>
            View all {post.comments.length} comments
          </button>
        )}
        {visibleComments.map((c) => (
          <div key={c.id} className="comment-row">
            <strong>{c.user}</strong>
            <span className="grow">{c.text}</span>
            {c.user === "You" && (
              <button
                className="ghost-btn small"
                onClick={() => onDeleteComment(post.id, c.id)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <form className="comment-form" onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a comment…"
          />
          <button className="primary-btn small" type="submit">Post</button>
        </form>
      </div>
    </article>
  );
}

function CommunityPage() {
  const {
    posts,
    togglePostLike,
    togglePostSave,
    repostPost,
    addComment,
    deleteComment
  } = useAppStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = posts
    .filter((p) =>
      filter === "all" ? true : filter === "reels" ? p.kind === "reel" : p.kind === "post"
    )
    .filter((p) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        p.caption?.toLowerCase().includes(q) ||
        p.user?.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    });

  return (
    <div className="stack">
      <div className="section-head">
        <div>
          <h3>Community</h3>
          <p className="muted small">Share posts, reels, and journey lessons.</p>
        </div>
        <div className="page-search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts, users, tags…"
          />
        </div>
        <div className="tabs">
          {["all", "posts", "reels"].map((f) => (
            <button
              key={f}
              className={`tab${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
        <Link className="primary-btn" to="/community/new-post">+ Create</Link>
      </div>

      <div className="feed-grid">
        {filtered.length === 0 && <p className="muted">Nothing here yet.</p>}
        {filtered.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            onLike={togglePostLike}
            onSave={togglePostSave}
            onRepost={repostPost}
            onComment={addComment}
            onDeleteComment={deleteComment}
          />
        ))}
      </div>
    </div>
  );
}

export default CommunityPage;
