# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start                        # Start Expo dev server
npm run start:dev                # Start with dev-client (for custom native builds)
npm run ios                      # Run iOS simulator
npm run android                  # Run Android emulator
npm run lint                     # Run ESLint

# EAS builds (requires eas-cli and Expo account)
npm run eas:build:dev:android    # Development APK
npm run eas:build:preview:android # Preview APK (internal distribution)
npm run eas:build:production     # Production builds for both platforms
```

No test framework is configured.

## Environment

Copy `.env` and set two required vars — the app will throw at startup if either is missing:

```
EXPO_PUBLIC_API_BASE_URL=https://…   # Backend REST API
EXPO_PUBLIC_AUTH_BASE_URL=https://…  # Keycloak auth server
```

## Architecture

**Stack:** React Native + Expo 54, Expo Router (file-based navigation), NativeWind (Tailwind for RN), TypeScript. New Architecture and React Compiler are both enabled.

**Language:** UI text is in French.

### Auth & API layer

Auth is Keycloak-based. The layered structure:

1. `lib/auth/session.ts` — singleton `authSession`; handles login, token persistence (`lib/auth/tokenStore.ts`), expiry, and logout via `sessionEvents`.
2. `lib/api/client.ts` — `apiFetch` wraps `fetch` with a Bearer token injected from `authSession`. Fires `authSession.logout("unauthorized")` on 401.
3. `lib/api/*.ts` — feature modules (`transactions.ts`, `packages.ts`, `users.ts`) call `apiFetch`.
4. `lib/auth/AuthProvider.tsx` + `lib/auth/useAuthGuard.ts` — React context that gates navigation; unauthenticated users are redirected to `/login`, authenticated users on `/login` are redirected to `/(tabs)`.

### Navigation

Expo Router file-based routing. The root layout (`app/_layout.tsx`) wraps everything in `<AuthProvider>` and calls `useAuthGuard` to redirect on auth state changes.

```
app/
├── _layout.tsx                   # Root: AuthProvider + auth guard
├── login.tsx
├── (tabs)/
│   ├── _layout.tsx               # Bottom tab bar (Accueil, Livraison, Rapports, Stock)
│   ├── index.tsx                 # Accueil
│   ├── livraison.tsx             # Deliveries list
│   ├── rapports.tsx              # Reports/analytics
│   └── stock.tsx                 # Inventory
├── livraison-detail/[id].tsx
├── expedition-detail/[id].tsx
├── ma-demande-livraison.tsx      # → MaDemandeProduitsForm flow="livraison"
├── ma-demande-expedition.tsx     # → MaDemandeProduitsForm flow="expedition"
├── resume-produit-en-stock.tsx   # Summary + submit for stock-sourced orders
├── resume-produit-ramasse.tsx    # Summary + submit for pickup orders
├── confirmee.tsx                 # Success screen after transaction created
└── ...
```

### Transaction creation flow

Form (MaDemandeProduitsForm) → Resume screen (resume-produit-en-stock / resume-produit-ramasse) → `createTransaction()` in `lib/api/transactions.ts` → `/confirmee`.

The resume screens build a `TransactionRequest` via `buildPayloadFromStockResume` or `buildPayloadFromPickupResume`, then call `createTransaction` (POST `/api/transactions` via `apiFetch`). On success, `router.push("/confirmee", { id, flow })`.

### Push Notifications

- `lib/push/usePushNotifications.ts` — hook called from root layout; registers device token with server
- `lib/push/notificationRouting.ts` — routes incoming notifications to the correct screen
- Push tokens are cleaned up on logout (best-effort, errors ignored)

### Design System

`theme/tokens.ts` — primary color `#3090C0`, background `#F8F9FA`, card radius 32px, horizontal padding 24px.
`theme/styles.ts` — shared `StyleSheet` objects reused across screens.
Components live in `components/` (e.g. `OrderCard`, `ScreenLayout`, `PillButton`, `SectionHeader`).

### Typography Rules

- **Always use `<AppText>` not `<Text>`** — enforced by ESLint (`no-restricted-imports`). The only exception is inside `components/AppText.tsx` itself.

- **Always set `fontFamily` instead of `fontWeight`** — setting `fontWeight` alone silently falls back to the system font (SF Pro / Roboto) instead of the custom Montserrat/Palanquin fonts. Use the `fonts` object from `theme/tokens.ts`:

  | Intent | Token | Loaded font |
  |--------|-------|-------------|
  | Regular | `fonts.bodyRegular` | Montserrat 400 |
  | Medium | `fonts.bodyMedium` | Montserrat 500 |
  | SemiBold | `fonts.bodySemi` | Montserrat 600 |
  | Bold / Heavy | `fonts.bodyBold` | Montserrat 700 (max) |
  | Title Bold | `fonts.titleBold` | Palanquin 700 |
  | Title Semi | `fonts.titleSemi` | Palanquin 600 |

  Weights 800/900 have no loaded variant — use `fonts.bodyBold`.

- **When overriding a typography token's weight** (e.g. `{ ...typography.bodyRegular, … }`), replace `fontWeight` with the matching `fontFamily` override, not both.

- **`lineHeight` is auto-scaled by `AppText`** via `PixelRatio.getFontScale()` capped at `maxFontSizeMultiplier`. Always set both `fontSize` and `lineHeight` together so the ratio is preserved under accessibility scaling.

### Environment / Build Profiles

`eas.json` defines EAS profiles for builds.
