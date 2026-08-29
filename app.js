/* MCPE Server Control — PWA logic */
const $ = (id) => document.getElementById(id);
let cfg = { url: "", token: "" };
let lastSeq = 0;
let pollStatusTimer = null, pollConsoleTimer = null;
let statusOnline = false;

function saveCfg() {
  cfg.url = $("cfgUrl").value.trim().replace(/\/+$/, "");
  cfg.token = $("cfgToken").value.trim();
  cfg.gameAddr = $("cfgGameAddr").value.trim();
  localStorage.setItem("mcpeCfg", JSON.stringify(cfg));
  localStorage.setItem("mcpeSetup", $("cfgSetup").value);
  closeModal();
  startPolling();
  updateStateLabel();
}
const DEFAULT_TOKEN = "1f0ae74287487b2edacd6e7821312437";
const RELAY_URL = "https://mcpe-worker.soldiers123458.workers.dev";

// Minecraft Bedrock command suggestions: c = text to fill after '/', d = display, h = hint
const COMMANDS = [
  { c: "ability <player> <ability> <value>", d: "ability <player> <ability> <value>", h: "Set a player ability (mayfly, invulnerable, worldbuilder…)" },
  { c: "clear <player> [item] [amount]", d: "clear <player> [item] [amount]", h: "Clear inventory" },
  { c: "clone <from> <to> <dest>", d: "clone <from> <to> <dest>", h: "Copy a region of blocks" },
  { c: "daylock <lock>", d: "daylock <lock>", h: "Lock the day/night cycle (true/false)" },
  { c: "deop <player>", d: "deop <player>", h: "Remove operator" },
  { c: "difficulty <difficulty>", d: "difficulty <difficulty>", h: "peaceful / easy / normal / hard" },
  { c: "effect <player> <effect> [seconds] [amplifier]", d: "effect <player> <effect> [seconds] [amplifier]", h: "Apply a status effect" },
  { c: "enchant <player> <enchantment> [level]", d: "enchant <player> <enchantment> [level]", h: "Enchant an item" },
  { c: "execute <as|at> <target> run <command>", d: "execute <as|at> <target> run <command>", h: "Run a command as/at a target" },
  { c: "fill <from> <to> <block>", d: "fill <from> <to> <block>", h: "Fill a region with a block" },
  { c: "gamemode <mode> [player]", d: "gamemode <mode> [player]", h: "survival / creative / adventure / spectator" },
  { c: "gamerule <rule> [value]", d: "gamerule <rule> [value]", h: "Set a game rule (doDaylightCycle, keepInventory…)" },
  { c: "give <player> <item> [amount]", d: "give <player> <item> [amount]", h: "Give an item" },
  { c: "help [command]", d: "help [command]", h: "Show command help" },
  { c: "kick <player> [reason]", d: "kick <player> [reason]", h: "Kick a player with a reason" },
  { c: "kill <target>", d: "kill <target>", h: "Kill a target (@a, @p, @r, @e…)" },
  { c: "list", d: "list", h: "List online players" },
  { c: "locate <feature>", d: "locate <feature>", h: "Find the nearest structure/feature" },
  { c: "loot <target> <source>", d: "loot <target> <source>", h: "Spawn loot from a chest/entity" },
  { c: "me <action>", d: "me <action>", h: "Broadcast an action as your name" },
  { c: "op <player>", d: "op <player>", h: "Give operator" },
  { c: "playsound <sound> <player>", d: "playsound <sound> <player>", h: "Play a sound" },
  { c: "replaceitem <slot> <item>", d: "replaceitem <slot> <item>", h: "Replace an inventory slot" },
  { c: "save hold", d: "save hold", h: "Hold the world save" },
  { c: "save query", d: "save query", h: "Query the world save status" },
  { c: "save resume", d: "save resume", h: "Resume world saving" },
  { c: "say <message>", d: "say <message>", h: "Broadcast a message" },
  { c: "scoreboard objectives add <name> <criteria>", d: "scoreboard objectives add <name> <criteria>", h: "Add a scoreboard objective" },
  { c: "setblock <pos> <block>", d: "setblock <pos> <block>", h: "Place a block at a position" },
  { c: "setmaxplayers <count>", d: "setmaxplayers <count>", h: "Set the max number of players" },
  { c: "setworldspawn [pos]", d: "setworldspawn [pos]", h: "Set the world spawn point" },
  { c: "spawnpoint <player> [pos]", d: "spawnpoint <player> [pos]", h: "Set a player's spawn point" },
  { c: "stop", d: "stop", h: "Stop the server" },
  { c: "stopsound <player> [sound]", d: "stopsound <player> [sound]", h: "Stop a sound" },
  { c: "summon <entity> [pos]", d: "summon <entity> [pos]", h: "Summon an entity" },
  { c: "tag <target> add|remove|list <tag>", d: "tag <target> add|remove|list <tag>", h: "Manage tags on entities" },
  { c: "teleport <target> <pos>", d: "teleport <target> <pos>", h: "Teleport (tp)" },
  { c: "tp <target> <pos>", d: "tp <target> <pos>", h: "Teleport (alias)" },
  { c: "tell <player> <message>", d: "tell <player> <message>", h: "Private message (msg / w)" },
  { c: "testforblock <pos> <block>", d: "testforblock <pos> <block>", h: "Test if a block is at a position" },
  { c: "time add|set <value>", d: "time add|set <value>", h: "Add/set the world time" },
  { c: "title <player> title|subtitle <text>", d: "title <player> title|subtitle <text>", h: "Show a title to a player" },
  { c: "toggledownfall", d: "toggledownfall", h: "Toggle weather" },
  { c: "weather clear|rain|thunder [duration]", d: "weather clear|rain|thunder [duration]", h: "Set the weather" },
  { c: "whitelist add|remove|list|on|off [player]", d: "whitelist add|remove|list|on|off", h: "Manage the whitelist" },
];

let suggestItems = [];
let suggestSel = -1;

const DEFAULT_SETUP = [
  "say 🔧 Setting up server...",
  "gamerule keepInventory true",
  "gamerule showcoordinates true",
  "gamerule pvp false",
  "gamerule doDaylightCycle true",
  "difficulty normal",
  "weather clear",
  "time set day",
  "setworldspawn",
  "say ✅ Server setup complete (keepInventory, no PvP, coordinates on).",
].join("\n");

function getSetup() { return localStorage.getItem("mcpeSetup") || DEFAULT_SETUP; }

function fillCmd(text) {
  const inp = $("cmdInput");
  const before = inp.value.startsWith("/") && !inp.value.slice(1).includes(" ") ? "/" : "";
  inp.value = before + text;
  hideSuggest();
  inp.focus();
}
function hideSuggest() {
  $("suggest").classList.add("hidden");
  suggestItems = [];
  suggestSel = -1;
}
function renderSuggest() {
  const box = $("suggest");
  if (!suggestItems.length) { hideSuggest(); return; }
  box.innerHTML = "";
  suggestItems.forEach((item, i) => {
    const d = document.createElement("div");
    d.className = "si" + (i === suggestSel ? " sel" : "");
    const c = document.createElement("div"); c.className = "s-cmd"; c.textContent = item.d;
    const h = document.createElement("div"); h.className = "s-hint"; h.innerHTML = item.h.replace(/<[^>]+>/g, m => "<b>" + m + "</b>");
    d.appendChild(c); d.appendChild(h);
    d.onmousedown = (e) => { e.preventDefault(); fillCmd(item.c); };
    d.onclick = () => fillCmd(item.c);
    box.appendChild(d);
  });
  box.classList.remove("hidden");
  const selEl = box.querySelector(".si.sel");
  if (selEl) selEl.scrollIntoView({ block: "nearest" });
}
function updateSuggest() {
  const val = $("cmdInput").value;
  if (!val.startsWith("/")) { hideSuggest(); return; }
  let typed = val.slice(1).trim().toLowerCase();
  // If already has a space, match the leading command name only (so args don't hide base cmd)
  const firstWord = typed.split(" ")[0];
  suggestItems = COMMANDS.filter(s => {
    const cmdName = s.c.toLowerCase().split(" ")[0];
    if (typed.includes(" ")) return cmdName === firstWord;
    return cmdName.startsWith(typed) || s.d.toLowerCase().startsWith(typed);
  });
  suggestSel = suggestItems.length ? 0 : -1;
  renderSuggest();
}
function moveSel(dir) {
  if (!suggestItems.length) return;
  suggestSel = (suggestSel + dir + suggestItems.length) % suggestItems.length;
  renderSuggest();
}
function loadCfg() {
  try { cfg = Object.assign({}, cfg, JSON.parse(localStorage.getItem("mcpeCfg") || "{}")); } catch (e) {}
  if (!cfg.token) cfg.token = DEFAULT_TOKEN;
  $("cfgUrl").value = cfg.url;
  $("cfgToken").value = cfg.token;
  $("cfgSetup").value = getSetup();
  $("cfgGameAddr").value = cfg.gameAddr || "";
}

async function joinServer() {
  const addr = (cfg.gameAddr || "").trim();
  if (!addr) { pushLine("⚠ set Game address (host:port) in ⚙ Settings first", "warn"); return; }
  const name = "Riyans-modded-server";
  // Minecraft Bedrock deep link: minecraft://?addExternalServer=<name>|<host:port>
  const link = "minecraft://?addExternalServer=" + name + "|" + addr;
  pushLine("🔗 " + link, "usr");
  try { await navigator.clipboard.writeText(link); pushLine("📋 link copied — tap to open Minecraft, or paste in chat", "srv"); }
  catch (e) { pushLine("🔗 couldn't auto-copy — long-press the link above", "warn"); }
  try { window.location.href = link; } catch (e) {}
}

// Auto-fetch the latest control URL (and optionally start the notebook) from the relay.
async function bootstrap(doStart) {
  try {
    const res = await fetch(RELAY_URL + "/bootstrap", { cache: "no-store" });
    const b = await res.json();
    if (b.url) {
      cfg.url = b.url;
      $("cfgUrl").value = b.url;
      localStorage.setItem("mcpeCfg", JSON.stringify(cfg));
      pushLine("relay: got control URL " + b.url, "usr");
    } else {
      pushLine("relay: no URL registered yet", "warn");
    }
    if (doStart) {
      const r = await fetch(RELAY_URL + "/start", { method: "POST" });
      const s = await r.json();
      if (s.ok) pushLine("relay: start ok (HTTP " + s.status + ")", "usr");
      else pushLine("relay: start failed — " + (s.error || "HTTP " + s.status), "err");
    }
  } catch (e) {
    pushLine("relay: unreachable — " + e.message, "err");
  }
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
async function execCommand(text) {
  pushLine("> " + text, "usr");
  try {
    const r = await api("/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
    if (r.ok === false) pushLine("⚠ " + (r.error || "not sent"), "warn");
  } catch (e) { pushLine("✖ command failed: " + e.message, "err"); }
}
async function runSetup() {
  const list = getSetup().split("\n").map(s => s.trim()).filter(Boolean);
  if (!list.length) { pushLine("no setup commands defined", "warn"); return; }
  pushLine("🛠 Running setup (" + list.length + " commands)…", "usr");
  for (const cmd of list) {
    await execCommand(cmd);
    await new Promise(r => setTimeout(r, 300));
  }
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
  $("wakeBtn").onclick = () => bootstrap(true);   // start the Kaggle notebook via relay
  $("restartBtn").onclick = () => action("restart");
  $("stopBtn").onclick = () => action("stop");
  $("setupBtn").onclick = runSetup;
  $("joinBtn").onclick = joinServer;
  $("sendBtn").onclick = sendCommand;
  $("cmdInput").addEventListener("input", updateSuggest);
  $("cmdInput").addEventListener("focus", updateSuggest);
  $("cmdInput").addEventListener("blur", () => setTimeout(hideSuggest, 150));
  $("cmdInput").addEventListener("keydown", (e) => {
    const open = !$("suggest").classList.contains("hidden") && suggestItems.length;
    if (open) {
      if (e.key === "ArrowDown") { e.preventDefault(); moveSel(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveSel(-1); }
      else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); if (suggestSel >= 0) fillCmd(suggestItems[suggestSel].c); }
      else if (e.key === "Escape") hideSuggest();
      return;
    }
    if (e.key === "Enter") sendCommand();
  });
  startPolling();
  bootstrap(false);   // auto-fill the control URL from the relay (no auto-start)
  updateStateLabel();
});
function updateStateLabel() {
  if (!cfg.url) $("stateLabel").textContent = "set up in ⚙ settings";
}
