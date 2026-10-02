import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

/**
 * Synthesizes a pleasant audio chime using Web Audio API
 */
export function playNotificationSound(type: "success" | "warning" | "alert" | "info" = "info") {
  try {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === "alert" || type === "warning") {
      // Two-tone warning beep
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(587.33, now + 0.12); // D5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      // Pleasant high chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch (e) {
    // AudioContext autoplay restrictions or disabled
  }
}

/**
 * Request notification permissions across Capacitor native and Web browsers
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;

    // 1. Capacitor Native Check
    if (Capacitor.isNativePlatform()) {
      const permStatus = await LocalNotifications.requestPermissions();
      return permStatus.display === "granted";
    }

    // 2. Web Browser Notification Check
    if ("Notification" in window) {
      if (Notification.permission === "granted") return true;
      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
    }
    return false;
  } catch (e) {
    console.warn("Could not request notification permissions:", e);
    return false;
  }
}

/**
 * Triggers a native Capacitor or Web Browser notification
 */
export async function sendNativeNotification(params: {
  title: string;
  body: string;
  id?: number;
  severity?: "INFO" | "WARNING" | "URGENT" | "SUCCESS";
  extra?: any;
}) {
  try {
    if (typeof window === "undefined") return;

    // Play pleasant audio chime
    const soundType =
      params.severity === "URGENT" || params.severity === "WARNING"
        ? "alert"
        : params.severity === "SUCCESS"
        ? "success"
        : "info";
    playNotificationSound(soundType);

    // 1. If running on Capacitor Native (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      const notifId = params.id || Math.floor(Math.random() * 100000);
      await LocalNotifications.schedule({
        notifications: [
          {
            title: params.title,
            body: params.body,
            id: notifId,
            schedule: { at: new Date(Date.now() + 100) },
            extra: params.extra || null,
          },
        ],
      });
      return;
    }

    // 2. If running on standard Web Browser
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(params.title, {
        body: params.body,
        icon: "/favicon.ico",
      });
    }
  } catch (e) {
    console.warn("Failed to dispatch native notification:", e);
  }
}
