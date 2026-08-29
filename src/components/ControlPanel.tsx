import { useState } from "react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/tailwindcss-buttons";
import { LiveTerminal } from "@/components/LiveTerminal";
import { StatusBento } from "@/components/StatusBento";
import { CommandBar } from "@/components/CommandBar";
import { SettingsModal } from "@/components/SettingsModal";
import { useServer } from "@/hooks/useServer";
import { cn } from "@/lib/utils";

export function ControlPanel() {
  const {
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
  } = useServer();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const running = online && !!status?.running;
  const saving = !!(status as any)?.saving;

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Aceternity background beams */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <BackgroundBeams />
      </div>

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col gap-5 px-4 pb-16 pt-6">
        {/* Header with Spotlight beam */}
        <section className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/50 px-4 py-10 backdrop-blur-sm">
          <Spotlight className="-top-40 left-0 md:-left-32 md:-top-20" fill="#38bdf8" />
          <div className="relative z-10 flex flex-col items-center gap-3">
            <button
              onClick={() => setSettingsOpen(true)}
              className="rounded-lg border border-neutral-700 bg-neutral-900/70 px-3 py-1.5 text-sm text-neutral-300 backdrop-blur transition hover:border-sky-500/50 hover:text-white"
            >
              ⚙ Settings
            </button>
            <h1 className="bg-gradient-to-br from-slate-100 via-neutral-200 to-neutral-500 bg-clip-text text-center text-3xl font-extrabold tracking-tight text-transparent md:text-5xl">
              Riyans-modded-server
            </h1>
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.3em] text-neutral-500">
              minecraft bedrock · control panel
            </p>
          </div>
        </section>

        {/* Status widgets */}
        <StatusBento status={status} online={online} />

        {/* Primary actions — Aceternity shimmer buttons */}
        <div className="grid grid-cols-3 gap-2.5">
          <ShimmerButton
            onClick={() => action("start")}
            style={{ backgroundImage: "linear-gradient(110deg,#065f46,45%,#34d399,55%,#065f46)" }}
            className="h-auto w-full rounded-xl px-2 py-3 text-sm text-white"
          >
            ▶ Start
          </ShimmerButton>
          <ShimmerButton
            onClick={() => action("restart")}
            style={{ backgroundImage: "linear-gradient(110deg,#1e3a8a,45%,#60a5fa,55%,#1e3a8a)" }}
            className="h-auto w-full rounded-xl px-2 py-3 text-sm text-white"
          >
            ↻ Restart
          </ShimmerButton>
          <ShimmerButton
            onClick={() => action("stop")}
            style={{ backgroundImage: "linear-gradient(110deg,#7f1d1d,45%,#f87171,55%,#7f1d1d)" }}
            className="h-auto w-full rounded-xl px-2 py-3 text-sm text-white"
          >
            ■ Stop
          </ShimmerButton>
        </div>

        {/* Secondary actions */}
        <div className="grid grid-cols-3 gap-2.5">
          <RelayButton onClick={() => bootstrap(true)} label="☕ Start server" className="bg-violet-600/90 hover:bg-violet-500" />
          <RelayButton onClick={() => runSetup()} label="🛠 Setup" className="bg-purple-600/90 hover:bg-purple-500" />
          <RelayButton onClick={() => joinServer()} label="🔗 Join" className="bg-orange-600/90 hover:bg-orange-500" />
        </div>

        {/* Console */}
        <LiveTerminal lines={lines} />

        {/* Command bar */}
        <CommandBar
          suggestions={suggestions}
          onSend={(text) => execCommand(text)}
          disabled={!online}
        />

        <p className="text-center text-[11px] text-neutral-600">
          {running
            ? "server is live — commands go straight to the bedrock console"
            : online
            ? "server stopped — press Start"
            : "control server unreachable — the notebook may be down"}
        </p>
      </div>

      <SettingsModal
        open={settingsOpen}
        cfg={cfg}
        onClose={() => setSettingsOpen(false)}
        onSave={(next) => {
          saveCfg(next);
          pushLine("settings saved", "srv");
        }}
      />
    </div>
  );
}

function RelayButton({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl px-2 py-3 text-sm font-semibold text-white shadow-lg transition active:scale-95",
        className
      )}
    >
      {label}
    </button>
  );
}
