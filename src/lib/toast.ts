// Toastify Alert System for Database Operations & UI Feedback
// Floats at page center-top, animates downward, auto-dismisses in 2s with audible beep.

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration: number; // in milliseconds (default 2000ms = 2s)
  createdAt: number;
}

type ToastListener = (toasts: ToastItem[]) => void;

let activeToasts: ToastItem[] = [];
let listeners: Set<ToastListener> = new Set();

/**
 * Synthesizes a crisp, low-latency audio beep using Web Audio API.
 * Zero external audio files required. Safe against browser autoplay restrictions.
 */
export function playToastBeep(type: ToastType = "success") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === "success") {
      // Crisp, pleasant high-tech dual chime (C6 -> G6)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.setValueAtTime(880.00, now + 0.06); // A5

      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(880.00, now);
      osc2.frequency.setValueAtTime(1174.66, now + 0.06); // D6

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.22);
      osc2.stop(now + 0.22);
    } else if (type === "error") {
      // Two-tone warning alert buzzer
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(240, now + 0.09);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === "warning") {
      // Warm attention tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(493.88, now); // B4
      osc.frequency.setValueAtTime(440.00, now + 0.08); // A4

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      // Soft modern ping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(740, now);

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    }
  } catch (_) {
    // Autoplay restrictions or audio disabled - fail gracefully
  }
}

function notify() {
  const current = [...activeToasts];
  listeners.forEach((listener) => listener(current));
}

export function subscribeToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...activeToasts]);
  return () => {
    listeners.delete(listener);
  };
}

export function removeToast(id: string) {
  activeToasts = activeToasts.filter((t) => t.id !== id);
  notify();
}

export function showToast(
  type: ToastType,
  message: string,
  title?: string,
  duration = 2000 // 2 seconds default per user specification
) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  
  const defaultTitle =
    type === "success"
      ? "Operation Successful"
      : type === "error"
      ? "Error Occurred"
      : type === "warning"
      ? "Notice"
      : "Information";

  const newToast: ToastItem = {
    id,
    type,
    title: title || defaultTitle,
    message,
    duration,
    createdAt: Date.now(),
  };

  // Play audio beep
  playToastBeep(type);

  // Keep max 3 toasts at a time to prevent UI clutter
  if (activeToasts.length >= 3) {
    activeToasts = activeToasts.slice(1);
  }

  activeToasts = [...activeToasts, newToast];
  notify();

  // Auto-dismiss after 2 seconds
  setTimeout(() => {
    removeToast(id);
  }, duration);

  return id;
}

// Global Toastify API
export const toast = {
  success: (message: string, title?: string, duration = 2000) =>
    showToast("success", message, title, duration),
  error: (message: string, title?: string, duration = 2500) =>
    showToast("error", message, title, duration),
  warning: (message: string, title?: string, duration = 2200) =>
    showToast("warning", message, title, duration),
  info: (message: string, title?: string, duration = 2000) =>
    showToast("info", message, title, duration),

  // Dedicated DB Operation Helpers
  dbSave: (messageOrItem = "Record", title = "Saved to Database", duration = 2000) => {
    const msg = messageOrItem.includes(" ") ? messageOrItem : `${messageOrItem} has been saved successfully!`;
    return showToast("success", msg, title, duration);
  },
  dbUpdate: (messageOrItem = "Record", title = "Updated Successfully", duration = 2000) => {
    const msg = messageOrItem.includes(" ") ? messageOrItem : `${messageOrItem} has been updated successfully!`;
    return showToast("success", msg, title, duration);
  },
  dbDelete: (messageOrItem = "Record", title = "Record Deleted", duration = 2000) => {
    const msg = messageOrItem.includes(" ") ? messageOrItem : `${messageOrItem} has been removed from database.`;
    return showToast("warning", msg, title, duration);
  },
  dbError: (errorMsg = "Database operation failed. Please try again.", title = "Database Error", duration = 2500) =>
    showToast("error", errorMsg, title, duration),
};
