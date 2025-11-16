// src/App.js
import React, { useEffect, useState } from "react";
import { FaHome, FaUpload, FaUser, FaCog, FaCamera } from "react-icons/fa";

/* ---------------- MOCK STORAGE/DB (client-side) ---------------- */

const MOCK_DB_KEY = "pn_mock_db_v1";
const loadState = () => JSON.parse(localStorage.getItem(MOCK_DB_KEY) || "null") || { users: {}, posts: [], moderation: [] };
const saveState = (s) => localStorage.setItem(MOCK_DB_KEY, JSON.stringify(s));

const MOCK = (() => {
  let state = loadState();

  const persist = () => { saveState(state); };

  function signUp({ name, email }) {
    const id = "u_" + Math.random().toString(36).slice(2, 9);
    const user = { id, name, email, balance: 0, reputation: 5, joinedAt: Date.now() };
    state.users[id] = user; persist();
    return user;
  }

  function signIn({ email }) {
    return Object.values(state.users).find(u => u.email === email) || null;
  }

  function createPost({ userId, category, desc, media, coords }) {
    const id = "p_" + Math.random().toString(36).slice(2, 9);
    const post = {
      id,
      userId,
      category,
      desc,
      media,
      coords: coords || null,
      createdAt: Date.now(),
      approved: false,
      payout: estimatePayout({ category, media, userRep: state.users[userId]?.reputation || 0 }),
      views: 0
    };
    state.posts.unshift(post);
    state.moderation.push({ postId: id, status: "pending" });
    persist();
    return post;
  }

  function estimatePayout({ category, media, userRep }) {
    const base = 5;
    const mediaBonus = media ? (media.type?.startsWith("video") ? 15 : 6) : 0;
    const catMult = (category === "Accident" || category === "Police") ? 1.4 : 1.0;
    const repBonus = Math.min(20, userRep * 0.5);
    return Math.round((base + mediaBonus + repBonus) * catMult);
  }

  function getFeed({ centerCoords, radiusMiles = 50 }) {
    function distMiles(a, b) {
      if (!a || !b) return 9999;
      const R = 3958.8;
      const dLat = (b.lat - a.lat) * (Math.PI / 180);
      const dLon = (b.lon - a.lon) * (Math.PI / 180);
      const lat1 = a.lat * (Math.PI / 180);
      const lat2 = b.lat * (Math.PI / 180);
      const aa = Math.sin(dLat/2)**2 + Math.sin(dLon/2)**2 * Math.cos(lat1)*Math.cos(lat2);
      const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
      return R * c;
    }

    return state.posts
      .filter(p => p.approved)
      .map(p => ({ ...p, user: state.users[p.userId], distance: (centerCoords && p.coords) ? Math.round(distMiles(centerCoords, p.coords)) : null }))
      .filter(p => (centerCoords && p.distance != null ? p.distance <= radiusMiles : true))
      .sort((a,b) => b.createdAt - a.createdAt);
  }

  function approvePost(postId) {
    const mod = state.moderation.find(m => m.postId === postId);
    if (mod) mod.status = "approved";
    const post = state.posts.find(p => p.id === postId);
    if (post) post.approved = true;
    persist();
  }

  function rejectPost(postId) {
    state.moderation = state.moderation.map(m => m.postId === postId ? { ...m, status: "rejected" } : m);
    state.posts = state.posts.filter(p => p.id !== postId);
    persist();
  }

  function recordView(postId) {
    const p = state.posts.find(x => x.id === postId);
    if (p) {
      p.views = (p.views || 0) + 1;
      const owner = state.users[p.userId];
      if (owner && p.approved) owner.balance = Math.round(((owner.balance || 0) + 0.01) * 100) / 100;
      persist();
    }
  }

  function requestPayout(userId, amount) {
    const user = state.users[userId];
    if (!user) throw new Error("no user");
    if ((user.balance || 0) < amount) throw new Error("insufficient funds");
    user.balance = Math.round((user.balance - amount) * 100) / 100;
    persist();
    return { success: true, paid: amount };
  }

  function getUser(userId) { return state.users[userId]; }

  return { signUp, signIn, createPost, getFeed, approvePost, rejectPost, recordView, requestPayout, getUser, _raw: state };
})();

/* ----------------------- UI / App Components ----------------------- */

function Nav({ active, onChange }) {
  return (
    <div style={ui.navbar}>
      <NavBtn active={active === "feed"} onClick={() => onChange("feed")} icon={<FaHome />}>Feed</NavBtn>
      <NavBtn active={active === "upload"} onClick={() => onChange("upload")} icon={<FaUpload />}>Upload</NavBtn>
      <NavBtn active={active === "camera"} onClick={() => onChange("camera")} icon={<FaCamera />}>Camera</NavBtn>
      <NavBtn active={active === "account"} onClick={() => onChange("account")} icon={<FaUser />}>Account</NavBtn>
      <NavBtn active={active === "settings"} onClick={() => onChange("settings")} icon={<FaCog />}>Settings</NavBtn>
    </div>
  );
}
function NavBtn({ children, onClick, active, icon }) {
  return (
    <button onClick={onClick} style={{ ...ui.navBtn, ...(active ? ui.navBtnActive : {}) }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 12 }}>{children}</div>
    </button>
  );
}

/* -------------------------- Main App -------------------------- */

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("pn_current_user") || "null"));
  const [tab, setTab] = useState("feed");
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => setCoords({ lat: 40.8, lon: -74.2 })
      );
    } else {
      setCoords({ lat: 40.8, lon: -74.2 });
    }
  }, []);

  function handleSignIn({ name, email }) {
    let u = MOCK.signIn({ email });
    if (!u) u = MOCK.signUp({ name, email });
    setUser(u);
    localStorage.setItem("pn_current_user", JSON.stringify(u));
  }

  function refreshUser() {
    if (!user) return;
    const fresh = MOCK.getUser(user.id);
    setUser(fresh);
    localStorage.setItem("pn_current_user", JSON.stringify(fresh));
  }

  return (
    <div style={ui.app}>
      <div style={ui.header}>
        <div style={{ fontWeight: 700 }}>People's News — Mock</div>
        <div style={{ fontSize: 13 }}>{user ? `Hi, ${user.name}` : "Not signed in"}</div>
      </div>

      <div style={ui.content}>
        {tab === "feed" && <FeedTab centerCoords={coords} />}
        {tab === "upload" && <UploadTab user={user} onSignIn={handleSignIn} onPosted={() => setTab("feed")} coords={coords} refreshUser={refreshUser} />}
        {tab === "camera" && <CameraTab user={user} onSignIn={handleSignIn} onPosted={() => setTab("feed")} coords={coords} />}
        {tab === "account" && <AccountTab user={user} onSignIn={handleSignIn} refreshUser={refreshUser} />}
        {tab === "settings" && <SettingsTab />}
      </div>

      <Nav active={tab} onChange={setTab} />
    </div>
  );
}

/* ---------------------------- Tabs ---------------------------- */

function FeedTab({ centerCoords }) {
  const [feed, setFeed] = useState(MOCK.getFeed({ centerCoords, radiusMiles: 50 }));
  const [radius, setRadius] = useState(50);

  useEffect(() => {
    setFeed(MOCK.getFeed({ centerCoords, radiusMiles: radius }));
  }, [centerCoords, radius]);

  return (
    <div>
      <h2>Local Feed</h2>
      <div style={{ marginBottom: 8 }}>
        <label>Radius (miles): </label>
        <input type="range" min="1" max="200" value={radius} onChange={(e) => setRadius(Number(e.target.value))} /> {radius} mi
      </div>

      {feed.length === 0 && <div style={ui.card}>No approved posts in your area yet.</div>}

      {feed.map((p) => (
        <div key={p.id} style={ui.card}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <strong>{p.category}</strong> • <small>{p.user?.name || "unknown"}</small>
              <div style={{ fontSize: 12, color: "#666" }}>{p.distance != null ? `${p.distance} mi` : "distance unknown"} • {new Date(p.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700 }}>${p.payout}</div>
              <div style={{ fontSize: 12 }}>Est. payout</div>
            </div>
          </div>

          <p>{p.desc}</p>

          {p.media && (p.media.type?.startsWith("video") ? <video src={p.media.url} controls style={{ maxWidth: "100%" }} /> : <img src={p.media.url} alt="media" style={{ maxWidth: "100%" }} />)}

          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={() => { MOCK.recordView(p.id); alert("View recorded (mock)"); }}>View</button>
            <button onClick={() => { navigator.clipboard?.writeText(window.location.href + "#post=" + p.id); alert("Link copied"); }}>Share</button>
            <button onClick={() => { alert("Reported. Moderator will review (mock)."); }}>Report</button>
          </div>
        </div>
      ))}

      <ModerationPanel />
    </div>
  );
}

function UploadTab({ user, onSignIn, onPosted, coords, refreshUser }) {
  const [category, setCategory] = useState("Accident");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState(null);

  function handleFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setFile({ url, type: f.type, name: f.name, size: f.size });
  }

  function submit() {
    if (!user) {
      const name = prompt("Enter display name");
      const email = prompt("Enter email (for mock sign-in)");
      if (!name || !email) return alert("Name & email required");
      onSignIn({ name, email });
      return;
    }
    const post = MOCK.createPost({ userId: user.id, category, desc, media: file, coords });
    alert("Post submitted to moderation (mock). Est payout: $" + post.payout);
    onPosted?.();
    refreshUser?.();
  }

  return (
    <div>
      <h2>Upload Report</h2>
      <div style={ui.card}>
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: "100%" }}>
          <option>Accident</option>
          <option>Fire</option>
          <option>Police</option>
          <option>Weather</option>
          <option>Event</option>
          <option>Other</option>
        </select>

        <label style={{ marginTop: 8 }}>Description</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} style={{ width: "100%" }} />

        <label style={{ marginTop: 8 }}>Photo / Video</label>
        <input type="file" accept="image/*,video/*" onChange={handleFile} />

        {file && (
          <div style={{ marginTop: 8 }}>
            {file.type?.startsWith("video") ? <video src={file.url} controls style={{ maxWidth: "100%" }} /> : <img src={file.url} alt="preview" style={{ maxWidth: "100%" }} />}
          </div>
        )}

        <button onClick={submit} style={{ marginTop: 10 }}>Submit to moderation</button>
      </div>
    </div>
  );
}

function CameraTab({ user, onSignIn, onPosted, coords }) {
  const [file, setFile] = useState(null);

  function handleCapture(e) {
    const f = e.target.files[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setFile({ url, type: f.type, name: f.name, size: f.size });
  }

  function send() {
    if (!user) {
      const name = prompt("Enter display name");
      const email = prompt("Enter email (for mock sign-in)");
      if (!name || !email) return alert("Name & email required");
      onSignIn({ name, email });
      return;
    }
    const post = MOCK.createPost({ userId: user.id, category: "Other", desc: "Uploaded from camera", media: file, coords });
    alert("Camera upload submitted to moderation (mock). Est payout: $" + post.payout);
    onPosted?.();
  }

  return (
    <div>
      <h2>Camera</h2>
      <div style={ui.card}>
        <input type="file" accept="image/*,video/*" capture="environment" onChange={handleCapture} />
        {file && (file.type?.startsWith("video") ? <video src={file.url} controls style={{ maxWidth: "100%" }} /> : <img src={file.url} alt="captured" style={{ maxWidth: "100%" }} />)}
        <button onClick={send} style={{ marginTop: 10 }}>Send</button>
      </div>
    </div>
  );
}

function AccountTab({ user, onSignIn, refreshUser }) {
  const [emailInput, setEmailInput] = useState("");

  function signIn() {
    const name = prompt("Enter display name");
    const email = prompt("Enter email (for mock sign-in)");
    if (!name || !email) return alert("Name & email required");
    onSignIn({ name, email });
  }

  function tryPayout() {
    if (!user) return alert("Sign in first");
    const amount = Number(prompt("Enter payout amount to request (mock)"));
    if (!amount) return;
    try {
      const result = MOCK.requestPayout(user.id, amount);
      alert("Payout successful (mock): $" + result.paid);
      refreshUser();
    } catch (err) {
      alert("Payout failed: " + err.message);
    }
  }

  return (
    <div>
      <h2>Account</h2>
      {!user && <div><button onClick={signIn}>Sign up / Sign in (mock)</button></div>}
      {user && (
        <div style={ui.card}>
          <div><strong>Name:</strong> {user.name}</div>
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Reputation:</strong> {user.reputation}</div>
          <div><strong>Balance (mock):</strong> ${user.balance || 0}</div>
          <button onClick={tryPayout} style={{ marginTop: 8 }}>Request Payout (mock)</button>
        </div>
      )}
    </div>
  );
}

function SettingsTab() {
  return (
    <div>
      <h2>Settings</h2>
      <div style={ui.card}>
        <div>Notifications: <select><option>On</option><option>Off</option></select></div>
        <div style={{ marginTop: 8 }}>Privacy: <select><option>Public</option><option>Private</option></select></div>
        <div style={{ marginTop: 8 }}><button>Delete account (mock)</button></div>
      </div>
    </div>
  );
}

/* ---------------------- Moderation Panel (admin simulation) ---------------------- */

function ModerationPanel() {
  const [mods, setMods] = useState(MOCK._raw.moderation || []);

  function refresh() { setMods([...MOCK._raw.moderation]); }

  function approve(id) { MOCK.approvePost(id); refresh(); alert("Post approved (mock)"); }
  function reject(id) { MOCK.rejectPost(id); refresh(); alert("Post rejected (mock)"); }

  return (
    <div style={{ marginTop: 20 }}>
      <h3>Moderation (mock)</h3>
      {mods.length === 0 && <div style={ui.card}>No moderation items.</div>}
      {mods.map(m => {
        const post = MOCK._raw.posts.find(p => p.id === m.postId);
        if (!post) return null;
        return (
          <div key={m.postId} style={ui.card}>
            <div><strong>{m.postId}</strong> • {m.status}</div>
            <div>{post.desc}</div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => approve(m.postId)}>Approve</button>
              <button onClick={() => reject(m.postId)} style={{ marginLeft: 8 }}>Reject</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------- STYLES ---------------------------- */

const ui = {
  app: { display: "flex", flexDirection: "column", height: "100vh", fontFamily: "Arial, sans-serif" },
  header: { padding: 12, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between" },
  content: { padding: 16, overflowY: "auto", flex: 1 },
  navbar: { display: "flex", justifyContent: "space-around", borderTop: "1px solid #ccc", padding: 8, background: "#f9f9f9" },
  navBtn: { background: "none", border: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" },
  navBtnActive: { color: "#007bff" },
  card: { padding: 12, marginBottom: 12, background: "#fff", borderRadius: 8, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
};

