import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store/useAppStore";

function CreatePostPage() {
  const { addPost } = useAppStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState({
    kind: "post",
    caption: "",
    image: "",
    tags: ""
  });

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, image: reader.result }));
    reader.readAsDataURL(file);
  };

  const submit = (e) => {
    e.preventDefault();
    addPost({
      kind: draft.kind,
      caption: draft.caption,
      image: draft.image,
      tags: draft.tags
        .split(/[,#\s]+/)
        .map((t) => t.trim())
        .filter(Boolean)
    });
    navigate("/community");
  };

  return (
    <section className="stack">
      <h3>Create Post / Reel</h3>
      <form className="card form-card" onSubmit={submit}>
        <div className="tabs">
          {["post", "reel"].map((k) => (
            <button
              key={k}
              type="button"
              className={`tab${draft.kind === k ? " active" : ""}`}
              onClick={() => setDraft({ ...draft, kind: k })}
            >
              {k}
            </button>
          ))}
        </div>

        <label>
          Caption
          <textarea
            value={draft.caption}
            onChange={(e) => setDraft({ ...draft, caption: e.target.value })}
            placeholder="Share your journey: what helped, what blocked you, how you solved it…"
            required
          />
        </label>

        <label>
          Tags (comma or # separated)
          <input
            value={draft.tags}
            onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
            placeholder="hydration, running, mindset"
          />
        </label>

        <label>
          Upload media
          <input type="file" accept="image/*,video/*" onChange={handleFile} />
        </label>

        {draft.image && (
          <div className="post-media preview">
            <img src={draft.image} alt="preview" />
          </div>
        )}

        <div className="row-end">
          <button className="primary-btn" type="submit">Publish</button>
        </div>
      </form>
    </section>
  );
}

export default CreatePostPage;
