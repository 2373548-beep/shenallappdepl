// Lightweight device fingerprint stored in localStorage.
// Not cryptographically secure, but combined with server-side binding gives
// reasonable "one code = one device" enforcement for typical students.

const KEY = "sheene_device_id";

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(KEY);
  if (!id) {
    const rnd = crypto.getRandomValues(new Uint8Array(16));
    id = Array.from(rnd, (b) => b.toString(16).padStart(2, "0")).join("");
    // Mix in screen + tz to slightly differentiate co-located devices
    const extra = `${screen.width}x${screen.height}-${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
    id = `${id}-${btoa(extra).slice(0, 8)}`;
    localStorage.setItem(KEY, id);
  }
  return id;
}

const TOKEN_KEY = "sheene_session_token";
const REMEMBER_KEY = "sheene_remember";

export const sessionStore = {
  get: () => (typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY)),
  set: (t: string, remember: boolean) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  },
  clear: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  },
  remember: () => (typeof window === "undefined" ? false : localStorage.getItem(REMEMBER_KEY) === "1"),
};
