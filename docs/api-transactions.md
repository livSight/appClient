# Transactions API contract

Verified against `http://156.67.27.35:8085` (May 2026).

## Authentication

| Endpoint | Headers |
|---|---|
| `GET /api/transactions` | `Authorization: Bearer {accessToken}` |
| `POST /api/transactions` | `Authorization: Bearer {accessToken}` **and** `X-User-Id: {keycloakSub}` |
| `GET /api/transactions/:id` | `Authorization: Bearer {accessToken}` |

- `X-User-Id` must be the **Keycloak subject** (`JWT.sub`), e.g. `5785160a-6c5c-44d5-96fd-d28aa677d8d4`.
- Numeric app user id (`3`) in `X-User-Id` returns **404 User not found**.

## POST `/api/transactions` (multipart)

### Required parts

- All business fields (`package_name`, `description`, `destination_street`, `receiver_name`, `receiver_phone`, `type`, etc.)
- **`image`** — required. Server returns `Required part 'image' is not present.` without it.

When the UI has no photo yet, the app sends a bundled 1×1 PNG placeholder (`assets/images/placeholder-transaction.png`).

### `source` field

The Java backend enum `com.livSight.backend.model.enumerations.Source` **rejects** client strings such as:

- `instocke`
- `pick_up`
- `IN_STOCKE`, `PICK_UP`, etc.

Error example: `No enum constant com.livSight.backend.model.enumerations.Source.instocke`

**Workaround (Phase 12):** omit `source` on POST. Requests succeed with `type` set (`delivery`, `pickup`, `expedition`).

The app still keeps `source` in `TransactionRequest` for UI mapping (`instocke` → stock, `pick_up` → pickup).

### Success response

```json
{ "message": "Transaction created successfully" }
```

HTTP **200**

### Client implementation

- `lib/api/transactions.ts` — `buildTransactionFormData()`, `createTransaction()`
- `lib/api/transactionImage.ts` — placeholder image for multipart
- `resolveApiSourceField()` — returns `undefined` so `source` is not appended

## GET list behaviour

With a valid Bearer token, `GET /api/transactions` returns transactions for the authenticated user. No client-side `user_id` filter is needed.

## Open questions

- [ ] Exact `Source` enum constant names once backend documents or exposes them
- [ ] Whether `source` should be sent when enum mapping is confirmed
