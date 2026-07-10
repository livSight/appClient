# Proposal: aggregate inbox endpoint (`GET /api/tickets/inbox`)

Handoff spec for the **backend** team (`backend_core` / ticket service behind the API gateway).
Written from the **appClient** side, where the cost of the missing endpoint is paid today.

**See also:** [messaging-client-implementation.md](./messaging-client-implementation.md) — client read/unread implementation
**Last updated:** 2026-07-04
**Status:** proposed — not implemented

---

## 1. Problem

The client app's **Conversations tab** must show, for every order of the logged-in user:
the ticket (if any), the last message preview, and an unread indicator.

There is no endpoint that returns this list. The client reconstructs it by joining
three existing endpoints **over HTTP, per transaction**:

| Step | Endpoint | Calls |
|------|----------|-------|
| 1. List my orders | `GET /api/users/transactions?keycloakId=…` | 1 |
| 2. Find the ticket per order | `GET /api/tickets/transaction/:transactionId` | **N** (one per transaction) |
| 3. Load messages per ticket | `GET /api/tickets/messages?ticketId=…` | **up to N** (one per ticket) |

### Impact

- **Request volume:** a user with 40 orders costs **~80 requests** to render one screen.
  The screen reloads on **every tab focus** and on **every message push notification**,
  so an active user replays this fan-out many times per session.
- **Gateway/service load:** most of the N calls return "no ticket" or an unchanged
  thread — wasted work server-side, amplified by every client running the same pattern.
- **Latency:** the client currently fires the N calls in one unbounded `Promise.all`;
  the screen is as slow as the slowest of ~2N requests, and the burst can saturate
  the device's connection pool (and rate limits, if any are added later).
- **Tab badge:** the unread badge needs this same data, so any future "compute badge
  at app start / on push" feature multiplies the fan-out further.
- **Full message bodies are downloaded just to count them:** step 3 fetches entire
  threads when the list only needs the last message and timestamps.

---

## 2. Proposed endpoint

One aggregate query in the ticket service; the gateway just routes it.

```
GET /api/tickets/inbox
```

- Caller identified the same way as other ticket endpoints (`X-User-Id` / keycloakId
  via gateway-injected identity). No query params required.
- Semantics: "all client-channel tickets attached to my transactions, newest activity
  first, each with its transaction reference and last message".

### Response shape

```json
[
  {
    "ticket": {
      "id": 12,
      "status": "open",
      "channel": "client",
      "isMessageRead": false,
      "createdAt": "2026-07-01T08:30:00Z",
      "updatedAt": "2026-07-04T09:12:00Z"
    },
    "transaction": {
      "id": 345,
      "transactionReference": "LVS-2026-00345"
    },
    "lastMessage": {
      "id": 9001,
      "senderId": 7,
      "content": "Votre colis est en route.",
      "createdAt": "2026-07-04T09:12:00Z"
    },
    "messageCount": 14
  }
]
```

Notes:

- `lastMessage` may be `null` for a ticket with no messages yet.
- `content` can be truncated server-side (e.g. 200 chars) — the list only shows a preview.
- Server-side this is one query: tickets of the caller's transactions, LEFT JOIN
  last message per ticket (window function or lateral join), plus a count.
- Existing endpoints stay as-is; the thread screen keeps using
  `GET /api/tickets/messages?ticketId=…`.

### What the client does with it

The client keeps a local `readAt` timestamp per conversation (device-side; see
messaging-client-implementation.md). Unread is derived as:

```
isUnread = lastMessage != null
        && lastMessage.senderId != me
        && (localReadAt == null || lastMessage.createdAt > localReadAt)
```

so the endpoint does **not** need to track per-user read state — `isMessageRead`
stays the coarse server flag it is today, and `lastMessage.createdAt` is the only
field the unread logic strictly needs.

---

## 3. Acceptance criteria

1. One request renders the Conversations tab for any number of transactions.
2. Response ordered by last activity (`lastMessage.createdAt` desc, ticket
   `updatedAt` as fallback), so the client doesn't re-sort.
3. Tickets from other users' transactions are never returned (same authorization
   rule as `GET /api/tickets/transaction/:id`).
4. p95 latency for a user with 100 transactions comparable to a single
   `GET /api/tickets/transaction/:id` call today.
5. Client keeps working unchanged against old endpoints until it migrates
   (purely additive change).

---

## 4. Client-side follow-up (appClient, once shipped)

- Replace `loadClientTicketsByNavId` (N+1 joins in `app/conversations.tsx`) with one
  `GET /api/tickets/inbox` call.
- Compute the tab badge from the same response at app start and on message push,
  not only when the Conversations tab is focused.
