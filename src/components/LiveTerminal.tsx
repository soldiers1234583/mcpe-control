import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { ConsoleLine } from "@/hooks/useServer";

interface Props {
  lines: ConsoleLine[];
  title?: string;
  className?: string;
}

/**
 * Live-streaming terminal with Aceternity-style chrome (traffic lights + titlebar).
 * Unlike the typewriter Terminal, this renders real server output as it arrives.
 */
export function LiveTerminal({ lines, title = "riyans-modded-server — console", className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !stickRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [lines]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/80 shadow-2xl backdrop-blur",
        className
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 bg-neutral-900 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 text-center">
          <span className="truncate font-mono text-xs text-neutral-400">{title}</span>
        </div>
        <div className="w-[52px]" />
      </div>

      {/* Streaming content */}
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          stickRef.current = el.scrollTop + el.clientHeight >= el.scrollHeight - 40;
        }}
        className="h-[42vh] min-h-[220px] overflow-y-auto p-4 font-mono text-[12.5px] leading-relaxed"
      >
        {!lines.length && (
          <div className="text-neutral-600">waiting for server output…</div>
        )}
        {lines.map((l) => (
          <div key={l.seq} className="flex gap-2 whitespace-pre-wrap break-anywhere">
            {l.time && <span className="c-time shrink-0">[{l.time}]</span>}
            <span
              className={cn(
                "break-anywhere",
                l.kind === "usr" && "c-usr",
                l.kind === "warn" && "c-warn",
                l.kind === "err" && "c-err",
                l.kind === "srv" && "c-srv"
              )}
            >
              {l.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
