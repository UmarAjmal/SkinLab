import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

let channelsInitialized = false;

/**
 * Initializes Android Notification Channels with High Importance (Heads-up banner + Sound + Vibration)
 */
async function initializeAndroidChannels() {
  if (!Capacitor.isNativePlatform() || channelsInitialized) return;
  try {
    await LocalNotifications.createChannel({
      id: "skinlab_clinic_alerts",
      name: "SkinLab Clinic Realtime Alerts",
      description: "Notifications for Sales, Invoices, Expenses, Closings, and Dues",
      importance: 5, // 5 = MAX / High importance (pops up on screen & makes sound)
      visibility: 1, // 1 = PUBLIC (visible on lockscreen)
      vibration: true,
      lights: true,
      lightColor: "#4F46E5",
    });
    channelsInitialized = true;
  } catch (err) {
    console.warn("Could not create Android notification channel:", err);
  }
}

/**
 * Synthesizes an audible alert tone using Web Audio API for browser/desktop
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
      // Urgent / Warning Two-Tone Alert
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(587.33, now + 0.12); // D5
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "success") {
      // Pleasant Ascending Chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else {
      // Standard Notice Chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.1); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (e) {
    // AudioContext blocked by browser autoplay policy
  }
}

/**
 * Request notification permissions across Capacitor native and Web browsers
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (typeof window === "undefined") return false;

    // 1. Capacitor Native Platform (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      const checkStatus = await LocalNotifications.checkPermissions();
      if (checkStatus.display !== "granted") {
        const reqStatus = await LocalNotifications.requestPermissions();
        if (reqStatus.display === "granted") {
          await initializeAndroidChannels();
          return true;
        }
        return false;
      }
      await initializeAndroidChannels();
      return true;
    }

    // 2. Web Browser Desktop / Mobile Chrome
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
  linkUrl?: string | null;
  extra?: any;
}) {
  try {
    if (typeof window === "undefined") return;

    // 1. Play synthesized audio tone
    const soundType =
      params.severity === "URGENT" || params.severity === "WARNING"
        ? "alert"
        : params.severity === "SUCCESS"
        ? "success"
        : "info";
    playNotificationSound(soundType);

    // 2. If running on Capacitor Native (Android / iOS)
    if (Capacitor.isNativePlatform()) {
      await initializeAndroidChannels();
      const notifId = params.id || Math.floor(Math.random() * 1000000);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notifId,
            title: params.title,
            body: params.body,
            channelId: "skinlab_clinic_alerts",
            schedule: { at: new Date(Date.now() + 50) },
            sound: "default",
            extra: {
              linkUrl: params.linkUrl || null,
              ...params.extra,
            },
          },
        ],
      });
      return;
    }

    // 3. If running on standard Web Browser
    if ("Notification" in window && Notification.permission === "granted") {
      const webNotif = new Notification(params.title, {
        body: params.body,
        icon: "/favicon.ico",
      });

      if (params.linkUrl) {
        webNotif.onclick = () => {
          window.focus();
          window.location.href = params.linkUrl!;
        };
      }
    }
  } catch (e) {
    console.warn("Failed to dispatch native notification:", e);
  }
}

/**
 * Sets up Capacitor notification tap action listeners
 */
export function setupCapacitorNotificationListeners(onNavigate?: (url: string) => void) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    LocalNotifications.addListener("localNotificationActionPerformed", (action) => {
      const linkUrl = action.notification?.extra?.linkUrl;
      if (linkUrl && onNavigate) {
        onNavigate(linkUrl);
      } else if (linkUrl && typeof window !== "undefined") {
        window.location.href = linkUrl;
      }
    });
  } catch (err) {
    console.warn("Failed to register notification action listener:", err);
  }
}
