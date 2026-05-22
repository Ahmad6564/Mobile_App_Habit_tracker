import { useEffect, useRef, useState } from "react";
import Icon from "../components/Icon";
import { useAppStore } from "../store/useAppStore";

const PROMPTS = [
  "How can I improve my water habit?",
  "What should I focus on this week?",
  "Tips for better sleep?",
  "How is my streak going?",
  "Give me a diet plan based on my habits"
];

function CoachPage() {
  const {
    coachChats,
    coachActiveId,
    newCoachChat,
    selectCoachChat,
    deleteCoachChat,
    sendCoachMessage,
    profile
  } = useAppStore();

  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef(null);

  const activeChat = coachChats.find((c) => c.id === coachActiveId);
  const messages = activeChat?.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const submit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendCoachMessage(input);
    setInput("");
  };

  const ask = (prompt) => {
    sendCoachMessage(prompt);
  };

  const handleNewChat = () => {
    newCoachChat();
    setSidebarOpen(false);
  };

  const filteredChats = search.trim()
    ? coachChats.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    : coachChats;

  return (
    <div className="chatgpt-layout">
      {/* Chat history sidebar */}
      {sidebarOpen && <div className="chat-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`chat-sidebar${sidebarOpen ? " chat-sidebar-open" : ""}`}>
        <div className="chat-sidebar-head">
          <button className="ghost-btn small" onClick={handleNewChat}>
            <Icon name="plus" size={14} /> New chat
          </button>
          <button className="drawer-close" onClick={() => setSidebarOpen(false)}>
            <Icon name="close" size={16} />
          </button>
        </div>
        <div className="chat-sidebar-search">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats…"
          />
        </div>
        <nav className="chat-history-list">
          {filteredChats.length === 0 && <p className="muted small" style={{ padding: "0.5rem 0.75rem" }}>No chats yet</p>}
          {filteredChats.map((c) => (
            <div
              key={c.id}
              className={`chat-history-item${c.id === coachActiveId ? " active" : ""}`}
              onClick={() => { selectCoachChat(c.id); setSidebarOpen(false); }}
            >
              <Icon name="chat" size={14} />
              <span className="chat-history-title">{c.title}</span>
              <button
                className="chat-history-delete"
                onClick={(e) => { e.stopPropagation(); deleteCoachChat(c.id); }}
                aria-label="Delete chat"
              >
                <Icon name="trash" size={12} />
              </button>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main chat area */}
      <div className="chat-main">
        <div className="chat-main-head">
          <button className="icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Chat history">
            <Icon name="chat" size={18} />
          </button>
          <span className="chat-main-title">{activeChat?.title || "AI Coach"}</span>
          <button className="icon-btn" onClick={handleNewChat} aria-label="New chat">
            <Icon name="plus" size={18} />
          </button>
        </div>

        <div className="chat-stream" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="chat-empty">
              <Icon name="spark" size={32} />
              <h3>AI Coach</h3>
              <p className="muted">Hi {profile.name || "there"} — I know your habits, streaks, and tasks. Ask me anything.</p>
              <div className="prompt-row">
                {PROMPTS.map((p) => (
                  <button key={p} className="prompt-chip" onClick={() => ask(p)}>{p}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`bubble bubble-${m.role}`}>
              <div className="bubble-meta">
                <Icon name={m.role === "user" ? "user" : "spark"} size={14} />
                <span>{m.role === "user" ? "You" : "Coach"}</span>
              </div>
              <div className="bubble-text">
                {m.text.split("\n\n").map((para, i) => <p key={i}>{para}</p>)}
              </div>
            </div>
          ))}
        </div>

        <form className="chat-input" onSubmit={submit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach…"
          />
          <button type="submit" className="primary-btn">
            <Icon name="arrowRight" size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

export default CoachPage;
