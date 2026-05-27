# LivSight — Spécification API Tarifs (Phase 1)

Objectif: rendre la page **Tarifs** dynamique depuis le backend/admin pour:
- Multi-villes
- Zones tarifaires par ville (prix, distance, ETA)
- Quartiers par zone (liste; le flag `requiresEntryFee` est déjà prévu pour la Phase 2)

Écrans app concernés:
- `/tarifs` → `app/tarifs.tsx`
- `/tarifs-zone/:zoneId` → `app/tarifs-zone/[zone].tsx`

> Phase 2 (plus tard): tarifs fixes (Express / Ramassage / Entrée quartier).

---

## Contraintes & conventions

- **Multi-villes**: toutes les routes “tarifs” doivent accepter un `cityId`.
- **Identifiants**: `cityId` est un ID (number ou string), `zoneId` est un ID unique d’une zone.
- **Monnaie**: les montants sont en **XAF** (entiers).
- **Tri**: zones triées par `sortOrder`. Quartiers triés alphabétique (ou `sortOrder` si ajouté plus tard).

---

## Modèle de données (DB) — Phase 1

### Table `cities`
- `id` (int/uuid)
- `name` (string) — ex: `Yaoundé`
- `country_code` (string) — ex: `CM`
- `label` (string) — ex: `Yaoundé, CM` (ou calculable)
- `active` (bool)

### Table `tariff_zones`
- `id`
- `city_id` (FK `cities.id`)
- `label` (string) — ex: `ZONE 1`
- `sort_order` (int)
- `price_xaf` (int)
- `distance_label` (string) — ex: `0 – 4 km`
- `eta_label` (string) — ex: `~30 min`
- `active` (bool)

### Table `neighborhoods`
- `id`
- `city_id` (FK `cities.id`)
- `zone_id` (FK `tariff_zones.id`)
- `name` (string) — ex: `Bastos`
- `active` (bool)
- `requires_entry_fee` (bool, default `false`) — **prévu Phase 2**

---

## Routes API (App) — Phase 1

### 1) GET `/api/cities`
Retourne la liste des villes.

**Response 200**
```json
{
  "success": true,
  "data": [
    { "id": 1, "label": "Yaoundé, CM", "active": true },
    { "id": 2, "label": "Douala, CM", "active": true }
  ]
}
```

---

### 2) GET `/api/tariffs/zones?cityId=1`
Retourne toutes les zones tarifaires d’une ville.

**Query params**
- `cityId` (required)

**Response 200**
```json
{
  "success": true,
  "data": {
    "city": { "id": 1, "label": "Yaoundé, CM" },
    "zones": [
      {
        "id": "1",
        "label": "ZONE 1",
        "priceXaf": 1000,
        "distanceLabel": "0 – 4 km",
        "etaLabel": "~30 min"
      },
      {
        "id": "2",
        "label": "ZONE 2",
        "priceXaf": 1500,
        "distanceLabel": "4 – 8 km",
        "etaLabel": "~45 min"
      }
    ]
  }
}
```

**Notes**
- Trier par `sort_order`.
- Filtrer `active=true` (zones).

---

### 3) GET `/api/tariffs/zones/:zoneId?cityId=1`
Retourne le détail d’une zone + ses quartiers.

**Path params**
- `zoneId` (required)

**Query params**
- `cityId` (required)

**Response 200**
```json
{
  "success": true,
  "data": {
    "zone": {
      "id": "1",
      "label": "ZONE 1",
      "priceXaf": 1000,
      "distanceLabel": "0 – 4 km",
      "etaLabel": "~30 min moyenne"
    },
    "neighborhoods": [
      { "id": "n1", "name": "Bastos", "requiresEntryFee": false },
      { "id": "n2", "name": "Centre-ville", "requiresEntryFee": false }
    ]
  }
}
```

**Notes**
- Filtrer `active=true` (quartiers).
- Le champ `requiresEntryFee` est **déjà là** pour la Phase 2.

---

## Admin routes (CRUD) — recommandées

### Cities
- `GET /api/admin/cities`
- `POST /api/admin/cities`
- `PUT /api/admin/cities/:id`
- `DELETE /api/admin/cities/:id` (optionnel)

### Zones
- `GET /api/admin/tariffs/zones?cityId=1`
- `POST /api/admin/tariffs/zones?cityId=1`
- `PUT /api/admin/tariffs/zones/:zoneId`
- `DELETE /api/admin/tariffs/zones/:zoneId` (optionnel)

### Quartiers
- `GET /api/admin/tariffs/neighborhoods?cityId=1&zoneId=:zoneId`
- `POST /api/admin/tariffs/neighborhoods?cityId=1&zoneId=:zoneId`
- `PUT /api/admin/tariffs/neighborhoods/:id`
- `DELETE /api/admin/tariffs/neighborhoods/:id` (optionnel)

---

## Validation (Phase 1)

- `cityId` obligatoire pour toutes les routes tarifs.
- `priceXaf >= 0`
- `label` non vide
- `distanceLabel` non vide
- `etaLabel` non vide

---

## Phase 2 (plus tard) — Tarifs fixes (aperçu)

On ajoutera des **surcharges fixes par ville**:
- Express
- Ramassage hors stock
- Entrée quartier (supplément fixe, conditionné par `requiresEntryFee`)

Exemple futur:
- `GET /api/tariffs/settings?cityId=1` → `{ expressXaf, pickupXaf, neighborhoodEntryXaf }`

