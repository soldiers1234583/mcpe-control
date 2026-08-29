import { BentoGrid } from "@/components/ui/bento-grid";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import { cn } from "@/lib/utils";
import { fmtDur, type ServerStatus } from "@/hooks/useServer";

interface Props {
  status: ServerStatus | null;
  online: boolean;
}

function Stat({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <CardSpotlight
      radius={220}
      color="#1f2937"
      className={cn(
        "rounded-xl border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur",
        className
      )}
    >
      <div className="relative z-10 flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
          {title}
        </span>
        <div className="text-lg font-semibold text-neutral-100">{children}</div>
      </div>
    </CardSpotlight>
  );
}

export function StatusBento({ status, online }: Props) {
  const running = online && !!status?.running;
  const saving = !!(status as any)?.saving;

  return (
    <BentoGrid className="w-full grid-cols-2 gap-3 auto-rows-auto md:grid-cols-3">
      <CardSpotlight
        radius={260}
        color="#1f2937"
        className="col-span-2 rounded-xl border-neutral-800 bg-neutral-900/60 p-4 backdrop-blur md:col-span-1"
      >
        <div className="relative z-10 flex flex-col gap-1.5">
          <span className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">
            Status
          </span>
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "inline-block h-2.5 w-2.5 rounded-full transition-all",
                running
                  ? "bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.7)]"
                  : online
                  ? "bg-red-400 shadow-[0_0_12px_2px_rgba(248,113,113,0.7)]"
                  : "bg-neutral-600"
              )}
            />
            <span className="text-lg font-semibold text-neutral-100">
              {!online ? "offline" : running ? (saving ? "saving…" : "running") : "stopped"}
            </span>
          </div>
        </div>
      </CardSpotlight>

      <Stat title="Online">{online ? String(status?.online?.length ?? 0) : "–"}</Stat>
      <Stat title="Uptime">{online ? fmtDur(status?.uptime_s) : "–"}</Stat>
      <Stat title="World">
        {online && status?.world_size_mb ? status.world_size_mb + " MB" : "–"}
      </Stat>
      <Stat title="Last save">
        {online && status?.last_save ? new Date(status.last_save * 1000).toLocaleTimeString() : "–"}
      </Stat>
      <Stat title="Gen">{online && status?.gen != null ? "v" + status.gen : "–"}</Stat>
    </BentoGrid>
  );
}
