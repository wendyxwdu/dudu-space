import { useState, useEffect, useRef } from "react";
import { saveData, saveSettings, listenData, listenSettings, uploadFile, login, logout, onAuthChange } from "./firebase.js";

/* ── Theme definitions ── */
const THEMES = {
  blush:  { n: "Blush",  a: "#d4909a", m: "#e8bcc2", l: "#fef5f6", b: "#f2e8e9", s: "#a08888", t: "#2e2426" },
  honey:  { n: "Honey",  a: "#d4a54a", m: "#e8cc88", l: "#fdf8ee", b: "#f0e4c8", s: "#b08030", t: "#3d3020" },
  olive:  { n: "Olive",  a: "#6b7c5e", m: "#a8b89c", l: "#f2f4ee", b: "#e4e1d5", s: "#a3a08c", t: "#2b2e26" },
  cocoa:  { n: "Cocoa",  a: "#c49080", m: "#d8b0a4", l: "#faf3f0", b: "#e6d5cc", s: "#8a6558", t: "#362824" },
  ink:    { n: "Ink",    a: "#1a1a18", m: "#9c9c96", l: "#f5f5f3", b: "#e8e8e4", s: "#9c9c96", t: "#1a1a18" },
};

const FONT = "'Plus Jakarta Sans', sans-serif";
const SERIF = "'Cormorant Garamond', serif";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ── Emoji picker data ── */
const EMOJIS = {
  "Smileys": ["😊","😍","🥰","😘","🥺","😂","🤣","😎","🤩","😇","🥳","😋","🫶","💀","👻"],
  "Hearts":  ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","🩷","💕","💗","💓","💘","💝","♥️"],
  "Travel":  ["✈️","🏖️","🏔️","⛺","🗼","🎡","🌅","🌊","🚗","🛳️","🧳","🗺️","🏕️","🌍","🗽"],
  "Food":    ["🍕","🍣","🧋","🍰","🍜","🍝","🥂","🍷","☕","🍦","🎂","🧁","🥐","🍫","🍒"],
  "Nature":  ["🌸","🌺","🌻","🌹","🍁","🌿","🌈","⭐","🌙","☀️","🦋","🌾","💐","🪻","🍀"],
  "Symbols": ["📖","💍","🎯","🏠","📸","🎵","🎨","💰","📚","🏃","🎮","🎬","💡","🔮","🪄"],
  "Animals": ["🐰","🐻","🐱","🐶","🐼","🦊","🐤","🐸","🦄","🐙","🐝","🐧","🦋","🐾","🐣"],
};

/* ── Helpers ── */
const formatDate = (d) => {
  if (!d) return "";
  const x = new Date(d + "T00:00:00");
  return `${MONTHS[x.getMonth()]} ${x.getDate()}, ${x.getFullYear()}`;
};
const formatShort = (d) => {
  if (!d) return "";
  const x = new Date(d + "T00:00:00");
  return `${MONTHS[x.getMonth()]} ${x.getDate()}`;
};
const daysBetween = (a) => Math.round(Math.abs(new Date() - new Date(a)) / 864e5);

const doAI = async (prompt) => {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const d = await r.json();
  return d.content?.map((b) => b.text || "").join("") || "";
};

/* ── Reusable styles ── */
const iconBtn = { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" };

/* ── SVG Icons ── */
const Icon = (w, h, d) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
    dangerouslySetInnerHTML={{ __html: d }} />
);
const CloseIcon = Icon(16, 16, '<line x1="18" y1="6" x2="6" y2="18" stroke-width="2"/><line x1="6" y1="6" x2="18" y2="18" stroke-width="2"/>');
const BackIcon = Icon(16, 16, '<polyline points="15 18 9 12 15 6" stroke-width="2"/>');
const PlusIcon = Icon(18, 18, '<line x1="12" y1="5" x2="12" y2="19" stroke-width="2"/><line x1="5" y1="12" x2="19" y2="12" stroke-width="2"/>');
const TrashIcon = Icon(12, 12, '<polyline points="3 6 5 6 21 6" stroke-width="2"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke-width="2"/>');
const StarIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 7.2H22l-6 4.8 2.4 7.2L12 16.4 5.6 21.2 8 14 2 9.2h7.6z"/></svg>;
const CheckIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
const HeartIcon = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const GearIcon = Icon(16, 16, '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>');

/* ── Nav items ── */
const NAV_ITEMS = [
  ["tl", Icon(20, 20, '<line x1="12" y1="2" x2="12" y2="22"/><circle cx="12" cy="6" r="2.5" fill="currentColor" stroke="none"/><circle cx="12" cy="13" r="2.5" fill="currentColor" stroke="none"/>')],
  ["al", Icon(20, 20, '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none"/><path d="M21 15l-5-5L5 21" stroke-linecap="round"/>')],
  ["hm", HeartIcon, true],
  ["gl", Icon(20, 20, '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>')],
  ["wh", Icon(20, 20, '<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>')],
];

/* ── Overlay component ── */
const Overlay = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,.18)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", padding: "24px 20px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500 }}>{title}</span>
          <button onClick={onClose} style={{ ...iconBtn, color: "#aaa" }}>{CloseIcon}</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ── Confirm dialog ── */
const Confirm = ({ open, message, onYes, onNo, C }) => {
  if (!open) return null;
  return (
    <div onClick={onNo} style={{ position: "fixed", inset: 0, zIndex: 700, background: "rgba(0,0,0,.3)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 16, padding: "28px 24px", width: "80%", maxWidth: 320, textAlign: "center" }}>
        <div style={{ fontSize: 15, color: C.t, marginBottom: 20, lineHeight: 1.6, fontFamily: FONT }}>{message}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onNo} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.b}`, background: "#fff", color: C.s, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>Cancel</button>
          <button onClick={onYes} style={{ flex: 1, padding: 11, borderRadius: 10, border: "none", background: "#c97070", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: FONT }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

/* ── Emoji Picker ── */
const EmojiPicker = ({ show, onPick, onClose }) => {
  const [cat, setCat] = useState(Object.keys(EMOJIS)[0]);
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,.18)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, maxHeight: "60vh", padding: "16px 20px 24px" }}>
        <div style={{ display: "flex", gap: 4, marginBottom: 12, overflowX: "auto" }}>
          {Object.keys(EMOJIS).map((c) => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: "6px 12px", borderRadius: 20, border: "none", background: cat === c ? "#f0f0f0" : "#fff", fontSize: 12, cursor: "pointer", fontFamily: FONT, fontWeight: cat === c ? 600 : 400, whiteSpace: "nowrap" }}>{c}</button>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, overflowY: "auto", maxHeight: "40vh" }}>
          {(EMOJIS[cat] || []).map((e) => (
            <button key={e} onClick={() => { onPick(e); onClose(); }} style={{ width: "100%", aspectRatio: "1", borderRadius: 8, border: "none", background: "#fff", fontSize: 22, cursor: "pointer" }}>{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── Default data ── */
const DEFAULT_DATA = { startDate: "", timeline: [], albums: [], goals: [], whispers: [] };
const DEFAULT_SETTINGS = { lang: "en", theme: "blush" };

/* ════════════════════════════════════════════════════════════ */
/*  MAIN APP                                                   */
/* ════════════════════════════════════════════════════════════ */
export default function App() {
  const [D, setD] = useState(DEFAULT_DATA);
  const [tab, setTab] = useState("hm");
  const [sub, setSub] = useState(null);       // album detail id
  const [modal, setModal] = useState("");      // which modal is open
  const [form, setForm] = useState({});        // form data for modals
  const [expanded, setExpanded] = useState(null);
  const [aiNotes, setAiNotes] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [photos, setPhotos] = useState([]);     // upload queue
  const [target, setTarget] = useState(null);   // target album for upload
  const [viewer, setViewer] = useState(null);   // photo viewer
  const [itemTexts, setItemTexts] = useState({});
  const [lang, setLang] = useState("en");
  const [theme, setTheme] = useState("blush");
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(null);       // full page views
  const [confirmDel, setConfirmDel] = useState(null);
  const [emojiPicker, setEmojiPicker] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);        // Firebase auth user
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");

  const fileRef = useRef();
  const fileRef2 = useRef();
  const fileRef3 = useRef();

  // Track whether updates come from local or remote
  const skipSave = useRef(false);

  /* ── Firebase real-time listeners ── */
  useEffect(() => {
    const unsub1 = listenData((data) => {
      skipSave.current = true;
      setD(data);
      setTimeout(() => { skipSave.current = false; }, 100);
    });
    const unsub2 = listenSettings((s) => {
      if (s.lang) setLang(s.lang);
      if (s.theme) setTheme(s.theme);
    });
    setReady(true);
    return () => { unsub1(); unsub2(); };
  }, []);

  // Firebase auth listener
  useEffect(() => {
    const unsub = onAuthChange((u) => setUser(u));
    return () => unsub();
  }, []);

  if (!ready) return null;

  const isOwner = !!user;  // logged in = can edit

  const zh = lang === "zh";
  const C = THEMES[theme] || THEMES.blush;

  /* ── Save data (debounced to Firebase) ── */
  const updateData = (newData) => {
    setD(newData);
    if (!skipSave.current) {
      saveData(newData);
    }
  };

  /* ── Upload a file to Cloudinary ── */
  const upload = async (base64) => {
    return await uploadFile(base64);
  };

  /* ── Style helpers ── */
  const inputStyle = {
    width: "100%", padding: "11px 12px", borderRadius: 10,
    border: `1px solid ${C.b}`, fontSize: 14, fontFamily: FONT,
    color: C.t, background: "#fafafa", marginBottom: 10, outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: C.s, marginBottom: 4, letterSpacing: 1, textTransform: "uppercase" };
  const btnStyle = () => ({ padding: "8px 14px", borderRadius: 8, border: "none", background: C.t, color: "#fff", cursor: "pointer", fontSize: 13, fontFamily: FONT });

  /* ── Derived data ── */
  const { timeline: tl, albums: al, goals: gl, whispers: wh } = D;
  const days = D.startDate ? daysBetween(D.startDate) : 0;
  const currentAlbum = sub ? al.find((a) => a.id === sub) : null;

  const sortTimeline = (arr) => updateData({ ...D, timeline: [...arr].sort((a, b) => new Date(a.date) - new Date(b.date)) });

  /* ── Labels ── */
  const lb = (k) => ({
    tl: zh ? "时间轴" : "Timeline",
    st: zh ? "故事" : "Stories",
    dr: zh ? "畅想" : "Dreams",
    wh: zh ? "悄悄话" : "Whispers",
    dy: zh ? "天" : "Days",
    ph: zh ? "照片" : "Photos",
    add: zh ? "+ 添加" : "+ Add",
    nl: zh ? "+ 新建" : "+ New",
    se: zh ? "设置" : "Settings",
  })[k];


  /* ════════════════════════════════════════════════════════ */
  /*  FULL PAGE: Timeline Edit                                */
  /* ════════════════════════════════════════════════════════ */
  if (page === "te") {
    const ef = form;
    const blocks = ef.blocks || [];

    const addImageBlock = async (files) => {
      setUploading(true);
      for (const f of files) {
        const base64 = await new Promise((res) => {
          const r = new FileReader();
          r.onload = (ev) => res(ev.target.result);
          r.readAsDataURL(f);
        });
        const url = await upload(base64);
        setForm((p) => ({
          ...p,
          blocks: [...(p.blocks || []), { id: Date.now() + Math.random(), type: "img", src: url, cap: "" }],
        }));
      }
      setUploading(false);
    };

    return (
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>
        <input ref={fileRef2} type="file" accept="image/*,video/*" multiple style={{ display: "none" }}
          onChange={(e) => addImageBlock(Array.from(e.target.files || []))} />

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0" }}>
          <button onClick={() => { setPage(null); setForm({}); }} style={iconBtn}>{BackIcon}</button>
          <span style={{ fontFamily: SERIF, fontSize: 20, color: C.t, fontWeight: 500 }}>
            {ef._id ? (zh ? "编辑时刻" : "Edit Moment") : (zh ? "新时刻" : "New Moment")}
          </span>
        </div>

        <input value={ef.title || ""} onChange={(e) => setForm({ ...ef, title: e.target.value })}
          placeholder={zh ? "标题" : "Title"} style={{ ...inputStyle, fontSize: 18, fontWeight: 600, padding: "14px 12px" }} />

        <input type="date" value={ef.date || ""} onChange={(e) => setForm({ ...ef, date: e.target.value })} style={inputStyle} />

        <textarea value={ef.text || ""} onChange={(e) => setForm({ ...ef, text: e.target.value })}
          rows={3} placeholder={zh ? "故事描述…" : "Story description…"}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} />

        <div style={{ ...labelStyle, marginTop: 8, marginBottom: 8 }}>{zh ? "图文内容" : "Content Blocks"}</div>

        {blocks.map((b, i) => (
          <div key={b.id} style={{ marginBottom: 12, position: "relative", border: `1px solid ${C.b}`, borderRadius: 12, padding: 10 }}>
            {/* Move & delete controls */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 2, marginBottom: 6 }}>
              <button disabled={i === 0} onClick={() => {
                const nb = [...blocks]; [nb[i - 1], nb[i]] = [nb[i], nb[i - 1]];
                setForm({ ...ef, blocks: nb });
              }} style={{ ...iconBtn, color: i === 0 ? "#ddd" : C.s, fontSize: 14, width: 28, height: 28, justifyContent: "center", background: "#f8f8f8", borderRadius: 6 }}>↑</button>
              <button disabled={i === blocks.length - 1} onClick={() => {
                const nb = [...blocks]; [nb[i], nb[i + 1]] = [nb[i + 1], nb[i]];
                setForm({ ...ef, blocks: nb });
              }} style={{ ...iconBtn, color: i === blocks.length - 1 ? "#ddd" : C.s, fontSize: 14, width: 28, height: 28, justifyContent: "center", background: "#f8f8f8", borderRadius: 6 }}>↓</button>
              <button onClick={() => setForm({ ...ef, blocks: blocks.filter((x) => x.id !== b.id) })}
                style={{ ...iconBtn, color: "#c97070", fontSize: 14, width: 28, height: 28, justifyContent: "center", background: "#f8f8f8", borderRadius: 6 }}>×</button>
            </div>
            {b.type === "img" && (
              <>
                {b.src?.includes("video") || b.src?.match(/\.(mp4|mov|webm)/i) ? (
                  <video src={b.src} controls style={{ width: "100%", borderRadius: 10, marginBottom: 6 }} />
                ) : (
                  <img src={b.src} alt="" style={{ width: "100%", borderRadius: 10, marginBottom: 6 }} />
                )}
                <input value={b.cap || ""} onChange={(e) => {
                  const nb = [...blocks]; nb[i] = { ...nb[i], cap: e.target.value };
                  setForm({ ...ef, blocks: nb });
                }} placeholder={zh ? "图片说明…" : "Caption…"} style={{ ...inputStyle, fontSize: 13, fontStyle: "italic", marginBottom: 0 }} />
              </>
            )}
            {b.type === "txt" && (
              <textarea value={b.text || ""} onChange={(e) => {
                const nb = [...blocks]; nb[i] = { ...nb[i], text: e.target.value };
                setForm({ ...ef, blocks: nb });
              }} rows={2} placeholder={zh ? "写点什么…" : "Write something…"}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7, marginBottom: 0 }} />
            )}
          </div>
        ))}

        {uploading && <div style={{ textAlign: "center", padding: 16, color: C.s, fontSize: 13 }}>{zh ? "上传中…" : "Uploading…"}</div>}

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button onClick={() => setForm({ ...ef, blocks: [...blocks, { id: Date.now(), type: "txt", text: "" }] })}
            style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px dashed ${C.b}`, background: "#fff", cursor: "pointer", fontSize: 13, color: C.s, fontFamily: FONT }}>
            + {zh ? "文字" : "Text"}
          </button>
          <button onClick={() => fileRef2.current?.click()}
            style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px dashed ${C.b}`, background: "#fff", cursor: "pointer", fontSize: 13, color: C.s, fontFamily: FONT }}>
            📷 {zh ? "图片" : "Image"}
          </button>
        </div>

        <button disabled={uploading} onClick={() => {
          if (!ef.title?.trim() || !ef.date) return;
          const entry = { title: ef.title.trim(), date: ef.date, text: (ef.text || "").trim(), blocks: ef.blocks || [], id: ef._id || Date.now() };
          sortTimeline(ef._id ? tl.map((i) => (i.id === ef._id ? entry : i)) : [...tl, entry]);
          setPage(null); setForm({});
        }} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: uploading ? C.b : C.t, color: uploading ? C.s : "#fff", fontSize: 15, cursor: uploading ? "wait" : "pointer", fontFamily: FONT }}>
          {ef._id ? (zh ? "更新" : "Update") : (zh ? "添加" : "Add")}
        </button>
      </div>
    );
  }


  /* ════════════════════════════════════════════════════════ */
  /*  FULL PAGE: Timeline Detail View                         */
  /* ════════════════════════════════════════════════════════ */
  if (page === "td" && form._vw) {
    const entry = tl.find((x) => x.id === form._vw);
    if (!entry) { setPage(null); return null; }

    return (
      <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, maxWidth: 480, margin: "0 auto", padding: "0 20px 40px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 0" }}>
          <button onClick={() => { setPage(null); setForm({}); }} style={iconBtn}>{BackIcon}</button>
          <span style={{ fontSize: 12, color: C.s, letterSpacing: 2 }}>DUDU SPACE</span>
        </div>

        <div style={{ marginBottom: 8, fontSize: 12, color: C.s, letterSpacing: 1 }}>{formatDate(entry.date)}</div>
        <div style={{ fontFamily: SERIF, fontSize: 26, color: C.t, fontWeight: 500, marginBottom: 16, lineHeight: 1.3 }}>{entry.title}</div>
        {entry.text && <div style={{ fontSize: 15, color: C.s, lineHeight: 1.8, marginBottom: 20 }}>{entry.text}</div>}

        {(entry.blocks || []).map((b) => (
          <div key={b.id} style={{ marginBottom: 16 }}>
            {b.type === "txt" && b.text && <div style={{ fontSize: 15, color: C.t, lineHeight: 1.8 }}>{b.text}</div>}
            {b.type === "img" && (
              <>
                {b.src?.includes("video") || b.src?.match(/\.(mp4|mov|webm)/i) ? (
                  <video src={b.src} controls style={{ width: "100%", borderRadius: 10 }} />
                ) : (
                  <img src={b.src} alt="" style={{ width: "100%", borderRadius: 10 }} />
                )}
                {b.cap && <div style={{ fontSize: 13, color: C.s, fontStyle: "italic", marginTop: 6, fontFamily: SERIF }}>{b.cap}</div>}
              </>
            )}
          </div>
        ))}

        {isOwner && <div style={{ display: "flex", gap: 12, marginTop: 24, paddingTop: 16, borderTop: `1px solid ${C.b}` }}>
          <button onClick={() => {
            setForm({ title: entry.title, date: entry.date, text: entry.text || "", blocks: entry.blocks || [], _id: entry.id });
            setPage("te");
          }} style={{ ...iconBtn, gap: 4, fontSize: 13, color: C.a }}>✎ {zh ? "编辑" : "Edit"}</button>
          <button onClick={async () => {
            const r = await doAI(`Rewrite warmly 1-2 sentences. Just text.\n${entry.title}\n${entry.text || ""}`);
            sortTimeline(tl.map((z) => (z.id === entry.id ? { ...z, text: r.trim().replace(/^["']|["']$/g, "") } : z)));
          }} style={{ ...iconBtn, gap: 4, fontSize: 13, color: C.a }}>{StarIcon} {zh ? "重写" : "Rewrite"}</button>
        </div>}
      </div>
    );
  }


  /* ════════════════════════════════════════════════════════ */
  /*  MAIN LAYOUT                                             */
  /* ════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "#fff", fontFamily: FONT, maxWidth: 480, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px 0" }}>
        <div style={{ fontSize: 11, color: C.s, letterSpacing: 2.5, fontWeight: 600 }}>DUDU SPACE</div>
        <div style={{ display: "flex", gap: 6 }}>
          {isOwner && <button onClick={() => { setPhotos([]); setTarget(null); setModal("up"); }} style={{ ...iconBtn, color: C.t }}>{PlusIcon}</button>}
          <button onClick={() => setModal("se")} style={{ ...iconBtn, color: C.s }}>{GearIcon}</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "16px 20px 100px", animation: "fi .3s ease" }}>

        {/* ── HOME TAB ── */}
        {tab === "hm" && (
          <>
            <div style={{ textAlign: "center", padding: "28px 0 20px" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginBottom: 14 }}>
                {["🐰", "♡", "🐻"].map((e, i) =>
                  i === 1
                    ? <div key={i} style={{ color: C.a, fontSize: 14 }}>{e}</div>
                    : <div key={i} style={{ width: 52, height: 52, borderRadius: "50%", background: C.l, border: `2px solid ${C.m}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{e}</div>
                )}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 28, color: C.t, fontWeight: 500 }}>DuDu Space</div>
              {D.startDate && <div style={{ marginTop: 6, fontSize: 13, color: C.s }}>{zh ? "在一起" : "Together since"} {formatDate(D.startDate)}</div>}
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 1, margin: "0 0 24px", background: C.b, borderRadius: 12, overflow: "hidden" }}>
              {[[days, lb("dy")], [al.length, lb("st")], [tl.length, lb("ph")]].map(([n, l], i) => (
                <div key={i} style={{ flex: 1, background: "#fff", padding: "14px 0", textAlign: "center" }}>
                  <div style={{ fontFamily: SERIF, fontSize: 24, color: C.t, fontWeight: 500 }}>{n}</div>
                  <div style={{ fontSize: 11, color: C.s }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Quick access grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <div>
                <div style={labelStyle}>{zh ? "故事" : "Stories"}</div>
                {al.slice(0, 3).map((a) => (
                  <div key={a.id} onClick={() => { setTab("al"); setSub(a.id); }}
                    style={{ borderRadius: 12, overflow: "hidden", marginBottom: 8, cursor: "pointer", border: `1px solid ${C.b}`, height: 72, position: "relative", background: a.cover ? `url(${a.cover}) center/cover` : C.l, display: "flex", alignItems: "flex-end" }}>
                    <div style={{ padding: "6px 8px", margin: 4, borderRadius: 8, background: a.cover ? `${C.t}88` : `${C.l}cc`, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: a.cover ? "#fff" : C.t }}>{a.emoji} {a.title}</div>
                    </div>
                  </div>
                ))}
                {!al.length && <div onClick={() => setTab("al")} style={{ padding: 16, textAlign: "center", border: `1px dashed ${C.b}`, borderRadius: 12, cursor: "pointer", color: C.s, fontSize: 13 }}>+</div>}
              </div>
              <div>
                <div style={labelStyle}>{zh ? "目标" : "Goals"}</div>
                {gl.slice(0, 3).map((g) => (
                  <div key={g.id} style={{ background: "#fff", borderRadius: 12, padding: 12, marginBottom: 8, border: `1px solid ${C.b}` }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.t }}>{g.emoji} {g.title}</div>
                  </div>
                ))}
                {!gl.length && <div onClick={() => setTab("gl")} style={{ padding: 16, textAlign: "center", border: `1px dashed ${C.b}`, borderRadius: 12, cursor: "pointer", color: C.s, fontSize: 13 }}>+</div>}
              </div>
            </div>

            {/* Timeline preview */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={labelStyle}>{lb("tl")}</span>
              <span onClick={() => setTab("tl")} style={{ fontSize: 12, color: C.a, cursor: "pointer" }}>{zh ? "全部→" : "View all →"}</span>
            </div>
            {tl.slice(0, 4).map((x, i) => (
              <div key={x.id} onClick={() => { setForm({ _vw: x.id }); setPage("td"); }}
                style={{ display: "flex", gap: 12, marginBottom: 10, cursor: "pointer" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 12 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.a }} />
                  {i < 3 && tl.length > i + 1 && <div style={{ width: 1, flex: 1, background: C.b, marginTop: 4 }} />}
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.s }}>{formatShort(x.date)}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.t }}>{x.title}</div>
                </div>
              </div>
            ))}
          </>
        )}


        {/* ── TIMELINE TAB ── */}
        {tab === "tl" && (
          <>
            {isOwner && <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button onClick={() => setModal("ai")} style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${C.b}`, background: "#fff", cursor: "pointer", fontSize: 13, color: C.t, fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <span style={{ color: C.a }}>{StarIcon}</span>{zh ? "AI整理" : "AI Organize"}
              </button>
              <button onClick={() => { setForm({}); setPage("te"); }} style={btnStyle()}>{lb("add")}</button>
            </div>}

            {tl.map((x, i) => (
              <div key={x.id} style={{ display: "flex", gap: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 16, paddingTop: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.a }} />
                  {i < tl.length - 1 && <div style={{ width: 1, flex: 1, background: C.b }} />}
                </div>
                <div onClick={() => { setForm({ _vw: x.id }); setPage("td"); }}
                  style={{ flex: 1, paddingBottom: 22, cursor: "pointer" }}>
                  <div style={{ fontSize: 11, color: C.s }}>{formatDate(x.date)}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 18, color: C.t, fontWeight: 500 }}>{x.title}</div>
                </div>
              </div>
            ))}
            {!tl.length && <div style={{ textAlign: "center", padding: 48, color: C.s, fontFamily: SERIF }}>∿</div>}
          </>
        )}


        {/* ── STORIES TAB (grid) ── */}
        {tab === "al" && !sub && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: SERIF, fontSize: 20, color: C.t }}>{lb("st")}</span>
              {isOwner && <button onClick={() => { setForm({ emoji: "📖" }); setModal("na"); }} style={btnStyle()}>{lb("nl")}</button>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {al.map((a) => (
                <div key={a.id} style={{ borderRadius: 12, border: `1px solid ${C.b}`, position: "relative", overflow: "hidden", background: a.cover ? `url(${a.cover}) center/cover` : C.l, minHeight: 140, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <div onClick={() => setSub(a.id)} style={{ padding: 10, cursor: "pointer" }}>
                    <div style={{ display: "inline-block", padding: "6px 10px", borderRadius: 10, background: a.cover ? `${C.t}88` : `${C.l}cc`, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
                      <div style={{ fontSize: 24, marginBottom: 2 }}>{a.emoji}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: a.cover ? "#fff" : C.t }}>{a.title}</div>
                      <div style={{ fontSize: 11, color: a.cover ? "rgba(255,255,255,.8)" : C.s, marginTop: 2 }}>{(a.photos || []).length} {lb("ph")}</div>
                    </div>
                  </div>
                  {isOwner && <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4 }}>
                    <button onClick={(e) => { e.stopPropagation(); setForm({ emoji: a.emoji, title: a.title, _id: a.id }); setModal("na"); }}
                      style={{ ...iconBtn, color: a.cover ? "#fff" : C.s, background: a.cover ? "rgba(0,0,0,.3)" : "rgba(255,255,255,.7)", borderRadius: "50%", width: 28, height: 28, justifyContent: "center", fontSize: 12 }}>✎</button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDel({ type: "album", id: a.id }); }}
                      style={{ ...iconBtn, color: a.cover ? "#fff" : C.s, background: a.cover ? "rgba(0,0,0,.3)" : "rgba(255,255,255,.7)", borderRadius: "50%", width: 28, height: 28, justifyContent: "center" }}>{TrashIcon}</button>
                  </div>}
                </div>
              ))}
            </div>
          </>
        )}


        {/* ── STORIES TAB (album detail) ── */}
        {tab === "al" && sub && currentAlbum && (
          <>
            <input ref={fileRef} type="file" accept="image/*,video/*" multiple
              onChange={async (e) => {
                setUploading(true);
                const files = Array.from(e.target.files || []);
                const results = [];
                for (const f of files) {
                  const base64 = await new Promise((res) => {
                    const r = new FileReader(); r.onload = (ev) => res(ev.target.result); r.readAsDataURL(f);
                  });
                  const url = await upload(base64);
                  results.push({ id: Date.now() + Math.random(), src: url });
                }
                updateData({ ...D, albums: al.map((a) => a.id === currentAlbum.id ? { ...a, photos: [...(a.photos || []), ...results] } : a) });
                setUploading(false);
              }} style={{ display: "none" }} />

            <input ref={fileRef3} type="file" accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return;
                setUploading(true);
                const base64 = await new Promise((res) => {
                  const r = new FileReader(); r.onload = (ev) => res(ev.target.result); r.readAsDataURL(f);
                });
                const url = await upload(base64);
                updateData({ ...D, albums: al.map((a) => a.id === currentAlbum.id ? { ...a, cover: url } : a) });
                setUploading(false);
              }} style={{ display: "none" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <button onClick={() => setSub(null)} style={iconBtn}>{BackIcon}</button>
              <span style={{ fontSize: 22 }}>{currentAlbum.emoji}</span>
              <span style={{ fontFamily: SERIF, fontSize: 20, color: C.t, flex: 1 }}>{currentAlbum.title}</span>
              {isOwner && <button onClick={() => { setForm({ emoji: currentAlbum.emoji, title: currentAlbum.title, _id: currentAlbum.id }); setModal("na"); }}
                style={{ ...iconBtn, color: C.s, fontSize: 13 }}>✎</button>}
            </div>

            {currentAlbum.cover ? (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <img src={currentAlbum.cover} alt="" style={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 12 }} />
                <button onClick={() => fileRef3.current?.click()} style={{ position: "absolute", bottom: 8, right: 8, padding: "4px 10px", borderRadius: 16, border: "none", background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 11, cursor: "pointer" }}>📷</button>
              </div>
            ) : (
              <button onClick={() => fileRef3.current?.click()} style={{ width: "100%", padding: 14, borderRadius: 12, border: `1px dashed ${C.b}`, background: "#fff", color: C.s, fontSize: 13, cursor: "pointer", marginBottom: 12, fontFamily: FONT }}>
                📷 {zh ? "设置封面" : "Set Cover Photo"}
              </button>
            )}

            {uploading && <div style={{ textAlign: "center", padding: 12, color: C.s, fontSize: 13 }}>{zh ? "上传中…" : "Uploading…"}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3, borderRadius: 12, overflow: "hidden" }}>
              {(currentAlbum.photos || []).map((p) => (
                <div key={p.id} onClick={() => setViewer(p)} style={{ aspectRatio: "1", cursor: "pointer", overflow: "hidden" }}>
                  {p.src?.match(/\.(mp4|mov|webm)/i) ? (
                    <video src={p.src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                </div>
              ))}
            </div>
            {!(currentAlbum.photos || []).length && !uploading && (
              <div style={{ textAlign: "center", padding: 40, color: C.s, fontSize: 13 }}>{zh ? "还没有照片" : "No photos yet"}</div>
            )}

            {isOwner && <button onClick={() => fileRef.current?.click()}
              style={{ position: "fixed", bottom: 80, right: 20, width: 48, height: 48, borderRadius: "50%", border: "none", background: C.t, color: "#fff", cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,.1)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
              {PlusIcon}
            </button>}

            {/* Photo viewer */}
            {viewer && (
              <div onClick={() => setViewer(null)} style={{ position: "fixed", inset: 0, zIndex: 600, background: "rgba(0,0,0,.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 }}>
                {viewer.src?.match(/\.(mp4|mov|webm)/i) ? (
                  <video src={viewer.src} controls style={{ maxWidth: "92%", maxHeight: "75vh", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
                ) : (
                  <img src={viewer.src} alt="" style={{ maxWidth: "92%", maxHeight: "75vh", borderRadius: 8 }} onClick={(e) => e.stopPropagation()} />
                )}
                {isOwner && <button onClick={(e) => { e.stopPropagation(); setConfirmDel({ type: "photo", id: viewer.id }); }}
                  style={{ marginTop: 16, padding: "8px 20px", borderRadius: 20, border: "1px solid rgba(255,255,255,.2)", background: "transparent", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                  {zh ? "删除" : "Delete"}
                </button>}
              </div>
            )}
          </>
        )}


        {/* ── GOALS TAB ── */}
        {tab === "gl" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: SERIF, fontSize: 20, color: C.t }}>{lb("dr")}</span>
              {isOwner && <button onClick={() => { setForm({ emoji: "🎯" }); setModal("ng"); }} style={btnStyle()}>{lb("nl")}</button>}
            </div>

            {gl.map((g) => (
              <div key={g.id} style={{ background: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${C.b}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: C.t }}>{g.emoji} {g.title}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {isOwner && <><button onClick={() => { setForm({ emoji: g.emoji, title: g.title, _id: g.id }); setModal("ng"); }} style={{ ...iconBtn, color: C.s, fontSize: 12 }}>✎</button>
                    <button onClick={() => setConfirmDel({ type: "goal", id: g.id })} style={{ ...iconBtn, color: C.s }}>{TrashIcon}</button></>}
                  </div>
                </div>

                {(g.items || []).map((it) => (
                  <div key={it.id} onClick={() => updateData({ ...D, goals: gl.map((x) => x.id === g.id ? { ...x, items: x.items.map((i) => i.id === it.id ? { ...i, done: !i.done } : i) } : x) })}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: "pointer" }}>
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: it.done ? "none" : `1.5px solid ${C.b}`, background: it.done ? C.a : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {it.done && CheckIcon}
                    </div>
                    <span style={{ fontSize: 14, color: it.done ? C.s : C.t, textDecoration: it.done ? "line-through" : "none" }}>{it.text}</span>
                  </div>
                ))}

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input value={itemTexts[g.id] || ""} onChange={(e) => setItemTexts((p) => ({ ...p, [g.id]: e.target.value }))}
                    placeholder={zh ? "添加…" : "Add item…"} style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = itemTexts[g.id]; if (!v?.trim()) return;
                        updateData({ ...D, goals: gl.map((x) => x.id === g.id ? { ...x, items: [...(x.items || []), { id: Date.now(), text: v.trim(), done: false }] } : x) });
                        setItemTexts((p) => ({ ...p, [g.id]: "" }));
                      }
                    }} />
                  <button onClick={() => {
                    const v = itemTexts[g.id]; if (!v?.trim()) return;
                    updateData({ ...D, goals: gl.map((x) => x.id === g.id ? { ...x, items: [...(x.items || []), { id: Date.now(), text: v.trim(), done: false }] } : x) });
                    setItemTexts((p) => ({ ...p, [g.id]: "" }));
                  }} style={{ padding: "0 14px", borderRadius: 8, border: "none", background: "#fafafa", cursor: "pointer" }}>+</button>
                </div>
              </div>
            ))}
            {!gl.length && <div style={{ textAlign: "center", padding: 48, color: C.s, fontFamily: SERIF }}>{zh ? "一起畅想" : "Dream together"}</div>}
          </>
        )}


        {/* ── WHISPERS TAB ── */}
        {tab === "wh" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontFamily: SERIF, fontSize: 20, color: C.t }}>{lb("wh")}</span>
              {isOwner && <button onClick={() => { setForm({ from: zh ? "我" : "Me" }); setModal("nw"); }} style={btnStyle()}>{zh ? "+ 写" : "+ Write"}</button>}
            </div>

            {wh.map((w, i) => (
              <div key={w.id} style={{ background: [C.l, "#fef8f8", "#fdf5f2", "#f8f2f8"][i % 4], borderRadius: 12, padding: 18, marginBottom: 10 }}>
                <div style={{ fontSize: 15, color: C.t, lineHeight: 1.7, fontFamily: SERIF, fontStyle: "italic" }}>"{w.text}"</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: C.s }}>— {w.from} · {formatShort(w.date)}</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {isOwner && <><button onClick={() => { setForm({ text: w.text, from: w.from, _id: w.id }); setModal("nw"); }} style={{ ...iconBtn, color: C.s, fontSize: 12 }}>✎</button>
                    <button onClick={() => setConfirmDel({ type: "whisper", id: w.id })} style={{ ...iconBtn, color: C.s }}>{TrashIcon}</button></>}
                  </div>
                </div>
              </div>
            ))}
            {!wh.length && <div style={{ textAlign: "center", padding: 48, color: C.s, fontFamily: SERIF, fontStyle: "italic" }}>{zh ? "写纸条 ♡" : "Leave a note ♡"}</div>}
          </>
        )}
      </div>


      {/* ══ CONFIRM DELETE ══ */}
      <Confirm open={!!confirmDel} C={C}
        message={zh ? "确定要删除吗？" : "Are you sure you want to delete this?"}
        onNo={() => setConfirmDel(null)}
        onYes={() => {
          if (!confirmDel) return;
          if (confirmDel.type === "album") updateData({ ...D, albums: al.filter((x) => x.id !== confirmDel.id) });
          if (confirmDel.type === "photo") { updateData({ ...D, albums: al.map((a) => a.id === currentAlbum?.id ? { ...a, photos: (a.photos || []).filter((p) => p.id !== confirmDel.id) } : a) }); setViewer(null); }
          if (confirmDel.type === "goal") updateData({ ...D, goals: gl.filter((x) => x.id !== confirmDel.id) });
          if (confirmDel.type === "whisper") updateData({ ...D, whispers: wh.filter((x) => x.id !== confirmDel.id) });
          setConfirmDel(null);
        }} />


      {/* ══ AI ORGANIZE MODAL ══ */}
      <Overlay open={modal === "ai"} onClose={() => { setModal(""); setAiResults(null); }}
        title={zh ? "AI整理" : "AI Organize"}>
        {!aiResults ? (
          <>
            <textarea value={aiNotes} onChange={(e) => setAiNotes(e.target.value)}
              placeholder={zh ? "2024年1月认识\n4月去Banff…" : "Met Jan 2024\nBanff trip April…"}
              rows={5} style={{ ...inputStyle, resize: "vertical" }} />
            <button onClick={async () => {
              if (!aiNotes.trim()) return;
              setAiLoading(true);
              try {
                const r = await doAI(`Organize couple notes into timeline. JSON array only. Each:{"title":"...","date":"YYYY-MM-DD","text":"warm caption"}\n\n"${aiNotes.trim()}"`);
                const c = r.replace(/```json|```/g, "").trim();
                const m = c.match(/\[[\s\S]*\]/);
                setAiResults((m ? JSON.parse(m[0]) : JSON.parse(c)).map((p) => ({ ...p, id: Date.now() + Math.random(), sk: false })));
              } catch { alert("Try again"); }
              setAiLoading(false);
            }} disabled={aiLoading}
              style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: aiLoading ? C.b : C.t, color: aiLoading ? C.s : "#fff", fontSize: 14, cursor: aiLoading ? "wait" : "pointer", fontFamily: FONT }}>
              {aiLoading ? (zh ? "整理中…" : "Organizing…") : (zh ? "整理" : "Organize")}
            </button>
          </>
        ) : (
          <>
            {aiResults.map((r) => (
              <div key={r.id} onClick={() => setAiResults((p) => p.map((x) => x.id === r.id ? { ...x, sk: !x.sk } : x))}
                style={{ padding: 12, borderRadius: 10, border: `1px solid ${r.sk ? C.b : C.a}40`, marginBottom: 8, cursor: "pointer", opacity: r.sk ? 0.4 : 1 }}>
                <div style={{ fontSize: 11, color: C.s }}>{formatDate(r.date)}</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: SERIF }}>{r.title}</div>
                <div style={{ fontSize: 13, color: C.s }}>{r.text}</div>
              </div>
            ))}
            <button onClick={() => {
              sortTimeline([...tl, ...aiResults.filter((r) => !r.sk)]);
              setAiResults(null); setAiNotes(""); setModal("");
            }} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: C.t, color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: FONT, marginTop: 8 }}>
              {zh ? "添加" : "Add"} ({aiResults.filter((r) => !r.sk).length})
            </button>
          </>
        )}
      </Overlay>


      {/* ══ NEW/EDIT ALBUM MODAL ══ */}
      <Overlay open={modal === "na"} onClose={() => setModal("")}
        title={form._id ? (zh ? "编辑相册" : "Edit Album") : (zh ? "新相册" : "New Album")}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={() => setEmojiPicker("na")} style={{ width: 48, height: 48, borderRadius: 12, border: `1px solid ${C.b}`, background: "#fff", fontSize: 24, cursor: "pointer" }}>{form.emoji || "📖"}</button>
          <span style={{ fontSize: 13, color: C.s }}>{zh ? "点击选emoji" : "Tap to pick emoji"}</span>
        </div>
        <input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="NYC Trip" style={inputStyle} />
        <button onClick={() => {
          if (!form.title?.trim()) return;
          if (form._id) {
            updateData({ ...D, albums: al.map((a) => a.id === form._id ? { ...a, title: form.title.trim(), emoji: form.emoji || a.emoji } : a) });
          } else {
            updateData({ ...D, albums: [...al, { id: Date.now(), title: form.title.trim(), emoji: form.emoji || "📖", photos: [], cover: null }] });
          }
          setModal("");
        }} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: C.t, color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: FONT }}>
          {form._id ? (zh ? "更新" : "Update") : (zh ? "创建" : "Create")}
        </button>
      </Overlay>


      {/* ══ NEW/EDIT GOAL MODAL ══ */}
      <Overlay open={modal === "ng"} onClose={() => setModal("")}
        title={form._id ? (zh ? "编辑目标" : "Edit Goal") : (zh ? "新目标" : "New Goal")}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <button onClick={() => setEmojiPicker("ng")} style={{ width: 48, height: 48, borderRadius: 12, border: `1px solid ${C.b}`, background: "#fff", fontSize: 24, cursor: "pointer" }}>{form.emoji || "🎯"}</button>
          <span style={{ fontSize: 13, color: C.s }}>{zh ? "点击选emoji" : "Tap to pick emoji"}</span>
        </div>
        <input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={zh ? "旅行计划" : "Bucket list"} style={inputStyle} />
        <button onClick={() => {
          if (!form.title?.trim()) return;
          if (form._id) {
            updateData({ ...D, goals: gl.map((g) => g.id === form._id ? { ...g, title: form.title.trim(), emoji: form.emoji || g.emoji } : g) });
          } else {
            updateData({ ...D, goals: [...gl, { id: Date.now(), title: form.title.trim(), emoji: form.emoji || "🎯", items: [] }] });
          }
          setModal("");
        }} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: C.t, color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: FONT }}>
          {form._id ? (zh ? "更新" : "Update") : (zh ? "创建" : "Create")}
        </button>
      </Overlay>


      {/* ══ NEW/EDIT WHISPER MODAL ══ */}
      <Overlay open={modal === "nw"} onClose={() => setModal("")}
        title={form._id ? (zh ? "编辑悄悄话" : "Edit Whisper") : (zh ? "写悄悄话" : "Write a Whisper")}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[zh ? "我" : "Me", zh ? "你" : "You"].map((f) => (
            <button key={f} onClick={() => setForm({ ...form, from: f })}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${form.from === f ? C.a : C.b}`, background: form.from === f ? C.l : "#fff", color: C.t, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>
              {f}
            </button>
          ))}
        </div>
        <textarea value={form.text || ""} onChange={(e) => setForm({ ...form, text: e.target.value })}
          placeholder={zh ? "我喜欢你…" : "I love the way you…"} rows={3}
          style={{ ...inputStyle, resize: "vertical", fontFamily: SERIF, fontStyle: "italic" }} />
        <button onClick={() => {
          if (!form.text?.trim()) return;
          if (form._id) {
            updateData({ ...D, whispers: wh.map((w) => w.id === form._id ? { ...w, text: form.text.trim(), from: form.from || w.from } : w) });
          } else {
            updateData({ ...D, whispers: [{ id: Date.now(), text: form.text.trim(), from: form.from || (zh ? "我" : "Me"), date: new Date().toISOString().slice(0, 10) }, ...wh] });
          }
          setModal("");
        }} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: C.t, color: "#fff", fontSize: 15, cursor: "pointer", fontFamily: FONT }}>
          {form._id ? (zh ? "更新" : "Update") : (zh ? "留下 ♡" : "Leave Note ♡")}
        </button>
      </Overlay>


      {/* ══ UPLOAD MODAL ══ */}
      <Overlay open={modal === "up"} onClose={() => setModal("")} title={zh ? "上传" : "Upload"}>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple
          onChange={(e) => {
            Array.from(e.target.files || []).forEach((f) => {
              const r = new FileReader();
              r.onload = (ev) => setPhotos((p) => [...p, { id: Date.now() + Math.random(), src: ev.target.result }]);
              r.readAsDataURL(f);
            });
          }} style={{ display: "none" }} />
        {!photos.length ? (
          <div onClick={() => fileRef.current?.click()}
            style={{ border: `2px dashed ${C.b}`, borderRadius: 12, padding: "40px 20px", textAlign: "center", cursor: "pointer", color: C.s }}>
            📷 {zh ? "选择照片/视频" : "Select photos/videos"}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {photos.map((p) => (
                <div key={p.id} style={{ width: 56, height: 56, borderRadius: 8, overflow: "hidden", position: "relative" }}>
                  <img src={p.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))}
                    style={{ position: "absolute", top: 1, right: 1, width: 16, height: 16, borderRadius: "50%", border: "none", background: "rgba(0,0,0,.5)", color: "#fff", fontSize: 10, cursor: "pointer" }}>×</button>
                </div>
              ))}
              <div onClick={() => fileRef.current?.click()}
                style={{ width: 56, height: 56, borderRadius: 8, border: `1px dashed ${C.b}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.s }}>+</div>
            </div>

            <div style={labelStyle}>{zh ? "放入哪个故事？" : "Which story?"}</div>
            {al.map((a) => (
              <div key={a.id} onClick={() => setTarget(a.id)}
                style={{ padding: "10px 12px", borderRadius: 10, border: `1px solid ${target === a.id ? C.a : C.b}`, background: target === a.id ? C.l : "#fff", cursor: "pointer", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                <span>{a.emoji} {a.title}</span>
                {target === a.id && <span style={{ marginLeft: "auto", color: C.a }}>{CheckIcon}</span>}
              </div>
            ))}

            <button disabled={!target || uploading} onClick={async () => {
              if (!target || !photos.length) return;
              setUploading(true);
              const results = [];
              for (const p of photos) {
                const url = await upload(p.src);
                results.push({ id: Date.now() + Math.random(), src: url });
              }
              updateData({ ...D, albums: al.map((a) => a.id === target ? { ...a, photos: [...(a.photos || []), ...results] } : a) });
              setPhotos([]); setTarget(null); setModal(""); setUploading(false);
            }} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: target ? C.t : C.b, color: target ? "#fff" : C.s, fontSize: 15, cursor: target && !uploading ? "pointer" : "default", fontFamily: FONT, marginTop: 12 }}>
              {uploading ? (zh ? "上传中…" : "Uploading…") : `${zh ? "上传" : "Upload"} (${photos.length})`}
            </button>
          </>
        )}
      </Overlay>


      {/* ══ SETTINGS MODAL ══ */}
      <Overlay open={modal === "se"} onClose={() => setModal("")} title={zh ? "设置" : "Settings"}>
        <label style={labelStyle}>{zh ? "语言" : "Language"}</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["en", "English"], ["zh", "中文"]].map(([k, v]) => (
            <button key={k} onClick={() => { setLang(k); saveSettings({ lang: k, theme }); }}
              style={{ flex: 1, padding: 10, borderRadius: 8, border: `1px solid ${lang === k ? C.a : C.b}`, background: lang === k ? C.l : "#fff", color: C.t, fontSize: 14, cursor: "pointer", fontFamily: FONT, fontWeight: lang === k ? 600 : 400 }}>
              {v}
            </button>
          ))}
        </div>

        <label style={labelStyle}>{zh ? "配色" : "Theme"}</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, marginBottom: 20 }}>
          {Object.entries(THEMES).map(([k, v]) => (
            <div key={k} onClick={() => { setTheme(k); saveSettings({ lang, theme: k }); }} style={{ cursor: "pointer", textAlign: "center" }}>
              <div style={{ width: "100%", aspectRatio: "1", borderRadius: 10, background: v.a, border: theme === k ? `3px solid ${v.a}` : "3px solid transparent", boxShadow: theme === k ? `0 0 0 2px #fff, 0 0 0 4px ${v.a}` : "none" }} />
              <div style={{ fontSize: 10, color: C.s, marginTop: 4 }}>{v.n}</div>
            </div>
          ))}
        </div>

        <label style={labelStyle}>{zh ? "纪念日" : "Anniversary"}</label>
        {isOwner && <input type="date" value={D.startDate || ""} onChange={(e) => updateData({ ...D, startDate: e.target.value })} style={inputStyle} />}
        {!isOwner && D.startDate && <div style={{ fontSize: 14, color: C.t, marginBottom: 10 }}>{formatDate(D.startDate)}</div>}

        <div style={{ marginTop: 20, borderTop: `1px solid ${C.b}`, paddingTop: 16 }}>
          <label style={labelStyle}>{zh ? "账号" : "Account"}</label>
          {isOwner ? (
            <div>
              <div style={{ fontSize: 13, color: C.s, marginBottom: 8 }}>{user.email}</div>
              <button onClick={() => logout()} style={{ padding: "10px 20px", borderRadius: 8, border: `1px solid ${C.b}`, background: "#fff", color: C.s, fontSize: 13, cursor: "pointer", fontFamily: FONT }}>{zh ? "退出登录" : "Log out"}</button>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 13, color: C.s, marginBottom: 10 }}>{zh ? "登录后可编辑内容" : "Log in to edit content"}</div>
              <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
              <input value={loginPass} onChange={(e) => setLoginPass(e.target.value)} placeholder={zh ? "密码" : "Password"} type="password" style={inputStyle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    login(loginEmail, loginPass).then(() => { setLoginError(""); setModal(""); }).catch(() => setLoginError(zh ? "邮箱或密码错误" : "Invalid email or password"));
                  }
                }} />
              {loginError && <div style={{ color: "#c97070", fontSize: 13, marginBottom: 8 }}>{loginError}</div>}
              <button onClick={() => {
                login(loginEmail, loginPass).then(() => { setLoginError(""); setModal(""); }).catch(() => setLoginError(zh ? "邮箱或密码错误" : "Invalid email or password"));
              }} style={{ width: "100%", padding: 13, borderRadius: 10, border: "none", background: C.t, color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: FONT }}>{zh ? "登录" : "Log in"}</button>
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: C.s, marginTop: 16 }}>♡</p>
      </Overlay>


      {/* ══ EMOJI PICKER ══ */}
      <EmojiPicker show={!!emojiPicker} onPick={(e) => setForm((p) => ({ ...p, emoji: e }))} onClose={() => setEmojiPicker(null)} />


      {/* ══ BOTTOM NAV ══ */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 480, background: "#fff", borderTop: `1px solid ${C.b}`, display: "flex", alignItems: "flex-end", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom, 0)" }}>
        {NAV_ITEMS.map(([id, ic, isCenter]) => (
          <button key={id} onClick={() => { setTab(id); setSub(null); setModal(""); setExpanded(null); }}
            style={{ flex: 1, padding: isCenter ? "6px 0 10px" : "10px 0 8px", background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab === id ? C.a : C.s, ...(isCenter ? { marginTop: -16 } : {}) }}>
            {isCenter ? (
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: tab === id ? C.a : C.m, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${C.a}40` }}>{ic}</div>
            ) : (
              <>
                <span style={{ opacity: tab === id ? 1 : 0.45 }}>{ic}</span>
                <span style={{ fontSize: 10, fontWeight: tab === id ? 600 : 400 }}>
                  {{ tl: lb("tl"), al: lb("st"), gl: lb("dr"), wh: lb("wh") }[id] || ""}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
