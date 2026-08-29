/* MCPE Server Control — PWA logic */
const $ = (id) => document.getElementById(id);
let cfg = { url: "", token: "" };
let lastSeq = 0;
let pollStatusTimer = null, pollConsoleTimer = null;
let statusOnline = false;

function saveCfg() {
  cfg.url = $("cfgUrl").value.trim().replace(/\/+$/, "");
  cfg.token = $("cfgToken").value.trim();
  localStorage.setItem("mcpeCfg", JSON.stringify(cfg));
  closeModal();
  startPolling();
  updateStateLabel();
}
function loadCfg() {
  try { cfg = Object.assign({}, cfg, JSON.parse(localStorage.getItem("mcpeCfg") || "{}")); } catch (e) {}
  $("cfgUrl").value = cfg.url;
  $("cfgToken").value = cfg.token;
}

async function api(path, opts = {}) {
  if (!cfg.url) throw new Error("no url");
  const headers = { "X-Auth-Token": cfg.token, ...(opts.headers || {}) };
  if (opts.body) headers["Content-Type"] = "application/json";
  const res = await fetch(cfg.url + path, { ...opts, headers, cache: "no-store" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function pushLine(text, cls) {
  const c = $("console");
  const div = document.createElement("div");
  if (cls) div.className = cls;
  div.textContent = text;
  c.appendChild(div);
  while (c.childNodes.length > 600) c.removeChild(c.firstChild);
  const stick = c.scrollTop + c.clientHeight >= c.scrollHeight - 30;
  if (stick) c.scrollTop = c.scrollHeight;
}
function pushServerLine(text) {
  const m = text.match(/^\[(.*?)\] (.*)$/);
  if (m) {
    const t = document.createElement("span");
    t.className = "time"; t.textContent = "[" + m[1] + "] ";
    const rest = document.createElement("span");
    rest.className = (m[2] && /WARN|ERROR/i.test(m[2])) ? (/ERROR/i.test(m[2]) ? "err" : "warn") : "srv";
    rest.textContent = m[2];
    const d = document.createElement("div");
    d.appendChild(t); d.appendChild(rest);
    $("console").appendChild(d);
    const c = $("console");
    const stick = c.scrollTop + c.clientHeight >= c.scrollHeight - 30;
    if (stick) c.scrollTop = c.scrollHeight;
  } else {
    pushLine(text, "srv");
  }
}

async function pollStatus() {
  try {
    const s = await api("/status");
    statusOnline = true;
    const running = s.running;
    $("runningDot").className = "dot " + (running ? (s.saving ? "busy" : "on") : "off");
    $("stateLabel").textContent = (running ? "running" : "stopped") + (s.saving ? " (saving)" : "");
    $("genLabel").textContent = "gen " + s.gen;
    $("onlineCount").textContent = (s.online || []).length;
    $("uptimeLabel").textContent = fmtDur(s.uptime_s || 0);
    $("worldSize").textContent = (s.world_size_mb ? s.world_size_mb + " MB" : "–");
    $("lastSave").textContent = s.last_save ? (new Date(s.last_save * 1000)).toLocaleTimeString() : "–";
  } catch (e) {
    statusOnline = false;
    $("runningDot").className = "dot off";
    $("stateLabel").textContent = "offline / unreachable";
  }
}
async function pollConsole() {
  try {
    const r = await api("/console?since=" + lastSeq);
    (r.lines || []).forEach(([n, t]) => { pushServerLine(t); lastSeq = n > lastSeq ? n : lastSeq; });
  } catch (e) { /* ignore */ }
}
function fmtDur(s) {
  if (!s) return "–";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function startPolling() {
  if (pollStatusTimer) clearInterval(pollStatusTimer);
  if (pollConsoleTimer) clearInterval(pollConsoleTimer);
  pollStatusTimer = setInterval(pollStatus, 3000);
  pollConsoleTimer = setInterval(pollConsole, 1500);
  pollStatus(); pollConsole();
}

async function action(kind) {
  try {
    const r = await api("/" + kind, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    if (r.ok === false) { pushLine("⚠ " + (r.error || kind) + " failed", "warn"); }
    else { pushLine("➤ " + kind + ": ok" + (r.already ? " (already running)" : ""), "usr"); }
  } catch (e) {
    pushLine("✖ " + kind + " failed: " + e.message, "err");
  }
  pollStatus();
}
async function sendCommand() {
  const v = $("cmdInput").value;
  if (!v.trim()) return;
  $("cmdInput").value = "";
  pushLine("> " + v, "usr");
  try {
    const r = await api("/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: v }) });
    if (r.ok === false) pushLine("⚠ " + (r.error || "not sent"), "warn");
  } catch (e) { pushLine("✖ command failed: " + e.message, "err"); }
}

function openModal() { $("settingsModal").classList.remove("hidden"); }
function closeModal() { $("settingsModal").classList.add("hidden"); }

window.addEventListener("DOMContentLoaded", () => {
  loadCfg();
  $("settingsBtn").onclick = openModal;
  $("closeCfg").onclick = closeModal;
  $("saveCfg").onclick = saveCfg;
  $("startBtn").onclick = () => action("start");
  $("restartBtn").onclick = () => action("restart");
  $("stopBtn").onclick = () => action("stop");
  $("sendBtn").onclick = sendCommand;
  $("cmdInput").addEventListener("keydown", (e) => { if (e.key === "Enter") sendCommand(); });
  startPolling();
  updateStateLabel();
});
function updateStateLabel() {
  if (!cfg.url) $("stateLabel").textContent = "set up in ⚙ settings";
}
