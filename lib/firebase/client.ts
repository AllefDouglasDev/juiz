import type { Database } from "firebase/database";

// NEXT_PUBLIC_* vars are inlined at build time and must be referenced
// statically — never via dynamic property access.
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const DATABASE_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

export interface FirebaseHandle {
  db: Database;
  api: typeof import("firebase/database");
}

export function isFirebaseConfigured(): boolean {
  return Boolean(API_KEY && PROJECT_ID && DATABASE_URL);
}

let handle: Promise<FirebaseHandle | null> | null = null;

// Lazy + dynamic import so the Firebase chunk is only downloaded once a
// workspace code is actually in use.
export function getFirebase(): Promise<FirebaseHandle | null> {
  if (typeof window === "undefined" || !isFirebaseConfigured()) {
    return Promise.resolve(null);
  }
  handle ??= (async () => {
    const [{ initializeApp, getApps, getApp }, api] = await Promise.all([
      import("firebase/app"),
      import("firebase/database"),
    ]);
    const app = getApps().length
      ? getApp()
      : initializeApp({
          apiKey: API_KEY,
          projectId: PROJECT_ID,
          databaseURL: DATABASE_URL,
        });
    return { db: api.getDatabase(app), api };
  })();
  return handle;
}

// Offset between this device's clock and Firebase's, from
// .info/serverTimeOffset (kept up to date by the sync engine). Defaults to 0
// when offline or not syncing, which degrades to plain Date.now().
let serverTimeOffsetMs = 0;

export function setServerTimeOffset(offsetMs: number): void {
  serverTimeOffsetMs = offsetMs;
}

export function serverNow(): number {
  return Date.now() + serverTimeOffsetMs;
}
