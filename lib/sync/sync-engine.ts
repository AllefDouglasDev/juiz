// Mirrors registered localStorage keys to /workspaces/$code in Firebase RTDB.
// Local-first: the UI always reads/writes localStorage; when a workspace code
// is active this engine publishes local writes and applies remote changes.
// While offline, the Firebase SDK queues writes in memory and drains them on
// reconnect — no custom queue needed.

import {
  getFirebase,
  setServerTimeOffset,
  type FirebaseHandle,
} from "@/lib/firebase/client";
import {
  getStoredValue,
  registerPublisher,
  removeStoredValue,
  setStoredValue,
} from "@/lib/storage/local-store";
import type { MatchScore, MatchState, Player } from "@/lib/types";
import {
  matchToRemote,
  playersToRecord,
  playerToRemote,
  recordToPlayers,
  remoteToMatch,
  remoteToScore,
  scoreToRemote,
} from "./mappers";

export type SyncStatus = "no-code" | "connecting" | "connected" | "offline";

interface SyncedNode {
  localKey: string;
  remoteChild: string;
  // Raw RTDB value (null = absent) → app value.
  deserialize: (raw: unknown) => unknown;
  // App value → RTDB value (null = remove the node).
  serialize: (value: unknown) => unknown;
  // Custom publisher; the default does a full set/remove of the node.
  publish?: (
    handle: FirebaseHandle,
    code: string,
    prev: unknown,
    next: unknown
  ) => void;
}

const passthrough = (value: unknown) => value ?? null;

const NODES: SyncedNode[] = [
  {
    localKey: "juiz:players",
    remoteChild: "players",
    deserialize: recordToPlayers,
    serialize: (value) => {
      const players = value as Player[] | null;
      return players && players.length > 0 ? playersToRecord(players) : null;
    },
    publish: publishPlayersDiff,
  },
  {
    localKey: "juiz:draw:settings",
    remoteChild: "drawSettings",
    deserialize: passthrough,
    serialize: passthrough,
  },
  {
    localKey: "juiz:draw:result",
    remoteChild: "drawResult",
    deserialize: passthrough,
    serialize: passthrough,
  },
  {
    localKey: "juiz:match",
    remoteChild: "match",
    deserialize: remoteToMatch,
    serialize: (value) =>
      value ? matchToRemote(value as MatchState) : null,
  },
  {
    localKey: "juiz:score",
    remoteChild: "score",
    deserialize: remoteToScore,
    serialize: (value) =>
      value ? scoreToRemote(value as MatchScore) : null,
  },
];

const nodesByKey = new Map(NODES.map((node) => [node.localKey, node]));

interface SyncSession {
  code: string;
  unsubs: Array<() => void>;
  // Last value seen per key (local or remote) — the diff base for players.
  lastKnown: Map<string, unknown>;
  bootstrapped: boolean;
  bootstrapping: boolean;
  stopped: boolean;
}

let session: SyncSession | null = null;

let status: SyncStatus = "no-code";
const statusListeners = new Set<() => void>();

function setStatus(next: SyncStatus) {
  if (status === next) return;
  status = next;
  statusListeners.forEach((listener) => listener());
}

export function getSyncStatus(): SyncStatus {
  return status;
}

export function subscribeSyncStatus(listener: () => void): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

function logSyncError(error: unknown) {
  console.warn("[sync] Firebase write failed", error);
}

// JSON with sorted keys, so a value round-tripped through Firebase compares
// equal to the local one regardless of property order. This is the echo
// suppression: onValue fires for our own writes with the same value.
function stableStringify(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortDeep);
  }
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortDeep((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

function nodePath(code: string, node: SyncedNode): string {
  return `workspaces/${code}/${node.remoteChild}`;
}

export async function startSync(code: string): Promise<void> {
  stopSync();
  const s: SyncSession = {
    code,
    unsubs: [],
    lastKnown: new Map(),
    bootstrapped: false,
    bootstrapping: false,
    stopped: false,
  };
  session = s;
  setStatus("connecting");

  const handle = await getFirebase();
  if (!handle) {
    // Env vars missing — behave exactly like "no workspace".
    if (session === s) {
      session = null;
      setStatus("no-code");
    }
    return;
  }
  if (s.stopped) return;

  const { api, db } = handle;

  s.unsubs.push(
    api.onValue(api.ref(db, ".info/serverTimeOffset"), (snap) => {
      const offset = snap.val();
      setServerTimeOffset(typeof offset === "number" ? offset : 0);
    })
  );

  s.unsubs.push(
    api.onValue(api.ref(db, ".info/connected"), (snap) => {
      const online = snap.val() === true;
      if (online) {
        if (s.bootstrapped) {
          setStatus("connected");
        } else {
          void bootstrap(handle, s);
        }
      } else if (s.bootstrapped) {
        setStatus("offline");
      }
    })
  );

  void bootstrap(handle, s);
}

export function stopSync(): void {
  const s = session;
  if (!s) return;
  s.stopped = true;
  s.unsubs.forEach((unsub) => unsub());
  session = null;
  setServerTimeOffset(0);
  setStatus("no-code");
}

// First contact with the workspace: nodes missing remotely are seeded with
// this device's local data (first phone creates the group); nodes that exist
// remotely win over local (joining a code means adopting the group's data).
// Listeners are only attached afterwards, so a fresh join can't wipe local
// data with an "absent" remote read.
async function bootstrap(handle: FirebaseHandle, s: SyncSession): Promise<void> {
  if (s.stopped || s.bootstrapped || s.bootstrapping) return;
  s.bootstrapping = true;
  try {
    const snapshot = await handle.api.get(
      handle.api.ref(handle.db, `workspaces/${s.code}`)
    );
    if (s.stopped) return;

    for (const node of NODES) {
      const raw: unknown = snapshot.child(node.remoteChild).val();
      const local = getStoredValue<unknown>(node.localKey, null);
      if (raw !== null) {
        const value = node.deserialize(raw);
        s.lastKnown.set(node.localKey, value);
        if (stableStringify(value) !== stableStringify(local)) {
          applyRemote(node.localKey, value);
        }
      } else {
        s.lastKnown.set(node.localKey, local);
        const serialized = local === null ? null : node.serialize(local);
        if (serialized !== null) {
          void handle.api
            .set(handle.api.ref(handle.db, nodePath(s.code, node)), serialized)
            .catch(logSyncError);
        }
      }
    }

    attachNodeListeners(handle, s);
    s.bootstrapped = true;
    setStatus("connected");
  } catch {
    // get() needs the server, so this is "offline at start" — the
    // .info/connected listener retries the bootstrap when we reconnect.
  } finally {
    s.bootstrapping = false;
  }
}

function attachNodeListeners(handle: FirebaseHandle, s: SyncSession) {
  for (const node of NODES) {
    s.unsubs.push(
      handle.api.onValue(
        handle.api.ref(handle.db, nodePath(s.code, node)),
        (snap) => {
          const value = node.deserialize(snap.val());
          s.lastKnown.set(node.localKey, value);
          const local = getStoredValue<unknown>(node.localKey, null);
          if (stableStringify(value) === stableStringify(local)) return;
          applyRemote(node.localKey, value);
        }
      )
    );
  }
}

function applyRemote(localKey: string, value: unknown) {
  if (value === null) {
    removeStoredValue(localKey, { source: "remote" });
  } else {
    setStoredValue(localKey, value, { source: "remote" });
  }
}

// Local writes flow in here (registered below). Firebase write promises only
// resolve after a server ack — which never arrives while offline — so they
// are deliberately not awaited; the SDK's in-memory queue preserves order.
let publishQueue: Promise<void> = Promise.resolve();

registerPublisher((key, value) => {
  const s = session;
  if (!s) return;
  const node = nodesByKey.get(key);
  if (!node) return;
  publishQueue = publishQueue
    .then(() => publishNode(node, value, s))
    .catch(logSyncError);
});

async function publishNode(
  node: SyncedNode,
  value: unknown,
  s: SyncSession
): Promise<void> {
  if (s.stopped || session !== s) return;
  const handle = await getFirebase();
  if (!handle || s.stopped || session !== s) return;

  const prev = s.lastKnown.get(node.localKey) ?? null;
  s.lastKnown.set(node.localKey, value);

  if (node.publish) {
    node.publish(handle, s.code, prev, value);
    return;
  }

  const nodeRef = handle.api.ref(handle.db, nodePath(s.code, node));
  const serialized = value === null ? null : node.serialize(value);
  if (serialized === null) {
    void handle.api.remove(nodeRef).catch(logSyncError);
  } else {
    void handle.api.set(nodeRef, serialized).catch(logSyncError);
  }
}

// One multi-path update with only what changed, so two phones editing
// different players at the same time never overwrite each other.
function publishPlayersDiff(
  handle: FirebaseHandle,
  code: string,
  prevValue: unknown,
  nextValue: unknown
) {
  const prev = (prevValue as Player[] | null) ?? [];
  const next = (nextValue as Player[] | null) ?? [];
  const updates: Record<string, unknown> = {};

  const prevById = new Map(prev.map((player) => [player.id, player]));
  for (const player of next) {
    const before = prevById.get(player.id);
    prevById.delete(player.id);
    if (!before || stableStringify(before) !== stableStringify(player)) {
      updates[player.id] = playerToRemote(player);
    }
  }
  for (const id of prevById.keys()) {
    updates[id] = null;
  }

  if (Object.keys(updates).length === 0) return;
  void handle.api
    .update(handle.api.ref(handle.db, `workspaces/${code}/players`), updates)
    .catch(logSyncError);
}
