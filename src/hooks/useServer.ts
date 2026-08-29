import { useCallback, useEffect, useRef, useState } from "react";
import { COMMANDS } from "@/data/commands";
import { DEFAULT_SETUP } from "@/data/setup";

const DEFAULT_TOKEN = "1f0ae74287487b2edacd6e7821312437";
const RELAY_URL = "https://mcpe-worker.soldiers123458.workers.dev";
const DEFAULT_GAME_ADDR = "147.185.221.231:34812";
const GAME_NAME = "Riyans-modded-server";

export type LineKind = "srv" | "usr" | "warn" | "err" | "time";

export interface ConsoleLine {
  seq: number;
  time?: string;
  text: string;
  kind: LineKind;
}

export interface ServerConfig {
  url: string;
  token: string;
  gameAddr: string;
  setup: string;
}

export interface ServerStatus {
  running: boolean;
  desired?: string;
  gen?: number;
  online?: string[];
  last_save?: number;
  uptime_s?: number;
  world_size_mb?: number;
  control_url?: string;
}

const CFG_KEY = "mcpeCfg";
const SETUP_KEY = "mcpeSetup";

function loadCfg(): ServerConfig {
  let base: Partial<ServerConfig> = {};
  try {
    base = JSON.parse(localStorage.getItem(CFG_KEY) || "{}");
  } catch {
    /* ignore */
  }
  return {
    url: base.url || "",
    token: base.token || DEFAULT_TOKEN,
    gameAddr: base.gameAddr || DEFAULT_GAME_ADDR,
    setup: localStorage.getItem(SETUP_KEY) || DEFAULT_SETUP,
  };
}

export function fmtDur(s?: number) {
  if (!s) return "–";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function classifyServerLine(text: string): LineKind {
  if (/ERROR/i.test(text)) return "err";
  if (/WARN/i.test(text)) return "warn";
  return "srv";
}

export function useServer() {
  const [cfg, setCfgState] = useState<ServerConfig>(() => loadCfg());
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [online, setOnline] = useState(false);
  const [lines, setLines] = useState<ConsoleLine[]>([]);
  const lastSeq = useRef(0);
  const seqCounter = useRef(0);
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const saveCfg = useCallback((next: Partial<ServerConfig>) => {
    setCfgState((prev) => {
      const merged = { ...prev, ...next };
      localStorage.setItem(CFG_KEY, JSON.stringify({ url: merged.url, token: merged.token, gameAddr: merged.gameAddr }));
      localStorage.setItem(SETUP_KEY, merged.setup);
      return merged;
    });
  }, []);

  const pushLine = useCallback((text: string, kind: LineKind = "usr") => {
    seqCounter.current += 1;
    const line: ConsoleLine = { seq: seqCounter.current, text, kind };
    setLines((prev) => [...prev.slice(-400), line]);
  }, []);

  const api = useCallback(
    async (path: string, opts: RequestInit = {}): Promise<any> => {
      if (!cfgRef.current.url) throw new Error("no control url");
      const headers: Record<string, string> = {
        "X-Auth-Token": cfgRef.current.token,
        ...(opts.headers as Record<string, string> | undefined),
      };
      if (opts.body) headers["Content-Type"] = "application/json";
      const res = await fetch(cfgRef.current.url + path, { ...opts, headers, cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    },
    []
  );

  // relay bootstrap: fetch latest control url, optionally start notebook
  const bootstrap = useCallback(
    async (doStart = false) => {
      try {
        const res = await fetch(RELAY_URL + "/bootstrap", { cache: "no-store" });
        const b = await res.json();
        if (b.url) {
          if (b.url !== cfgRef.current.url) {
            saveCfg({ url: b.url });
            pushLine("relay: control URL → " + b.url, "usr");
          } else {
            pushLine("relay: URL already up to date", "srv");
          }
        } else {
          pushLine("relay: no URL registered yet", "warn");
        }
        if (doStart) {
          const r = await fetch(RELAY_URL + "/start", { method: "POST" });
          const s = await r.json();
          if (s.ok) pushLine("relay: start ok (HTTP " + s.status + ")", "usr");
          else pushLine("relay: start failed — " + (s.error || "HTTP " + s.status), "err");
        }
      } catch (e: any) {
        pushLine("relay: unreachable — " + (e?.message || e), "err");
      }
    },
    [saveCfg, pushLine]
  );

  const pollStatus = useCallback(async () => {
    try {
      const s: ServerStatus = await api("/status");
      setStatus(s);
      setOnline(true);
    } catch {
      setOnline(false);
      setStatus(null);
    }
  }, [api]);

  const pollConsole = useCallback(async () => {
    try {
      const r = await api("/console?since=" + lastSeq.current);
      for (const [n, t] of r.lines || []) {
        lastSeq.current = n > lastSeq.current ? n : lastSeq.current;
        seqCounter.current += 1;
        const text = String(t);
        const m = text.match(/^\[(.*?)\] (.*)$/);
        const line: ConsoleLine = m
          ? { seq: seqCounter.current, time: m[1], text: m[2], kind: classifyServerLine(m[2]) }
          : { seq: seqCounter.current, text, kind: "srv" };
        setLines((prev) => [...prev.slice(-400), line]);
      }
    } catch {
      /* ignore */
    }
  }, [api]);

  // polling loops
  useEffect(() => {
    if (!cfg.url) return;
    pollStatus();
    pollConsole();
    const a = setInterval(pollStatus, 3000);
    const b = setInterval(pollConsole, 1500);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [cfg.url, pollStatus, pollConsole]);

  // initial relay bootstrap
  useEffect(() => {
    bootstrap(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const action = useCallback(
    async (kind: "start" | "stop" | "restart") => {
      pushLine("➤ " + kind + "…", "usr");
      try {
        const r = await api("/" + kind, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
        if (r.ok === false) pushLine("⚠ " + (r.error || kind + " failed"), "warn");
        else pushLine("➤ " + kind + ": ok" + (r.already ? " (already running)" : ""), "usr");
      } catch (e: any) {
        pushLine("✖ " + kind + " failed: " + (e?.message || e), "err");
      }
      pollStatus();
    },
    [api, pushLine, pollStatus]
  );

  const execCommand = useCallback(
    async (text: string, echo = true) => {
      if (echo) pushLine("> " + text, "usr");
      try {
        const r = await api("/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) });
        if (r.ok === false) pushLine("⚠ " + (r.error || "not sent"), "warn");
      } catch (e: any) {
        pushLine("✖ command failed: " + (e?.message || e), "err");
      }
    },
    [api, pushLine]
  );

  const runSetup = useCallback(async () => {
    const list = cfgRef.current.setup.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!list.length) {
      pushLine("no setup commands defined", "warn");
      return;
    }
    pushLine("🛠 Running setup (" + list.length + " commands)…", "usr");
    for (const cmd of list) {
      await execCommand(cmd, false);
      await new Promise((r) => setTimeout(r, 300));
    }
  }, [execCommand, pushLine]);

  const joinServer = useCallback(async () => {
    const addr = (cfgRef.current.gameAddr || "").trim();
    if (!addr) {
      pushLine("⚠ set Game address (host:port) in Settings first", "warn");
      return;
    }
    const link = "minecraft://?addExternalServer=" + GAME_NAME + "|" + addr;
    pushLine("🔗 " + link, "usr");
    try {
      await navigator.clipboard.writeText(link);
      pushLine("📋 link copied — tap to open Minecraft, or paste in chat", "srv");
    } catch {
      pushLine("🔗 couldn't auto-copy — long-press the link above", "warn");
    }
    try {
      window.location.href = link;
    } catch {
      /* ignore */
    }
  }, [pushLine]);

  const suggestions = (typed: string) => {
    const v = typed.toLowerCase();
    if (!v.startsWith("/")) return [];
    const after = v.slice(1).trim();
    const firstWord = after.split(" ")[0];
    return COMMANDS.filter((s) => {
      const cmdName = s.c.toLowerCase().split(" ")[0];
      if (after.includes(" ")) return cmdName === firstWord;
      return cmdName.startsWith(after) || s.d.toLowerCase().startsWith(after);
    });
  };

  return {
    cfg,
    saveCfg,
    status,
    online,
    lines,
    pushLine,
    action,
    execCommand,
    runSetup,
    joinServer,
    bootstrap,
    suggestions,
    RELAY_URL,
  };
}
