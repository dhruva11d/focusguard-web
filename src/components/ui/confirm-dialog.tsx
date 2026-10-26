"use client";

/**
 * Ported from lib/design/glass_dialog.dart: a floating glass surface
 * rather than a default browser/OS dialog look, with a soft dark scrim
 * (never opaque black). The confirm action is a plain colored text
 * button, not a solid-colored button — "text + position + semantic
 * color, not color alone."
 */
export function ConfirmDialog({
  open,
  title,
  message,
  cancelLabel,
  confirmLabel,
  destructive = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-8"
      style={{ background: "rgb(10 15 25 / 45%)" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs rounded-lg border border-hairline bg-surface p-6 shadow-[0_24px_48px_rgb(32_36_52_/_25%)]"
      >
        <h2 className="text-[18px] font-medium tracking-[-0.1px]">{title}</h2>
        <p className="mt-2 text-[15px] text-on-background-muted">{message}</p>
        <div className="mt-6 flex justify-end gap-6">
          <button onClick={onCancel} className="text-[15px] font-medium text-on-background-muted">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`text-[15px] font-semibold ${destructive ? "text-violation" : "text-accent"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
