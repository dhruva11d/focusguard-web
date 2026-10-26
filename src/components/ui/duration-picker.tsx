"use client";

import { useState } from "react";

const PRESETS = [15, 25, 45, 60];

/**
 * Ported from lib/design/duration_picker.dart: preset pill chips plus a
 * custom slider. Chip styling approximates the Flutter version's layered
 * glass (a tint wash under a frosted fill) with `color-mix`, since CSS
 * can't stack two independently-blurred translucent layers as cheaply as
 * Flutter's Stack can — close enough for a secondary control.
 */
export function DurationPicker({
  initialMinutes,
  onChange,
}: {
  initialMinutes: number;
  onChange: (minutes: number) => void;
}) {
  const [selected, setSelected] = useState(initialMinutes);
  const [custom, setCustom] = useState(!PRESETS.includes(initialMinutes));
  const displayMinutes = selected <= 0 ? 30 : selected;

  function selectPreset(minutes: number) {
    setCustom(false);
    setSelected(minutes);
    onChange(minutes);
  }

  function selectCustom() {
    setCustom(true);
    onChange(displayMinutes);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((minutes) => (
          <Chip
            key={minutes}
            selected={!custom && selected === minutes}
            onClick={() => selectPreset(minutes)}
          >
            {minutes} min
          </Chip>
        ))}
        <Chip selected={custom} onClick={selectCustom}>
          Custom
        </Chip>
      </div>
      {custom && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-[26px] font-semibold tracking-[-0.2px]">
            {displayMinutes} min
          </p>
          <input
            type="range"
            min={1}
            max={180}
            value={displayMinutes}
            onChange={(e) => {
              const minutes = Number(e.target.value);
              setSelected(minutes);
              onChange(minutes);
            }}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>
      )}
    </div>
  );
}

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full px-4 py-2.5 text-[15px] text-on-background backdrop-blur-[var(--glass-blur)]"
      style={{
        background: selected
          ? "color-mix(in srgb, var(--color-accent) 35%, var(--glass-fill))"
          : "color-mix(in srgb, var(--color-on-background-muted) 12%, var(--glass-fill))",
        boxShadow: "0 2px 8px rgb(53 65 90 / 8%)",
      }}
    >
      {children}
    </button>
  );
}
