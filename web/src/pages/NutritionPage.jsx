import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import { useAppStore } from "../store/useAppStore";

function NutritionPage() {
  const {
    nutritionChats,
    nutritionActiveId,
    newNutritionChat,
    selectNutritionChat,
    deleteNutritionChat,
    sendNutritionMessage,
    profile
  } = useAppStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mealType, setMealType] = useState("Breakfast");
  const [preview, setPreview] = useState(null);
  const scrollRef = useRef(null);
  const fileRef = useRef(null);

  const activeChat = nutritionChats.find((c) => c.id === nutritionActiveId);
  const messages = activeChat?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const analyze = () => {
    if (!preview) return;
    // Send the meal type as the message — the reply simulates AI analysis
    sendNutritionMessage(`Analyze my ${mealType} meal`);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleNewChat = () => {
    newNutritionChat();
    setPreview(null);
    setSidebarOpen(false);
  };

  const filteredChats = search.trim()
    ? nutritionChats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : nutritionChats;

  return (
    <div className="chatgpt-layout">
      {sidebarOpen && <div className="chat-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`chat-sidebar${sidebarOpen ? " chat-sidebar-open" : ""}`}>
        <div className="chat-sidebar-head">
          <button className="ghost-btn small" onClick={handleNewChat}>
            <Icon name="plus" size={14} /> New
          </button>
          <button className="drawer-close" onClick={() => setSidebarOpen(false)}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="chat-sidebar-search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history…"
          />
        </div>
        <nav className="chat-history-list">
          {filteredChats.length === 0 && <p className="muted small" style={{ padding: "0.5rem 0.75rem" }}>No history yet</p>}
          {filteredChats.map((c) => (
            <div
              key={c.id}
              className={`chat-history-item${c.id === nutritionActiveId ? " active" : ""}`}
              onClick={() => { selectNutritionChat(c.id); setSidebarOpen(false); }}
            >
              <Icon name="nutrition" size={14} />
              <span className="chat-history-title">{c.title}</span>
              <button
                className="chat-history-delete"
                onClick={(e) => { e.stopPropagation(); deleteNutritionChat(c.id); }}
                aria-label="Delete"
              >
                <Icon name="trash" size={12} />
              </button>
            </div>
          ))}
        </nav>
      </aside>

      <div className="chat-main">
        <div className="chat-main-head">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)} aria-label="History">
            <Icon name="nutrition" size={18} />
          </button>
          <span className="chat-main-title">{activeChat?.title || "Nutrition AI"}</span>
          <button className="icon-btn" onClick={handleNewChat} aria-label="New chat">
            <Icon name="plus" size={18} />
          </button>
        </div>

        <div className="chat-stream" ref={scrollRef}>
          {messages.length === 0 && !preview && (
            <div className="chat-empty">
              <Icon name="nutrition" size={32} />
              <h3>Nutrition AI</h3>
              <p className="muted">Upload a meal photo to get estimated calories, protein, carbs, and fat.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`bubble bubble-${m.role}`}>
              <div className="bubble-meta">
                <Icon name={m.role === "user" ? "user" : "nutrition"} size={14} />
                <span>{m.role === "user" ? "You" : "Nutrition AI"}</span>
              </div>
              <div className="bubble-text">
                {m.text.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </div>
          ))}
        </div>

        {/* Upload bar at bottom */}
        <div className="nutrition-upload-bar">
          {preview && (
            <div className="nutrition-preview">
              <img src={preview} alt="Meal preview" />
              <button className="ghost-btn small" onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}>
                <Icon name="close" size={14} />
              </button>
            </div>
          )}
          <div className="nutrition-controls">
            <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snack</option>
            </select>
            <label className="ghost-btn small upload-label">
              <Icon name="plus" size={14} /> Photo
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                style={{ display: "none" }}
              />
            </label>
            <button
              className="primary-btn"
              onClick={analyze}
              disabled={!preview}
            >
              <Icon name="spark" size={14} /> Analyze
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NutritionPage;
