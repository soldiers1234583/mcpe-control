import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { CommandSuggestion } from "@/data/commands";

interface Props {
  suggestions: (typed: string) => CommandSuggestion[];
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function CommandBar({ suggestions, onSend, disabled }: Props) {
  const [value, setValue] = useState("");
  const [sel, setSel] = useState(-1);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const items = open ? suggestions(value) : [];

  useEffect(() => {
    setSel(items.length ? 0 : -1);
  }, [value, open]);

  function fill(item: CommandSuggestion) {
    const keepSlash = value.startsWith("/") && !value.slice(1).includes(" ") ? "/" : "";
    const next = keepSlash + item.c;
    setValue(next);
    setOpen(false);
    inputRef.current?.focus();
  }

  function submit() {
    const v = value.trim();
    if (!v) return;
    onSend(v);
    setValue("");
    setOpen(false);
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex-1">
        <input
          ref={inputRef}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(e.target.value.startsWith("/"));
          }}
          onFocus={() => setOpen(value.startsWith("/"))}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (items.length) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((s) => (s + 1) % items.length);
                return;
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((s) => (s - 1 + items.length) % items.length);
                return;
              }
              if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                if (sel >= 0) fill(items[sel]);
                return;
              }
              if (e.key === "Escape") {
                setOpen(false);
                return;
              }
            }
            if (e.key === "Enter") submit();
          }}
          placeholder="type / for commands — e.g. /gamemode creative"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full rounded-xl border border-neutral-800 bg-neutral-950/70 px-4 py-3 font-mono text-sm text-neutral-100 outline-none backdrop-blur transition placeholder:text-neutral-600 focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 disabled:opacity-50"
        />

        {items.length > 0 && (
          <div
            ref={boxRef}
            className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-60 overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900/95 shadow-2xl backdrop-blur"
          >
            {items.map((item, i) => (
              <button
                key={item.c}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  fill(item);
                }}
                onClick={() => fill(item)}
                className={cn(
                  "flex w-full flex-col gap-0.5 border-b border-neutral-800/70 px-3 py-2 text-left last:border-0",
                  i === sel ? "bg-neutral-800" : "hover:bg-neutral-800/60"
                )}
              >
                <span className="font-mono text-[13px] text-sky-400">{item.d}</span>
                <span
                  className="text-[11px] text-neutral-500"
                  dangerouslySetInnerHTML={{
                    __html: item.h.replace(/<[^>]+>/g, (m) => `<b class="text-neutral-300">${m}</b>`),
                  }}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={disabled}
        className="shrink-0 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition active:scale-95 hover:bg-sky-400 disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}
