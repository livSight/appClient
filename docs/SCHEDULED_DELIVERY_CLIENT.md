# Livraison planifiée — app client

Implémentation mobile de [SCHEDULED_DELIVERY.md](../../backend/backend_core/docs/SCHEDULED_DELIVERY.md) (backend `backend_core`).

**Dernière mise à jour :** 2026-07-09

---

## Résumé

| Fonctionnalité | Fichiers clés |
|----------------|---------------|
| Date obligatoire à la création | `lib/scheduling/deliveryDate.ts`, `lib/api/transactions.ts`, `components/DeliveryDateField.tsx` |
| Parcours commande | `components/MaDemandeProduitsForm.tsx`, `app/resume-produit-*.tsx` |
| Confirmation | `app/confirmee.tsx` |
| Détail | `app/livraison-detail/[id].tsx`, `app/expedition-detail/[id].tsx` |
| Push | `lib/push/notificationRouting.ts` |

**Fuseau serveur :** `Africa/Douala` (`scheduling.timezone`). L’app utilise le même fuseau pour « aujourd’hui » via `Intl.DateTimeFormat`.

---

## Contrat API (client)

### POST `/api/transactions`

Champ **obligatoire** :

```json
{ "scheduled_delivery_date": "2026-07-12" }
```

| Date (Douala) | Statut initial backend |
|---------------|------------------------|
| Aujourd’hui | `pending` |
| Futur | `scheduled` |

L’app **ne doit pas** envoyer `status` à la création — le backend décide.

### GET (liste / détail)

Champs additionnels :

| Champ | Usage UI |
|-------|----------|
| `scheduled_delivery_date` | « Livraison prévue le … » |
| `delivery_attempt` | « Tentative n° … » si > 1 |
| `rescheduled_at` | Info agent (non affiché client v1) |
| `status: scheduled` | Badge **Planifiée** |

---

## Parcours utilisateur

1. **Formulaire** (`MaDemandeProduitsForm`) — sélecteur « Date de livraison » en tête de formulaire (livraison + expédition, stock + ramassage).
2. **Résumé** (`resume-produit-en-stock` / `resume-produit-ramasse`) — section DATE DE LIVRAISON.
3. **Confirmation** (`confirmee`) — sous-titre avec date formatée.
4. **Détail** — date planifiée + badge Planifiée + tentative si > 1.

---

## Annulation client

Aligné backend : seules les commandes **`pending`** sont annulables depuis l’app (`canClientCancelTransaction`).

Les commandes **`scheduled`** (date future) **ne sont pas annulables** côté client — l’agent peut utiliser **Renvoyer** (`POST /renvoyer`, hors scope app client).

---

## Notifications push

Types gérés par `notificationRouting.ts` :

| Type | Action |
|------|--------|
| `delivery_rescheduled` | Ouvre le détail transaction |
| `delivery_today_reminder` | Ouvre le détail transaction |

Les deux déclenchent aussi le refresh de la liste livraisons (`shouldRefreshLivraisonList`).

---

## Statuts UI

`mapTxnStatusToUi` :

| Backend | Bucket UI |
|---------|-----------|
| `scheduled` | Planifiée |
| `pending`, `processing`, … | En cours |
| `completed`, `delivered`, … | Livré |
| `failed`, `cancelled`, … | Annulé |

Filtre liste : onglet **Planifiée** dans `app/(tabs)/livraison.tsx`.

---

## Checklist QA manuelle

- [ ] Créer une livraison **aujourd’hui** → succès, confirmation affiche la date, détail sans badge Planifiée.
- [ ] Créer une livraison **demain** → succès, statut Planifiée au détail.
- [ ] Même test pour **expédition** stock et ramassage.
- [ ] Commande `scheduled` → pas de bouton annuler (ou message bloquant).
- [ ] Push `delivery_today_reminder` avec `transactionId` → navigation détail.
- [ ] Date passée refusée dans le picker (min = aujourd’hui Douala).

---

## Voir aussi

- [api-transactions.md](./api-transactions.md) — contrat multipart
- [DELIVERY_TRACKING_MOBILE.md](../../backend/backend_core/docs/DELIVERY_TRACKING_MOBILE.md) — spec mobile backend
