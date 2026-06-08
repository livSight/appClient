# Transactions API contract

Verified against `http://localhost:4040` (api-gateway, May 2026).

## Authentication

| Endpoint | Headers |
|---|---|
| `GET /api/transactions` | `Authorization: Bearer {accessToken}` |
| `GET /api/users/transactions?keycloakId={JWT.sub}` | `Authorization: Bearer {accessToken}` — **mobile list** (scoped to session user) |
| `POST /api/transactions` | `Authorization: Bearer {accessToken}` **and** `X-User-Id: {keycloakSub}` |
| `GET /api/transactions/:id` | `Authorization: Bearer {accessToken}` |

- `X-User-Id` must be the **Keycloak subject** (`JWT.sub`), e.g. `5785160a-6c5c-44d5-96fd-d28aa677d8d4`.
- Numeric app user id (`3`) in `X-User-Id` returns **404 User not found**.

## POST `/api/transactions` (multipart)

### Required parts

- All business fields (`package_name`, `description`, `destination_street`, `receiver_name`, `receiver_phone`, `type`, etc.)

### Optional parts

- **`image`** — optional multipart file. When omitted, the backend creates the transaction without a package photo. The mobile app only sends `image` when `TransactionRequest.imageUri` is set.

### `source` field

Backend enum `com.livSight.backend.model.enumerations.Source`:

| Value | Meaning (UI) |
|---|---|
| `stock` | Colis en stock |
| `pickup` | Ramassage |

**Rejected** (HTTP 500): `instocke`, `pick_up`, `IN_STOCKE`, etc.

Error example: `No enum constant com.livSight.backend.model.enumerations.Source.instocke`

`source` is **sent on POST** with the values above.

### Create payload mapping (UI → `TransactionRequest`)

| UI choice | `type` | `source` |
|---|---|---|
| Livraison + Colis en stock | `delivery` | `stock` |
| Livraison + Ramassage | `delivery` | `pickup` |
| Expédition + Colis en stock | `expedition` | `stock` |
| Expédition + Ramassage | `expedition` | `pickup` |

Ramassage livraisons set `description` to `Ramassage: {pickup address}` so list cards can infer fulfillment when `source` is missing on GET.

### Success response

```json
{ "message": "Transaction created successfully" }
```

HTTP **200**

### Client implementation

- `lib/api/transactions.ts` — `buildTransactionFormData()`, `createTransaction()`
- `resolveApiSourceField()` — passes `pickup` / `stock` through to multipart POST

## GET list behaviour

Mobile app: `GET /api/users/transactions?keycloakId={JWT.sub}` via `listTransactions()` — server returns only that user's rows (includes WhatsApp bot transactions).

Admin / legacy: `GET /api/transactions` returns all users (dashboard).

### List card mapping (`TransactionCard`)

Implemented in `lib/api/transactionUi.ts` → `mapTransactionToCardItem()`.

| Backend field | UI meaning | French label on card |
|---|---|---|
| `type: expedition` | Service | **Expédition** (service pill) |
| `type: delivery` | Service | **Livraison** (service pill) |
| `type: pickup` | Service (legacy) | **Livraison** — old rows before `type` fix |
| `source: pickup` | Fulfillment | **Ramassage** (source pill) |
| `source: stock` | Fulfillment | **En stock** (source pill) |
| `source: pick_up` / `instocke` (legacy) | Fulfillment | Still mapped on read if present in old rows |
| `serviceLevel: express` | Speed | **Express** pill |
| `cash_collect` / `amount` | Cash to collect | Amount + **ESPÈCES** (hidden when not collecting) |
| `status: pending`, etc. | Status bucket | **En cours** / **Livré** / **Annulé** |
| `transactionReference` | Reference | `REF LVS-…` (no double `#`) |

**When `source` is null on GET** (current server behaviour): client fallbacks in order:

1. `description` starts with `Ramassage:` → Ramassage
2. Parsed `mode` from `parseTransaction()` (`pickup` → Ramassage, `stock` → En stock)
3. Legacy `type: pickup` → Ramassage + **Livraison** service label

**Recommendation:** backend should return `source` on GET list/detail so Ramassage vs En stock is authoritative.

## Open questions

- [ ] Return `source` and `created_at` on `GET /api/transactions` list items
