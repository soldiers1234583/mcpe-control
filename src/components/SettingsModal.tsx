import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ServerConfig } from "@/hooks/useServer";

interface Props {
  open: boolean;
  cfg: ServerConfig;
  onClose: () => void;
  onSave: (next: Partial<ServerConfig>) => void;
}

export function SettingsModal({ open, cfg, onClose, onSave }: Props) {
  const [url, setUrl] = useState(cfg.url);
  const [token, setToken] = useState(cfg.token);
  const [gameAddr, setGameAddr] = useState(cfg.gameAddr);
  const [setup, setSetup] = useState(cfg.setup);

  useEffect(() => {
    if (open) {
      setUrl(cfg.url);
      setToken(cfg.token);
      setGameAddr(cfg.gameAddr);
      setSetup(cfg.setup);
    }
  }, [open, cfg]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 text-lg font-semibold text-neutral-100">Settings</h2>

            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
              Control URL (https)
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value.trim().replace(/\/+$/, ""))}
              placeholder="https://xxxx.trycloudflare.com"
              className="mb-3 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 outline-none focus:border-sky-500/60"
            />

            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
              Auth token
            </label>
            <input
              value={token}
              onChange={(e) => setToken(e.target.value.trim())}
              className="mb-3 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-neutral-100 outline-none focus:border-sky-500/60"
            />

            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
              Game address (host:port)
            </label>
            <input
              value={gameAddr}
              onChange={(e) => setGameAddr(e.target.value.trim())}
              placeholder="xxxx.playit.gg:19132"
              className="mb-3 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 font-mono text-sm text-neutral-100 outline-none focus:border-sky-500/60"
            />

            <label className="mb-1 block text-xs uppercase tracking-wider text-neutral-500">
              Setup commands (one per line)
            </label>
            <textarea
              value={setup}
              onChange={(e) => setSetup(e.target.value)}
              rows={6}
              className="mb-4 w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 font-mono text-xs text-neutral-100 outline-none focus:border-sky-500/60"
            />

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  onSave({ url, token, gameAddr, setup });
                  onClose();
                }}
                className="flex-1 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 hover:bg-emerald-400"
              >
                Save
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-red-500/90 px-4 py-2.5 text-sm font-semibold text-white transition active:scale-95 hover:bg-red-500"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
