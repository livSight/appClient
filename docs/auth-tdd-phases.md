# LivSight Auth — TDD Implementation Phases

Phased plan to wire Keycloak login (`:4000`) into the Expo app and authenticate calls to the API (`:8085`). Each phase follows **Red → Green → Refactor**.

**Status:** Phase 12 complete. Phases 13–14 are pending.

> **Project rule:** TDD is mandatory for all code changes. See `.cursor/rules/tdd-mandatory.mdc`.

---

## Current state

- No login screen, no auth guard (`app/_layout.tsx` is open)
- `USER_ID` env hack removed (Phase 11); user id resolved from JWT → `GET /api/users?keycloakId=`
- `lib/api/transactions.ts` — no `Authorization` header
- `expo-secure-store` installed; Jest configured (Phase 0 complete)

---

## Known server contract (verified)

| Service | URL |
|---|---|
| Auth | `POST http://156.67.27.35:4000/auth/login` |
| API | `http://156.67.27.35:8085` |

**Login body:** `{ "username": string, "password": string }`

> **Note:** Username may need **email** (`snake123@example.com`), not bare `snake123`.

**Success response:**

```json
{
  "accessToken": "…",
  "refreshToken": "…",
  "expiresIn": 1200,
  "tokenType": "Bearer"
}
```

JWT `sub` = Keycloak user id (e.g. `5785160a-6c5c-44d5-96fd-d28aa677d8d4` for app user 3).

| Endpoint | Auth | Result (verified) |
|---|---|---|
| `GET /api/transactions` | `Authorization: Bearer {token}` | 200 |
| `POST /api/transactions` | Bearer / `X-User-Id` | Still failing — resolve in Phase 12 |

---

## TDD workflow (every phase)

1. **Red** — Write failing test describing desired behavior.
2. **Green** — Minimal implementation to pass.
3. **Refactor** — Clean up; keep tests green.
4. **Manual check** — Hit real `:4000` / `:8085` when integration matters.
5. **Commit** — One phase per commit where possible.

---

## Phase 0 — Test infrastructure ✅

**Goal:** Enable TDD before any auth code.

### Red

- Add `npm test` script; confirm it fails with “no tests”.

### Green

- Install **Jest**, **jest-expo**, **@testing-library/react-native**, **@types/jest**.
- Add `jest.config.js`, `__tests__/setup.ts`.
- Mock `expo-secure-store`, global `fetch`, `@/lib/logger`.
- Smoke test passes.

### Refactor

- Document commands: `npm test`, `npm run test:watch`.

**Files:** `package.json`, `jest.config.js`, `__tests__/setup.ts`, `__tests__/smoke.test.ts`

**Done when:** `npm test` runs green.

**Commands:**

```bash
npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

---

## Phase 1 — Environment & config ✅

**Goal:** Centralize auth base URL; keep secrets out of git.

### Red

- Test `requireEnv("EXPO_PUBLIC_AUTH_BASE_URL")` throws when missing.
- Test `AUTH_BASE_URL` strips trailing slash.

### Green

- Add to `lib/config/env.ts`:
  - `AUTH_BASE_URL` from `EXPO_PUBLIC_AUTH_BASE_URL`
- Update `.env.example`:
  ```
  EXPO_PUBLIC_API_BASE_URL=
  EXPO_PUBLIC_AUTH_BASE_URL=
  ```
- Update `eas.json` profiles with auth URL.

### Refactor

- Re-export from `lib/config/api.ts` if useful.

**Done when:** app boots with both URLs in `.env`; tests pass.

---

## Phase 2 — Auth API client (`lib/auth/authApi.ts`) ✅

**Goal:** Pure functions for login / refresh; no UI, no storage.

### Red

Tests (mock `fetch`):

- `login({ username, password })` POSTs to `{AUTH_BASE_URL}/auth/login` with JSON body.
- Parses `accessToken`, `refreshToken`, `expiresIn`, `tokenType`.
- Throws readable error on 401 / network failure.
- `refreshAccessToken(refreshToken)` — if backend exposes refresh endpoint; else skip until confirmed.

### Green

- Implement `lib/auth/authApi.ts`.
- Types: `LoginCredentials`, `AuthTokens`, `AuthError`.

### Refactor

- Shared `parseAuthResponse`, `authErrorFromResponse`.

**Done when:** unit tests pass; manual curl parity with Postman.

---

## Phase 3 — JWT helpers (`lib/auth/jwt.ts`) ✅

**Goal:** Decode token claims without verifying signature (client-side UX only).

### Red

Tests:

- `decodeJwtPayload(token)` returns `{ sub, email, exp, … }`.
- `isTokenExpired(payload, now)` true when `exp` passed.
- `getTokenExpiryMs(expiresIn, issuedAt)` computes expiry.

### Green

- Implement base64url decode (no external dep, or `jwt-decode` if allowed).

### Refactor

- Never trust decoded JWT for security — server validates.

**Done when:** tests pass with sample token from login response.

---

## Phase 4 — Secure token storage (`lib/auth/tokenStore.ts`) ✅

**Goal:** Persist session across app restarts.

### Red

Tests (mock SecureStore):

- `saveTokens(tokens)` writes access + refresh + expiry.
- `loadTokens()` returns null when empty.
- `clearTokens()` removes all keys.
- Keys are namespaced (`livsight.accessToken`, etc.).

### Green

- Implement with `expo-secure-store`.
- Store: `accessToken`, `refreshToken`, `expiresAt` (ISO or ms).

### Refactor

- Interface `TokenStore` for test doubles.

**Done when:** round-trip save/load/clear tests pass.

---

## Phase 5 — Auth session service (`lib/auth/session.ts`) ✅

**Goal:** Orchestrate login, logout, getValidAccessToken.

### Red

Tests:

- `loginAndPersist(credentials)` calls authApi + tokenStore.
- `getValidAccessToken()` returns cached token if not expired.
- `getValidAccessToken()` refreshes when expired (if refresh endpoint exists).
- `logout()` clears store.
- `getSessionUser()` returns `{ keycloakId: sub, email }` from JWT.

### Green

- Implement `lib/auth/session.ts`.

### Refactor

- Single entry point for screens: `authSession.login()`, `.logout()`, `.getAccessToken()`.

**Done when:** session tests pass with mocked api + store.

---

## Phase 6 — Authenticated fetch wrapper (`lib/api/client.ts`) ✅

**Goal:** One place to attach `Authorization: Bearer …` to API calls.

### Red

Tests:

- `apiFetch(url, init)` adds `Authorization` when token present.
- Does not add header when logged out.
- On 401, triggers logout or refresh (policy TBD).
- Merges `accept: application/json` by default.

### Green

- Implement `lib/api/client.ts` using `session.getValidAccessToken()`.
- Optional: `X-User-Id` header if backend requires Keycloak `sub` for POST (confirm in Phase 12).

### Refactor

- Replace raw `fetch` in `transactions.ts`, `users.ts`, `stock.ts` incrementally.

**Done when:** wrapper tests pass; one API module migrated.

---

## Phase 7 — Wire `lib/api/transactions.ts` ✅

**Goal:** All transaction HTTP uses authenticated client.

### Red

Tests (mock `apiFetch`):

- `listTransactions()` calls `GET /api/transactions` with auth header.
- `createTransaction()` POSTs multipart with auth header.
- `getTransactionById()` uses reference URL when id is `LVS-*`.

### Green

- Replace `fetch` with `apiFetch` in `transactions.ts`.
- **Temporarily keep** client-side `user_id` filter until server scopes by token (remove in Phase 11).

### Refactor

- Remove duplicate error parsing if centralized in client.

**Done when:** list/detail integration tests pass; manual app shows user transactions when logged in.

---

## Phase 8 — Auth context & hook (`lib/auth/AuthProvider.tsx`) ✅

**Goal:** React state for `isAuthenticated`, `user`, `login`, `logout`.

### Red

Tests (React Testing Library):

- Provider exposes `isAuthenticated: false` initially.
- After `login()` succeeds, `isAuthenticated: true`.
- `logout()` resets state.

### Green

- `AuthProvider` + `useAuth()` hook.
- Wrap root in `app/_layout.tsx`.

### Refactor

- Loading state while `loadTokens()` on mount.

**Done when:** hook tests pass; provider wraps app.

---

## Phase 9 — Login screen (`app/login.tsx`) ✅

**Goal:** French UI for username + password.

### Red

Tests:

- Renders username/password fields + submit.
- Submit calls `authSession.login` with form values.
- Shows error message on 401.
- Disables submit while loading.

### Green

- Login screen using `AppText`, `AppTextInput`, `FormButton`, tokens.
- Navigate to `/(tabs)` on success.

### Refactor

- Haptic on submit; keyboard-safe layout.

**Done when:** component tests pass; manual login works against `:4000`.

---

## Phase 10 — Auth guard (`app/_layout.tsx`) ✅

**Goal:** Unauthenticated users → `/login`; authenticated → tabs.

### Red

Tests:

- No token → redirect to `/login`.
- Valid token → allow `(tabs)`.
- `/login` accessible when logged out.

### Green

- Guard in root layout using `useAuth()` + `router.replace`.
- Splash/loading while session restores from SecureStore.

### Refactor

- Extract `useAuthGuard()` hook.

**Done when:** cold start restores session; guard tests pass.

---

## Phase 11 — Remove env user hack ✅

**Goal:** Drop runtime dependency on `EXPO_PUBLIC_DEV_USER_ID`.

### Red

Tests:

- `listTransactions()` does **not** filter by hardcoded `USER_ID` when authenticated.
- Profile/home load user via token-derived id or `GET /api/users/me` (if added).

### Green

- Remove `USER_ID` usage from `transactions.ts`, `profile.tsx`, `index.tsx`, `mes-informations.tsx`, `stock.ts`.
- Map JWT `sub` → app user id via API or stored mapping after login.
- Remove `EXPO_PUBLIC_DEV_USER_ID` from `.env.example` / `eas.json` when safe.

### Refactor

- `getCurrentUserId()` in session layer.

**Done when:** app works without `EXPO_PUBLIC_DEV_USER_ID` in `.env`.

---

## Phase 12 — POST transaction contract (backend alignment) ✅

**Goal:** Create transaction succeeds when logged in.

### Red

Integration tests / manual checklist:

- POST multipart with Bearer → document actual success/error.
- Confirm required headers: `Authorization` vs `X-User-Id: {keycloakSub}`.
- Confirm `source` enum values (`instocke` vs backend enum).
- Confirm `image` part required or optional.

### Green

- Fix `TransactionRequest` / `buildTransactionFormData` to match backend enum.
- Add placeholder image if server requires it (until image UI exists).

### Refactor

- Document contract in `docs/api-transactions.md`.

**Done when:** resume screens successfully create a transaction end-to-end.

---

## Phase 13 — Push token registration (optional)

**Goal:** Register Expo push token for logged-in user.

### Red

- Test `registerPushToken()` sends token + auth header to backend route.

### Green

- Re-enable backend registration in `lib/push/registerPushNotifications.ts`.
- Call after login from `AuthProvider`.

**Done when:** token registered post-login; skipped when logged out.

---

## Phase 14 — Logout & session expiry UX ✅

**Goal:** Clean logout everywhere.

### Red

- Logout clears SecureStore + auth context + redirects to login.
- Expired token on API 401 → logout or silent refresh.

### Green

- Logout button on `profile.tsx` wired to `useAuth().logout()` → `/login`.
- Global 401 handler in `apiFetch` calls `authSession.logout("unauthorized")`; `AuthProvider` syncs via `sessionEvents`.

**Done when:** logout and expiry flows tested manually.

---

## Target file layout

```
lib/
  auth/
    authApi.ts
    jwt.ts
    tokenStore.ts
    session.ts
    AuthProvider.tsx
    index.ts
  api/
    client.ts
    transactions.ts
  config/
    env.ts
__tests__/
  setup.ts
  smoke.test.ts
  auth/
    authApi.test.ts
    jwt.test.ts
    tokenStore.test.ts
    session.test.ts
  api/
    client.test.ts
    transactions.test.ts
app/
  login.tsx
  _layout.tsx
docs/
  auth-tdd-phases.md
```

---

## Phase order summary

| # | Phase | Depends on | Status |
|---|---|---|---|
| 0 | Jest / test setup | — | Done |
| 1 | Env + `AUTH_BASE_URL` | 0 | Done |
| 2 | `authApi` login | 0, 1 | Done |
| 3 | JWT helpers | 0 | Done |
| 4 | Secure token store | 0 | Done |
| 5 | Session service | 2, 3, 4 | Done |
| 6 | `apiFetch` wrapper | 5 | Done |
| 7 | Wire transactions | 6 | Done |
| 8 | AuthProvider | 5 | Done |
| 9 | Login screen | 5, 8 | Done |
| 10 | Auth guard | 8, 9 | Done |
| 11 | Remove `USER_ID` env | 7, 10 | Done |
| 12 | POST contract fix | 7, 10 | Done |
| 13 | Push registration | 10 | Deferred (backend #41) |
| 14 | Logout / 401 UX | 6, 8 | Done |

---

## Open questions for backend

- [x] POST `/api/transactions`: Bearer + `X-User-Id: {keycloakSub}` — documented in `docs/api-transactions.md`
- [x] `image` multipart part required on every POST — yes; app sends placeholder when missing
- [ ] Exact `source` enum strings accepted by Java backend (currently omitted on POST)
- [ ] Refresh token endpoint URL and body?
- [x] Map Keycloak `sub` → numeric `user_id` via `GET /api/users?keycloakId=` (Phase 11)

---

## Test credentials (local only — do not commit)

| Field | Value |
|---|---|
| Auth URL | `http://156.67.27.35:4000/auth/login` |
| Username | `snake123@example.com` |
| Password | `Abc123` |
| Keycloak sub (user 3) | `5785160a-6c5c-44d5-96fd-d28aa677d8d4` |
| App user id | `3` |
