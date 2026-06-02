# LivSight — Client mobile (Expo)

Application mobile **client** LivSight : livraisons, expéditions, stock (packages), conversations et profil. UI en **français**. Branchée sur le backend LivSight (`backend_core`) et la passerelle auth Keycloak (`api-gateway`).

**Stack :** React Native · Expo 54 · Expo Router · TypeScript · NativeWind · Jest (TDD)

---

## Démarrage

### Prérequis

- Node 18+
- Expo CLI / Expo Go ou dev client
- Backend local ou distant accessible depuis l’appareil/simulateur

### Installation

```bash
npm install
```

### Variables d’environnement

Créer `.env` à la racine (non versionné) :

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8085
EXPO_PUBLIC_AUTH_BASE_URL=http://localhost:4000
```

| Variable | Rôle |
|----------|------|
| `EXPO_PUBLIC_API_BASE_URL` | API métier (`backend_core`, port **8085**) |
| `EXPO_PUBLIC_AUTH_BASE_URL` | Login JWT (`api-gateway`, port **4000**) |

Sur **appareil physique**, `localhost` pointe vers le téléphone — utiliser l’IP de votre machine ou l’URL du serveur déployé.

Redémarrer Metro après modification du `.env` :

```bash
npx expo start --clear
```

**Push (dev)** : l’enregistrement du token Expo est **désactivé** en `__DEV__` par défaut. Pour tester sur appareil réel : `EXPO_PUBLIC_ENABLE_PUSH=true` dans `.env`.

### Commandes

```bash
npm start              # Expo dev server
npm run start:dev      # Dev client (build natif custom)
npm run ios            # Simulateur iOS
npm run android        # Émulateur Android
npm run lint           # ESLint

npm test               # Jest (146+ tests)
npm run test:watch
npm run test:coverage
```

Builds EAS : voir `eas.json` et scripts `npm run eas:build:*`.

---

## Fonctionnalités (état actuel)

### Authentification

- Login email/mot de passe → `POST {AUTH}/auth/login`
- JWT stocké dans Secure Store ; `apiFetch` envoie `Authorization: Bearer`
- Garde de route : `app/_layout.tsx` + `lib/auth/useAuthGuard.ts`
- Fichiers : `app/login.tsx`, `lib/auth/*`, `lib/config/auth.ts`

### Stock (packages)

- Liste et ajout via **`/api/packages`** (remplace l’ancien `/api/stock-items`)
- Écran liste en **lecture seule** ; création sur `ajouter-au-stock`
- Catalogue réutilisé dans les formulaires livraison/expédition (typeahead)
- Fichiers : `lib/api/packages.ts`, `app/(tabs)/stock.tsx`, `app/ajouter-au-stock.tsx`, `components/MaDemandeProduitsForm.tsx`

### Livraisons & expéditions (transactions)

- **Liste** : `GET /api/users/transactions?keycloakId={JWT.sub}` — uniquement les courses de l’utilisateur connecté (inclut les créations WhatsApp)
- **Création** : `POST /api/transactions` (multipart) + header **`X-User-Id`** = Keycloak `sub`
- **Détail** : `GET /api/transactions/:id` ou `?transactionReference=LVS-…`
- **`source`** (enum backend) : `stock` (en stock) · `pickup` (ramassage) — **pas** `instocke` / `pick_up`
- **`type`** : `delivery` · `expedition`
- Image **obligatoire** côté API ; l’app envoie un placeholder PNG si l’utilisateur n’a pas de photo
- Fichiers flux : `ma-demande-livraison`, `ma-demande-expedition`, `resume-produit-en-stock`, `resume-produit-ramasse`, `livraison-detail`, `expedition-detail`

### Cartes liste (`TransactionCard`)

Pastilles : **Livraison** / **Expédition**, **En stock** / **Ramassage**, **Express**, statut, montant espèces.

- Mapping : `lib/api/transactionUi.ts` → `mapTransactionToCardItem()`
- Composant : `components/TransactionCard.tsx`
- Écrans : `app/(tabs)/livraison.tsx`, `app/(tabs)/index.tsx` (dernière commande)

### Inbox / conversations

- Onglet **Inbox** → `app/conversations.tsx` (réexport `app/(tabs)/inbox.tsx`)
- Cartes **`ConversationCard`** : titre = **`package_name`** (produit), sous-titre = quartier ou trajet
- Chat : `app/inbox/[id].tsx` (bannière transaction + messages mock)
- Mapping : `lib/api/conversationUi.ts` → `mapTransactionToConversationItem()`

### Profil & divers

- `app/profile.tsx`, `app/mes-informations.tsx`, tarifs, annulation, etc.

---

## Intégration API (résumé)

| Action | Endpoint | Notes |
|--------|----------|--------|
| Login | `POST /auth/login` | `:4000` — body `{ username, password }` |
| Profil user | `GET /api/users?keycloakId=…` | Retourne souvent **tous** les users ; le client filtre par `keycloakId` (`findUserByKeycloakId`) |
| Mes transactions | `GET /api/users/transactions?keycloakId=…` | Liste mobile |
| Créer transaction | `POST /api/transactions` | Multipart + `X-User-Id` |
| Packages | `GET/POST /api/packages`, `POST …/create-package` | Stock |
| Détail transaction | `GET /api/transactions/reference?transactionReference=` | |

Contrat détaillé : [`docs/api-transactions.md`](docs/api-transactions.md)  
Phases auth TDD : [`docs/auth-tdd-phases.md`](docs/auth-tdd-phases.md)

---

## Arborescence utile

```
app/
├── _layout.tsx                 # Root + auth guard
├── login.tsx
├── (tabs)/
│   ├── index.tsx               # Accueil
│   ├── livraison.tsx           # Mes courses
│   ├── stock.tsx               # Mon stock (packages)
│   ├── inbox.tsx               # → conversations
│   └── rapports.tsx
├── conversations.tsx           # Liste conversations
├── inbox/[id].tsx              # Chat + bannière course
├── ajouter-au-stock.tsx
├── ma-demande-livraison.tsx
├── ma-demande-expedition.tsx
├── resume-produit-en-stock.tsx
├── resume-produit-ramasse.tsx
├── livraison-detail/[id].tsx
└── expedition-detail/[id].tsx

lib/
├── api/
│   ├── client.ts               # fetch + Bearer + 401 logout
│   ├── transactions.ts         # CRUD transactions, multipart create
│   ├── transactionUi.ts        # Cartes livraison (pills, filtres)
│   ├── conversationUi.ts       # Cartes inbox
│   ├── packages.ts             # Stock / packages
│   ├── users.ts                # Lookup user (keycloakId)
│   └── transactionImage.ts     # Placeholder image POST
├── auth/                       # Session, JWT, login API
└── config/env.ts               # EXPO_PUBLIC_* URLs

components/
├── TransactionCard.tsx
├── ConversationCard.tsx
├── MaDemandeProduitsForm.tsx
├── StockProductCard.tsx
├── AppText.tsx / AppTextInput.tsx
└── …

theme/
├── tokens.ts                   # Couleurs, typo Montserrat/Palanquin
└── styles.ts

__tests__/
├── api/                        # packages, transactions, transactionUi, conversationUi, users, client
├── auth/
└── app/
```

**Supprimé :** `lib/api/stock.ts` (remplacé par `packages.ts`).

---

## Tests

TDD obligatoire pour la logique API et auth. Miroir `lib/` → `__tests__/`.

```bash
npm test
```

Suites principales : `packages`, `transactions`, `transactionUi`, `conversationUi`, `users`, `auth`, `client`.

---

## Design & accessibilité

- Typo centralisée : `theme/tokens.ts` — **Montserrat** (corps), **Palanquin** (titres)
- Toujours `<AppText>` / `<AppTextInput>` (pas `Text` / `TextInput` RN) — Dynamic Type
- Tokens partagés : `theme/styles.ts` (`card`, `layout`, …)
- Règles projet : `.cursor/rules/`, `CLAUDE.md`

---

## Admin dashboard (hors repo)

Le tableau de bord web vit dans le dossier frère **`client/`** (Vite, port 5177). Même auth `:4000` et API `:8085`, mais liste admin via `GET /api/transactions` (tous les clients).

---

## Learn more (Expo)

- [Expo documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
