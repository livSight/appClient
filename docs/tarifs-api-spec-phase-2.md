# LivSight — Spécification API Tarifs (Phase 2)

Objectif: rendre dynamiques **les tarifs fixes (surcharges)** par ville (Express / Ramassage / Entrée quartier).

Pré-requis: **Phase 1** livrée (villes + zones + quartiers) — voir `docs/tarifs-api-spec-phase-1.md`.



---

## 1) User story (Phase 2)

### En tant que…
Admin / Super Admin (depuis le dashboard).

### Je veux…
Configurer, **par ville**, les surcharges fixes:
- Livraison **Express** (ex: `+1000 XAF`)
- **Ramassage hors stock** (ex: `+500 XAF`)
- **Entrée quartier** (ex: `+500 XAF`)

Le dashboard ne gère **que les montants** (pas de tarif/flag par quartier).

### Afin de…
- ajuster la tarification sans publier une nouvelle version de l’app
- garder une tarification cohérente par ville
- appliquer automatiquement les surcharges selon le service et la destination

---

## 2) Données (DB) — Phase 2

### Table `tariff_settings` (par ville)
1 enregistrement par `city_id`.

- `city_id` (FK `cities.id`, unique)
- `express_xaf` (int, default 0)
- `pickup_xaf` (int, default 0) — ramassage hors stock
- `neighborhood_entry_xaf` (int, default 0)
- `updated_at` (timestamp)
- `updated_by` (nullable)

> Remarque: “entrée quartier” est une **surcharge fixe** par ville. Il n’y a **pas** de montant par quartier.

---

## 3) Règles métier (calcul / application)

Quand une commande/livraison est tarifée:

- `totalFeeXaf = zone.priceXaf`
- Si `express === true` → `totalFeeXaf += settings.express_xaf`
- Si `mode === "pickup_outside_stock"` (ou équivalent) → `totalFeeXaf += settings.pickup_xaf`
- Si `applyNeighborhoodEntryFee === true` (ou équivalent) → `totalFeeXaf += settings.neighborhood_entry_xaf`

### Acceptance criteria
- Les surcharges doivent être `>= 0`.
- Si un setting est absent, le backend doit renvoyer `0` (pas `null`) pour éviter un comportement ambigu côté app.
- “Entrée quartier” ne s’applique **que** si l’option métier `applyNeighborhoodEntryFee` (ou équivalent) est vraie.

---

## 4) Routes API (App) — Phase 2

### Option A (recommandée): un endpoint unique “tariffs”
Retourne tout le nécessaire en 1 call (zones + settings + autres tarifs).

#### GET `/api/tariffs?cityId=1`
**Query params**
- `cityId` (required)

**Response 200**
```json
{
  "success": true,
  "data": {
    "city": { "id": 1, "label": "Yaoundé, CM" },
    "settings": {
      "expressXaf": 1000,
      "pickupXaf": 500,
      "neighborhoodEntryXaf": 500
    },
    "zones": [
      { "id": "1", "label": "ZONE 1", "priceXaf": 1000, "distanceLabel": "0 – 4 km", "etaLabel": "~30 min" }
    ]
  }
}
```

### Option B: endpoint dédié “settings”
Utile si vous gardez Phase 1 telle quelle et ajoutez un call pour les settings.

#### GET `/api/tariffs/settings?cityId=1`
**Response 200**
```json
{
  "success": true,
  "data": {
    "cityId": 1,
    "expressXaf": 1000,
    "pickupXaf": 500,
    "neighborhoodEntryXaf": 500
  }
}
```

---

## 5) Admin routes (CRUD) — Phase 2

### Settings / surcharges (par ville)
- `GET /api/admin/tariffs/settings?cityId=1`
- `PUT /api/admin/tariffs/settings?cityId=1`

**Body (PUT)**
```json
{
  "expressXaf": 1000,
  "pickupXaf": 500,
  "neighborhoodEntryXaf": 500
}
```

---

## 6) Affichage côté app (UI)

Sur l’écran **Tarifs** (`app/tarifs.tsx`), l’app doit afficher dynamiquement:
- “Livraison express” → `+ expressXaf`
- “Ramassage hors stock” → `pickupXaf`
- “Frais de quartier” → `+ neighborhoodEntryXaf`
 
