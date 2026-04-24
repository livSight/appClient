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

## Architecture

**Stack:** React Native + Expo 54, Expo Router (file-based navigation), NativeWind (Tailwind for RN), TypeScript. New Architecture and React Compiler are both enabled.

**Language:** UI text is in French.

### Navigation

Expo Router file-based routing. The root layout (`app/_layout.tsx`) is currently UI-only (no auth guard / no redirects).

```
app/
├── _layout.tsx              # Root: auth guard → redirects to /login or /(tabs)/livraison
├── (tabs)/
│   ├── _layout.tsx          # Bottom tab bar (Accueil, Livraison, Rapports, Stock)
│   ├── index.tsx            # Accueil
│   ├── livraison.tsx        # Deliveries list
│   ├── rapports.tsx         # Reports/analytics
│   └── stock.tsx            # Inventory
├── livraison-detail/[id].tsx  # Dynamic delivery detail
├── profile.tsx
├── ajouter-au-stock.tsx
└── ...
```

### API Client / Auth

This repo is currently running in **UI-only mode**. API/auth modules have been removed, and screens use local mock data.

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
