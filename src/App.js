import React, { useState } from "react";

// SIMPLE NAVIGATION SYSTEM FOR APP.JS VERSION
// Tabs: Feed, Upload, Camera, Account, Settings

export default function App() {
  const [tab, setTab] = useState("feed");

  return (
    <div style={styles.app}>
      {/* MAIN CONTENT AREA */}
      <div style={styles.content}>
        {tab === "feed" && <Feed />}
        {tab === "upload" && <Upload />}
        {tab === "camera" && <Camera />}
        {tab === "account" && <Account />}
        {tab === "settings" && <Settings />}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div style={styles.navbar}>
        <button style={styles.navBtn} onClick={() => setTab("feed")}>Feed</button>
        <button style={styles.navBtn} onClick={() => setTab("upload")}>Upload</button>
        <button style={styles.navBtn} onClick={() => setTab("camera")}>Camera</button>
        <button style={styles.navBtn} onClick={() => setTab("account")}>Account</button>
        <button style={styles.navBtn} onClick={() => setTab("settings")}>Settings</button>
      </div>
    </div>
  );
}

// FEED TAB — shows everyone’s posts
function Feed() {
  return (
    <div style={styles.screen}>
      <h2>People's News — Feed</h2>
      <p>This is where users will see all uploaded videos, photos, and reports.</p>
    </div>
  );
}

// UPLOAD TAB — upload photos/videos and write details
function Upload() {
  return (
    <div style={styles.screen}>
      <h2>Upload Report</h2>
      <p>Upload images/videos and describe the event.</p>
      <input type="file" accept="image/*,video/*" style={styles.input} />
      <textarea placeholder="Describe what happened..." style={styles.textarea} />
      <button style={styles.button}>Submit</button>
    </div>
  );
}

// CAMERA TAB — opens device camera
function Camera() {
  return (
    <div style={styles.screen}>
      <h2>Camera Access</h2>
      <p>On a real mobile app, this would open the device camera.</p>
      <input type="file" accept="image/*,video/*" capture="environment" style={styles.input} />
    </div>
  );
}

// ACCOUNT TAB — user's profile
function Account() {
  return (
    <div style={styles.screen}>
      <h2>Your Account</h2>
      <p>Profile, earnings, uploaded reports, etc.</p>
    </div>
  );
}

// SETTINGS TAB — user preferences
function Settings() {
  return (
    <div style={styles.screen}>
      <h2>Settings</h2>
      <p>Notification preferences, privacy, location setup.</p>
    </div>
  );
}

// SIMPLE INLINE STYLES
const styles = {
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
    background: "#f5f5f5",
  },
  content: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
  },
  navbar: {
    display: "flex",
    justifyContent: "space-around",
    background: "#222",
    padding: "10px 0",
  },
  navBtn: {
    color: "white",
    background: "none",
    border: "none",
    fontSize: "16px",
  },
  screen: {
    padding: "10px",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 0 5px rgba(0,0,0,0.1)",
  },
  input: {
    width: "100%",
    margin: "10px 0",
  },
  textarea: {
    width: "100%",
    height: "100px",
    margin: "10px 0",
  },
  button: {
    padding: "10px 15px",
    fontSize: "16px",
    background: "black",
    color: "white",
    border: "none",
    borderRadius: "6px",
  },
};
