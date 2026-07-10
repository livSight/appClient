# Conversation Read State — Implementation Guide

How to implement unread message tracking in a React Native / Expo app where users exchange messages with an operator (agency, support, etc.). This document covers everything needed to reproduce the system in any app.

---

## Overview

The system tracks whether each conversation has unread messages using two complementary layers:

| Layer | Source | Persists across restarts? | Role |
|---|---|---|---|
| **Local read store** | Device (SecureStore + memory cache) | Yes | Primary — instant, no network needed |
| **Server flag** (`isMessageRead`) | Backend API | Yes | Fallback when local cache is empty |

The server does **not** return a numeric unread count. It only exposes a boolean `isMessageRead` on the ticket object. Everything else — count, per-conversation state, tab badge — is computed client-side.

---

## Architecture

```
app/_layout.tsx
└── <UnreadCountProvider>          ← context at root, drives tab badge
    └── Navigator
        ├── Conversation List      ← useDriverConversations hook
        │     reads localReadAt + server ticket for each conversation
        │     calls setTotalUnread after every load
        │
        └── Chat Screen            ← sets localReadAt BEFORE any fetch
              calls markTicketRead on server (non-blocking)
```

---

## API Contract

The backend ticket object must expose **at minimum**:

```ts
type Ticket = {
  id: number;
  isMessageRead: boolean;   // true = driver has read, false = unread
  createdAt: string;        // ISO timestamp
  lastUpdatedAt: string;
  // ...other fields
};

type Message = {
  id: number;
  content: string;
  senderId: number;         // compared to currentUserId to detect direction
  createdAt: string;        // ISO timestamp — may or may not include timezone offset
  ticketId: number;
};
```

**Important:** The API does **not** need to return a `unreadCount` field. The count is derived client-side from the full message list. The system requires access to **all messages in the thread**, not just the latest one.

---

## Layer 1 — Local Read Store

**File:** `lib/api/localReadStore.ts`

Stores the UTC timestamp of when the user last opened each conversation. Uses a module-level `Map` as the primary store (synchronous reads) backed by `expo-secure-store` for persistence across restarts.

```ts
import * as SecureStore from "expo-secure-store";

const KEY_PREFIX = "myapp_cr_";

// Module-level — lives for the entire app session, shared across all components.
const cache = new Map<string, string>();

/** Synchronous read. Returns null if never opened. */
export function getLocalReadAt(conversationId: string | number): string | null {
  return cache.get(String(conversationId)) ?? null;
}

/**
 * Call synchronously when the chat screen opens, BEFORE any API call.
 * Writes to cache instantly; persists to SecureStore in the background.
 */
export function setLocalReadAt(conversationId: string | number): void {
  const k = String(conversationId);
  const ts = new Date().toISOString(); // always UTC
  cache.set(k, ts);
  SecureStore.setItemAsync(`${KEY_PREFIX}${k}`, ts).catch(() => {});
}

/**
 * Call once per list load to warm the cache from storage.
 * Skips keys already in cache — never overwrites a timestamp set during
 * the current session (setLocalReadAt always wins over SecureStore).
 */
export async function hydrateLocalReadStore(ids: (string | number)[]): Promise<void> {
  await Promise.all(
    ids.map(async (id) => {
      const k = String(id);
      if (cache.has(k)) return;
      try {
        const stored = await SecureStore.getItemAsync(`${KEY_PREFIX}${k}`);
        if (stored) cache.set(k, stored);
      } catch {}
    }),
  );
}
```

**Key decisions:**
- The `Map` is module-level → reads are synchronous, no `await` when computing unread state.
- `hydrateLocalReadStore` skips keys already in cache → a `setLocalReadAt` call made earlier in the same session is never overwritten by stale SecureStore data.
- SecureStore writes are fire-and-forget → the cache is always ahead of storage.

---

## Layer 2 — Server Flag (`isMessageRead`)

`isMessageRead` is a boolean on the ticket. It is used **only as a fallback** when `localReadAt` is absent (e.g. fresh install, cache cleared after app restart before the user opens any conversation).

**Do not use `isMessageRead` as the primary unread signal.** The server may not reset it to `false` when the other party sends a new message, so relying on it alone causes new messages to be silently missed after the first open.

**When to call `markTicketRead`:** at the start of the thread load function, before fetching messages. Errors are swallowed — the local store handles the fallback.

```ts
async function loadThread(transactionId: number) {
  const ticket = await getTicketForTransaction(transactionId);

  if (ticket && !ticket.isMessageRead) {
    try {
      await markTicketRead(ticket.id);
    } catch {
      // non-blocking — localReadAt covers this case
    }
  }

  const messages = ticket ? await getMessages(ticket.id) : [];
  return { ticket, messages };
}
```

---

## Layer 3 — Unread Count Computation

**File:** `lib/api/conversationUi.ts`

This function receives the **full message list** (all messages in the thread) and produces `isUnread` + `unreadCount`. It is called once per conversation per list load.

```ts
function computeUnreadState(
  messages: Message[],
  currentUserId: number,
  ticket: Ticket,
  localReadAt: string | null,
): { isUnread: boolean; unreadCount: number } {

  // Step 1 — isolate messages from the other party, starting from the
  // user's last reply. This avoids counting messages the user already
  // exchanged before their last reply.
  const lastUserMsg = [...messages].reverse().find((m) => m.senderId === currentUserId);
  const cutoff = lastUserMsg?.createdAt ?? null;
  const incomingAfterReply = messages.filter(
    (m) => m.senderId !== currentUserId && (!cutoff || m.createdAt > cutoff),
  );

  // Step 2 — filter to messages that arrived after the user last opened
  // the chat. Use Date.getTime() — NEVER compare ISO strings directly.
  // Server timestamps may omit the timezone offset which breaks string ordering.
  const readAtMs = localReadAt ? new Date(localReadAt).getTime() : null;
  const trulyUnread = readAtMs != null
    ? incomingAfterReply.filter((m) => new Date(m.createdAt).getTime() > readAtMs)
    : incomingAfterReply;

  // Step 3 — determine unread state.
  // localReadAt is available  → use timestamp comparison (most accurate).
  // localReadAt is null       → fall back to server flag (cache miss / fresh install).
  const lastUnread = trulyUnread.at(-1);
  const isUnread =
    lastUnread != null &&
    (readAtMs != null ? true : !ticket.isMessageRead);

  return {
    isUnread,
    unreadCount: isUnread ? trulyUnread.length : 0,
  };
}
```

### Critical: why `Date.getTime()` and not string comparison

```ts
// ❌ WRONG — breaks when server omits timezone offset
"2024-01-01T10:00:00" > "2024-01-01T09:05:00.000Z"
// → true  (string "T10" > "T09")
// but 10:00 local (UTC+1) = 09:00 UTC → message is BEFORE the open

// ✅ CORRECT — timezone-aware
new Date("2024-01-01T10:00:00").getTime() > new Date("2024-01-01T09:05:00.000Z").getTime()
// → false (09:00 UTC < 09:05 UTC)
```

### Why `unreadCount` needs the full message list

The count reflects only messages that arrived **after the user last opened the chat** (`localReadAt`). If you only have the latest message you cannot distinguish "3 new messages since last open" from "1 new message". Always fetch all messages.

### Why `isMessageRead` is a fallback, not a condition

```ts
// ❌ WRONG — isMessageRead may stay true even after a new agency message
const isUnread = !ticket.isMessageRead && lastUnread != null && ...;
// If the server doesn't reset isMessageRead on new messages → always read → badge never shows

// ✅ CORRECT — isMessageRead only covers the case where localReadAt is absent
const isUnread =
  lastUnread != null &&
  (readAtMs != null ? true : !ticket.isMessageRead);
```

---

## Layer 4 — Global Unread Count (Tab Badge)

A React context at the root of the app holds `totalUnread`. It is the **only** source driving the tab bar badge. There is no polling, no WebSocket, no component that stays mounted listening — `totalUnread` is updated whenever the conversation list reloads.

**File:** `lib/unreadCount.tsx`

```tsx
import { createContext, useContext, useState, type ReactNode } from "react";

type ContextValue = {
  totalUnread: number;
  setTotalUnread: (n: number) => void;
};

const UnreadCountContext = createContext<ContextValue>({
  totalUnread: 0,
  setTotalUnread: () => {},
});

export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const [totalUnread, setTotalUnread] = useState(0);
  return (
    <UnreadCountContext.Provider value={{ totalUnread, setTotalUnread }}>
      {children}
    </UnreadCountContext.Provider>
  );
}

export function useUnreadCount() {
  return useContext(UnreadCountContext);
}
```

Mount `<UnreadCountProvider>` in `app/_layout.tsx`, above the navigator.

The conversation list hook updates it after every load:

```ts
const { setTotalUnread } = useUnreadCount();

// At the end of loadConversations():
setTotalUnread(conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0));
```

The tab bar reads it:

```tsx
const { totalUnread } = useUnreadCount();
// pass to your tab badge component
```

---

## Layer 5 — Conversation List Hook

**File:** `lib/hooks/useDriverConversations.ts`

This hook owns the full load cycle: fetch → hydrate cache → compute unread → update badge.

```ts
function useDriverConversations() {
  const { setTotalUnread } = useUnreadCount();

  const loadConversations = useCallback(async () => {
    const currentUserId = await getCurrentUserId();
    const transactions = await listTransactions();

    // Hydrate local read cache from SecureStore for all known conversation IDs.
    // Must happen BEFORE the loop below calls getLocalReadAt().
    await hydrateLocalReadStore(transactions.map((tx) => tx.id));

    const enriched = await Promise.all(
      transactions.map(async (tx) => {
        const ticket = await getTicketForTransaction(tx.id);
        if (!ticket) return null;

        const messages = await getMessages(ticket.id);

        // getLocalReadAt is synchronous — cache is already warm from hydrateLocalReadStore.
        const localReadAt = getLocalReadAt(tx.id);

        return computeUnreadState(messages, currentUserId, ticket, localReadAt);
      }),
    );

    const conversations = enriched.filter(Boolean);
    setConversations(conversations);
    setTotalUnread(conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0));
  }, [setTotalUnread]);

  // Reload every time this screen gains focus.
  // This is what clears the badge when the user returns from the chat screen.
  useFocusEffect(
    useCallback(() => {
      void loadConversations();
    }, [loadConversations]),
  );

  return { conversations, loadConversations };
}
```

**Why `hydrateLocalReadStore` is called inside `loadConversations` and not in a `useEffect`:**
It must run before `getLocalReadAt` is called in the loop below it. Putting it in a separate `useEffect` creates a race condition where `getLocalReadAt` could run before the cache is warm, returning `null` for all conversations and showing everything as unread.

---

## Layer 6 — Chat Screen

**File:** `app/inbox/[id].tsx` (or equivalent)

The two critical rules:

**Rule 1 — `setLocalReadAt` before any fetch:**

```ts
const reloadThread = useCallback(async () => {
  // Mark as read FIRST, synchronously, before any await.
  // This ensures the badge clears even if the user navigates back
  // before the API calls complete.
  setLocalReadAt(String(conversationId));

  const thread = await loadThread(conversationId); // calls markTicketRead internally
  setMessages(thread.messages);
}, [conversationId]);

useFocusEffect(
  useCallback(() => {
    void reloadThread();
  }, [reloadThread]),
);
```

**Rule 2 — `setLocalReadAt` also on silent background refresh:**

```ts
const silentRefresh = useCallback(async () => {
  try {
    const thread = await loadThread(conversationId);
    setMessages(thread.messages);
    setLocalReadAt(String(conversationId)); // keep localReadAt current
  } catch {}
}, [conversationId]);
```

---

## Data Flow — Complete Sequence

```
App opens
  └─ Conversation list loads (useFocusEffect)
       ├─ listTransactions()
       ├─ hydrateLocalReadStore(ids)        ← warm cache from SecureStore
       ├─ for each transaction:
       │    ├─ getTicketForTransaction()    ← fetch from server
       │    ├─ getMessages(ticket.id)       ← ALL messages, not just last
       │    ├─ getLocalReadAt(id)           ← synchronous, cache already warm
       │    └─ computeUnreadState()         ← isUnread + unreadCount
       └─ setTotalUnread(total)             ← updates tab badge

User taps a conversation
  └─ Chat screen gains focus (useFocusEffect)
       ├─ setLocalReadAt(id)               ← SYNC, before any fetch
       ├─ getTicketForTransaction()
       ├─ markTicketRead(ticket.id)        ← async, errors swallowed
       └─ getMessages(ticket.id)

User presses back
  └─ List screen regains focus (useFocusEffect fires again)
       └─ loadConversations() runs
            ├─ hydrateLocalReadStore()     ← cache.has(id) = true → skips SecureStore
            ├─ getLocalReadAt(id)          ← returns timestamp set by setLocalReadAt
            └─ computeUnreadState()
                 ├─ readAtMs = new Date(localReadAt).getTime()
                 ├─ trulyUnread = messages after readAtMs → []
                 └─ isUnread = false → badge clears ✓

Agency sends new message (while user is on list)
  └─ next useFocusEffect / pull-to-refresh
       └─ computeUnreadState()
            ├─ new message createdAt > localReadAt
            └─ isUnread = true → badge appears ✓
```

---

## Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| String timestamp comparison | Badge never clears after opening | Use `Date.getTime()` |
| `isMessageRead` as primary signal | New messages not detected after first read | Use `isMessageRead` as fallback only (when `localReadAt` is null) |
| `setLocalReadAt` called after fetch | Badge doesn't clear if user navigates back quickly | Call `setLocalReadAt` as the very first line, before any `await` |
| `hydrateLocalReadStore` in `useEffect` | Everything shows as unread on first load | Call it inside `loadConversations`, before the loop that calls `getLocalReadAt` |
| Only fetching last message | Wrong unread count | Fetch all messages — count requires knowing what arrived after `localReadAt` |
| `isMessageRead` used to block unread | New messages silently missed | Never use `!isMessageRead &&` as a pre-condition for `isUnread` |

---

## Checklist for a New App

**Local store**
- [ ] Module-level `Map` + SecureStore persistence
- [ ] `setLocalReadAt(id)` is the first line of the chat load function, before any `await`
- [ ] `setLocalReadAt(id)` also called in background refresh
- [ ] `hydrateLocalReadStore(ids)` called inside the list load function, before `getLocalReadAt` loop

**Unread computation**
- [ ] Full message list available (not just last message)
- [ ] `Date.getTime()` used for all timestamp comparisons
- [ ] `isMessageRead` used as fallback only when `localReadAt` is null
- [ ] `unreadCount` = messages with `createdAt > localReadAt` (not total incoming)

**Global badge**
- [ ] `UnreadCountProvider` at the root, above the navigator
- [ ] `setTotalUnread` called at the end of every list load
- [ ] Tab bar reads `totalUnread` from context

**Navigation**
- [ ] `useFocusEffect` in the list hook (not `useEffect`) — fires on every return from chat
- [ ] `markTicketRead` called on chat open, errors swallowed, non-blocking

---

## Dependencies (Expo / React Native)

| Package | Purpose |
|---|---|
| `expo-secure-store` | Persist read timestamps across app restarts |
| `expo-router` or `@react-navigation/native` | `useFocusEffect` for reload on navigation return |

For non-Expo apps, replace `SecureStore` with `AsyncStorage` or any persistent key-value store. The pattern is identical.
