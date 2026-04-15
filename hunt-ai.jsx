import { useState, useRef, useEffect } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const FREE_LIMIT = 10;
const PRO_PRICE = "$8/mo";
// Replace with your real Stripe payment link from stripe.com/payment-links
const STRIPE_LINK = "https://buy.stripe.com/your_link_here";

const SYSTEM_PROMPT = `You are Hunt AI — a powerful, precise, and direct AI assistant. You are sharp, fast, and always on target. Give clear, confident, useful answers. Never be vague. Always deliver.`;

const SUGGESTIONS = [
  "Write me a business plan",
  "Explain quantum computing simply",
  "Help me write a cold email",
  "What's the best way to learn coding?",
];

// ─── FAKE AUTH (replace with Clerk/Supabase in production) ─────────────────
function useAuth() {
  const [user, setUser] = useState(null);
  const [authView, setAuthView] = useState("login");

  const login = (email, password) => {
    if (!email || !password) return "Please fill in all fields.";
    const stored = JSON.parse(localStorage.getItem("hunt_users") || "{}");
    if (!stored[email]) return "No account found. Please sign up.";
    if (stored[email].password !== password) return "Wrong password.";
    setUser({ email, name: stored[email].name, isPro: stored[email].isPro || false, msgCount: stored[email].msgCount || 0 });
    return null;
  };

  const signup = (name, email, password) => {
    if (!name || !email || !password) return "Please fill in all fields.";
    const stored = JSON.parse(localStorage.getItem("hunt_users") || "{}");
    if (stored[email]) return "Email already registered. Please log in.";
    stored[email] = { name, password, isPro: false, msgCount: 0 };
    localStorage.setItem("hunt_users", JSON.stringify(stored));
    setUser({ email, name, isPro: false, msgCount: 0 });
    return null;
  };

  const logout = () => setUser(null);

  const incrementMsg = () => {
    if (!user) return;
    const stored = JSON.parse(localStorage.getItem("hunt_users") || "{}");
    stored[user.email].msgCount = (stored[user.email].msgCount || 0) + 1;
    localStorage.setItem("hunt_users", JSON.stringify(stored));
    setUser(u => ({ ...u, msgCount: stored[user.email].msgCount }));
  };

  const upgradePro = () => {
    if (!user) return;
    const stored = JSON.parse(localStorage.getItem("hunt_users") || "{}");
    stored[user.email].isPro = true;
    localStorage.setItem("hunt_users", JSON.stringify(stored));
    setUser(u => ({ ...u, isPro: true }));
  };

  return { user, login, signup, logout, incrementMsg, upgradePro, authView, setAuthView };
}

// ─── TYPING DOTS ───────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 5, padding: "4px 2px", alignItems: "center" }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%", background: "#ff6a00",
          animation: "huntBounce 1.2s infinite", animationDelay: `${i * 0.18}s`, opacity: 0.85
        }} />
      ))}
    </div>
  );
}

// ─── MESSAGE BUBBLE ────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: isUser ? "row-reverse" : "row", alignItems: "flex-end", gap: 10, marginBottom: 20 }}>
      <div style={{
        width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
        background: isUser ? "linear-gradient(135deg, #ff6a00, #ee0979)" : "linear-gradient(135deg, #1a1a1a, #2a2a2a)",
        border: isUser ? "none" : "1.5px solid #ff6a00",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, color: isUser ? "#fff" : "#ff6a00",
        boxShadow: isUser ? "0 0 16px rgba(255,106,0,0.35)" : "0 0 10px rgba(255,106,0,0.15)"
      }}>{isUser ? "U" : "H"}</div>
      <div style={{
        maxWidth: "70%", padding: "13px 18px",
        borderRadius: isUser ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
        background: isUser ? "linear-gradient(135deg, #ff6a00dd, #ee0979cc)" : "rgba(255,255,255,0.04)",
        border: isUser ? "none" : "1px solid rgba(255,106,0,0.15)",
        color: "#f0f0f0", fontSize: 15, lineHeight: 1.7,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        boxShadow: isUser ? "0 4px 20px rgba(255,106,0,0.2)" : "0 2px 10px rgba(0,0,0,0.3)",
        fontFamily: "'DM Sans', sans-serif",
      }}>{msg.content}</div>
    </div>
  );
}

// ─── AUTH SCREEN ───────────────────────────────────────────────────────────
function AuthScreen({ login, signup, authView, setAuthView }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = () => {
    setLoading(true); setError("");
    setTimeout(() => {
      const err = authView === "login" ? login(email, password) : signup(name, email, password);
      if (err) setError(err);
      setLoading(false);
    }, 600);
  };

  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: 10,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,106,0,0.2)",
    color: "#fff", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif",
    marginBottom: 12, boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input { box-sizing: border-box !important; }
        input::placeholder { color: #3a3a3a !important; }
        input:focus { border-color: rgba(255,106,0,0.5) !important; background: rgba(255,106,0,0.05) !important; outline: none; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 400, animation: "fadeUp 0.5s ease both" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 52, letterSpacing: 5, background: "linear-gradient(135deg, #ff6a00, #ee0979)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HUNT AI</div>
          <div style={{ color: "#333", fontSize: 13, marginTop: 2 }}>huntai.com · Powerful. Precise. Always on target.</div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,106,0,0.15)", borderRadius: 20, padding: "30px 26px", boxShadow: "0 0 60px rgba(255,106,0,0.07)" }}>
          {/* Tab switcher */}
          <div style={{ display: "flex", marginBottom: 22, background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, gap: 4 }}>
            {["login", "signup"].map(v => (
              <button key={v} onClick={() => { setAuthView(v); setError(""); }} style={{
                flex: 1, padding: "8px 0", borderRadius: 7, border: "none",
                background: authView === v ? "linear-gradient(135deg, #ff6a00, #ee0979)" : "transparent",
                color: authView === v ? "#fff" : "#555",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif", letterSpacing: 1, textTransform: "uppercase", transition: "all 0.2s"
              }}>{v === "login" ? "Log In" : "Sign Up"}</button>
            ))}
          </div>

          {authView === "signup" && (
            <input style={inp} placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
          )}
          <input style={inp} type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />
          <input style={{ ...inp, marginBottom: 0 }} type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handle()} />

          {error && <div style={{ color: "#ff6a00", fontSize: 13, marginTop: 10, textAlign: "center" }}>{error}</div>}

          <button onClick={handle} disabled={loading} style={{
            width: "100%", padding: "13px 0", marginTop: 18,
            background: "linear-gradient(135deg, #ff6a00, #ee0979)",
            border: "none", borderRadius: 10, color: "#fff",
            fontSize: 14, fontWeight: 700, cursor: loading ? "default" : "pointer",
            fontFamily: "'Bebas Neue', cursive", letterSpacing: 1.5,
            opacity: loading ? 0.7 : 1, transition: "all 0.15s",
            boxShadow: "0 4px 20px rgba(255,106,0,0.3)"
          }}>{loading ? "..." : authView === "login" ? "LOG IN" : "CREATE FREE ACCOUNT"}</button>

          <div style={{ textAlign: "center", fontSize: 12, color: "#333", marginTop: 14 }}>
            {authView === "login" ? "No account? " : "Already registered? "}
            <span onClick={() => { setAuthView(authView === "login" ? "signup" : "login"); setError(""); }} style={{ color: "#ff6a00", cursor: "pointer", fontWeight: 600 }}>
              {authView === "login" ? "Sign up free →" : "Log in →"}
            </span>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 20, color: "#222", fontSize: 12 }}>
          🔒 Secure · Free to start · No credit card needed
        </div>
      </div>
    </div>
  );
}

// ─── UPGRADE MODAL ─────────────────────────────────────────────────────────
function UpgradeModal({ onClose, onDemoUpgrade }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#111", border: "1px solid rgba(255,106,0,0.3)", borderRadius: 24, padding: "36px 28px", maxWidth: 460, width: "100%", boxShadow: "0 0 80px rgba(255,106,0,0.15)", position: "relative", animation: "fadeUp 0.3s ease both" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 14, right: 16, background: "none", border: "none", color: "#444", fontSize: 22, cursor: "pointer" }}>✕</button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 38, marginBottom: 6 }}>⚡</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 2, color: "#fff" }}>UPGRADE TO PRO</div>
          <div style={{ color: "#555", fontSize: 13, marginTop: 5 }}>You've used all {FREE_LIMIT} free messages today</div>
        </div>

        <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
          {[
            { plan: "Free", price: "$0", perks: ["10 messages/day", "Standard speed", "Basic access"], hi: false },
            { plan: "Pro", price: PRO_PRICE, perks: ["Unlimited messages", "Faster responses", "Priority access", "huntai.com account"], hi: true },
          ].map(({ plan, price, perks, hi }) => (
            <div key={plan} style={{ flex: 1, padding: "16px 14px", borderRadius: 14, position: "relative", background: hi ? "linear-gradient(135deg, rgba(255,106,0,0.1), rgba(238,9,121,0.07))" : "rgba(255,255,255,0.02)", border: hi ? "1.5px solid rgba(255,106,0,0.4)" : "1px solid rgba(255,255,255,0.06)" }}>
              {hi && <div style={{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg, #ff6a00, #ee0979)", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: 1, whiteSpace: "nowrap" }}>BEST VALUE</div>}
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 16, color: hi ? "#ff6a00" : "#555", marginBottom: 4 }}>{plan}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 10 }}>{price}</div>
              {perks.map(p => (
                <div key={p} style={{ fontSize: 12, color: "#777", marginBottom: 5, display: "flex", gap: 6 }}>
                  <span style={{ color: hi ? "#ff6a00" : "#333" }}>✓</span>{p}
                </div>
              ))}
            </div>
          ))}
        </div>

        <a href={STRIPE_LINK} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "block" }}>
          <button style={{
            width: "100%", padding: "14px 0",
            background: "linear-gradient(135deg, #ff6a00, #ee0979)",
            border: "none", borderRadius: 12, color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            letterSpacing: 1.5, fontFamily: "'Bebas Neue', cursive",
            boxShadow: "0 4px 24px rgba(255,106,0,0.35)"
          }}>💳 PAY WITH STRIPE — {PRO_PRICE}</button>
        </a>

        <div style={{ textAlign: "center", fontSize: 11, color: "#2a2a2a", marginTop: 8 }}>Cancel anytime · Secure checkout · huntai.com</div>

        <button onClick={onDemoUpgrade} style={{
          width: "100%", marginTop: 10, padding: "9px 0",
          background: "none", border: "1px solid #1a1a1a", borderRadius: 10,
          color: "#3a3a3a", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
        }}>🧪 Demo: Simulate Pro Upgrade (testing only)</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function HuntAI() {
  const { user, login, signup, logout, incrementMsg, upgradePro, authView, setAuthView } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  if (!user) return <AuthScreen login={login} signup={signup} authView={authView} setAuthView={setAuthView} />;

  const msgCount = user.msgCount || 0;
  const remaining = FREE_LIMIT - msgCount;
  const canChat = user.isPro || msgCount < FREE_LIMIT;

  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;
    if (!canChat) { setShowUpgrade(true); return; }

    const userMsg = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    incrementMsg();
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: newMessages,
        }),
      });
      const data = await res.json();
      const reply = data.content?.map(b => b.text || "").join("") || "No response.";
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };
  const handleInput = e => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes huntBounce { 0%,60%,100%{transform:translateY(0);opacity:0.4;}30%{transform:translateY(-5px);opacity:1;} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);} }
        @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(255,106,0,0.12);}50%{box-shadow:0 0 36px rgba(255,106,0,0.28);} }
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;}
        ::-webkit-scrollbar-thumb{background:#1a1a1a;border-radius:4px;}
        textarea{resize:none;outline:none;border:none;background:transparent;color:#fff;font-size:15px;line-height:1.6;width:100%;font-family:'DM Sans',sans-serif;}
        textarea::placeholder{color:#333;}
        .suggest-btn:hover{background:rgba(255,106,0,0.09)!important;border-color:rgba(255,106,0,0.3)!important;color:#ff6a00!important;}
        .send-btn:hover:not(:disabled){transform:scale(1.06);}
        .signout:hover{color:#ff6a00!important;}
      `}</style>

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onDemoUpgrade={() => { upgradePro(); setShowUpgrade(false); }} />}

      {/* ── Header ── */}
      <div style={{ padding: "0 20px", height: 56, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,106,0,0.09)", background: "rgba(10,10,10,0.97)", backdropFilter: "blur(10px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 24, letterSpacing: 3, background: "linear-gradient(135deg, #ff6a00, #ee0979)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HUNT AI</div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, background: "linear-gradient(135deg, #ff6a00, #ee0979)", padding: "2px 6px", borderRadius: 5, color: "#fff" }}>BETA</div>
          <div style={{ fontSize: 11, color: "#252525" }}>huntai.com</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* User pill */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)", border: "1px solid #1a1a1a", borderRadius: 20, padding: "4px 10px 4px 5px" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg, #ff6a00, #ee0979)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>
              {user.name?.[0]?.toUpperCase() || "U"}
            </div>
            <span style={{ fontSize: 12, color: "#777" }}>{user.name?.split(" ")[0]}</span>
            {user.isPro && <span style={{ fontSize: 10, color: "#ff6a00", fontWeight: 700 }}>PRO⚡</span>}
          </div>

          {!user.isPro && (
            <>
              <span style={{ fontSize: 11, color: remaining <= 3 ? "#ff6a00" : "#383838", fontWeight: 600 }}>{remaining} left</span>
              <button onClick={() => setShowUpgrade(true)} style={{
                background: "linear-gradient(135deg, #ff6a00, #ee0979)", border: "none",
                borderRadius: 7, color: "#fff", padding: "5px 12px", fontSize: 11,
                fontWeight: 700, cursor: "pointer", letterSpacing: 1,
                fontFamily: "'Bebas Neue', cursive", boxShadow: "0 2px 10px rgba(255,106,0,0.3)"
              }}>UPGRADE</button>
            </>
          )}

          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ background: "none", border: "1px solid #1a1a1a", color: "#383838", padding: "5px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11, transition: "all 0.15s" }}>New chat</button>
          )}

          <button className="signout" onClick={logout} style={{ background: "none", border: "none", color: "#2a2a2a", fontSize: 11, cursor: "pointer" }}>Sign out</button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 0" }}>
        {messages.length === 0 ? (
          <div style={{ maxWidth: 620, margin: "0 auto", padding: "36px 20px", animation: "fadeUp 0.5s ease both" }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 50, letterSpacing: 4, background: "linear-gradient(135deg, #ff6a00, #ee0979)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1, marginBottom: 10 }}>HUNT AI</div>
              <div style={{ color: "#444", fontSize: 14 }}>
                Welcome back, <span style={{ color: "#ff6a00", fontWeight: 600 }}>{user.name?.split(" ")[0]}</span>. What are we hunting today?
              </div>
              {!user.isPro && (
                <div style={{ marginTop: 10, fontSize: 12 }}>
                  {msgCount >= FREE_LIMIT
                    ? <span style={{ color: "#ff6a00" }}>Daily limit reached — <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => setShowUpgrade(true)}>Upgrade to Pro</span></span>
                    : <span style={{ color: "#383838" }}>{remaining} of {FREE_LIMIT} free messages remaining today</span>}
                </div>
              )}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggest-btn" onClick={() => sendMessage(s)} style={{
                  background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)",
                  borderRadius: 12, padding: "14px 16px", color: "#555", fontSize: 13,
                  cursor: "pointer", textAlign: "left", lineHeight: 1.4,
                  transition: "all 0.15s", fontFamily: "'DM Sans', sans-serif",
                  animation: `fadeUp 0.4s ease ${i * 0.07}s both`
                }}>{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 20px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ animation: "fadeUp 0.3s ease both" }}>
                <Message msg={msg} />
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)", border: "1.5px solid #ff6a00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#ff6a00" }}>H</div>
                <div style={{ padding: "12px 18px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,106,0,0.15)", borderRadius: "4px 18px 18px 18px" }}>
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div style={{ padding: "12px 20px 18px", borderTop: "1px solid rgba(255,106,0,0.07)", background: "rgba(10,10,10,0.98)", flexShrink: 0 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,106,0,0.18)", borderRadius: 16, padding: "11px 13px", animation: "glowPulse 3s infinite" }}>
            <textarea
              ref={textareaRef} rows={1}
              placeholder={canChat ? "Ask anything..." : "Upgrade to Pro to keep chatting..."}
              value={input} onChange={handleInput} onKeyDown={handleKeyDown}
              disabled={!canChat}
              style={{ minHeight: 24, maxHeight: 160, opacity: canChat ? 1 : 0.35 }}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={!input.trim() || loading || !canChat} style={{
              flexShrink: 0, width: 36, height: 36, borderRadius: 10, border: "none",
              background: input.trim() && !loading && canChat ? "linear-gradient(135deg, #ff6a00, #ee0979)" : "rgba(255,255,255,0.04)",
              color: input.trim() && !loading && canChat ? "#fff" : "#2a2a2a",
              cursor: input.trim() && !loading && canChat ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", fontSize: 17,
              boxShadow: input.trim() && !loading && canChat ? "0 0 16px rgba(255,106,0,0.28)" : "none"
            }}>↑</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 11, color: "#222" }}>
            <span>Enter to send · Shift+Enter for new line</span>
            <span>© 2026 huntai.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
