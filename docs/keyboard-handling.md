# Keyboard handling — écran de messagerie

> **Document partagé — apps Agent, Client, Livreur.**
> La solution décrite ici est universelle React Native. Les références aux
> composants maison (tokens, `ScreenLayout`, etc.) sont propres à l'app Agent —
> voir la section 9 pour adapter à une autre app.

Ce document décrit comment implémenter un écran de chat style WhatsApp /
iMessage : header fixe, input collé au clavier, liste de messages ancrée en
bas, scroll automatique vers le dernier message.

---

## 1. Comportement attendu

- Le **header reste fixe** en haut.
- La **zone de saisie reste collée au clavier** lorsqu'il s'ouvre.
- La **liste des messages occupe tout l'espace** entre le header et l'input.
- Le **dernier message reste visible juste au-dessus de l'input** (jamais de
  grand vide entre le dernier message et la zone de saisie).
- **Scroll automatique** vers le bas à l'envoi d'un message et à l'ouverture
  du clavier.
- **Safe areas** respectées sur iOS et Android.

---

## 2. Vocabulaire (keyboard handling)

| Concept | Terme technique |
|---|---|
| L'input qui monte avec le clavier | Keyboard avoidance (`KeyboardAvoidingView`) |
| L'input collé au clavier | Sticky input / sticky footer |
| Messages collés en bas | Bottom-anchored content / pin-to-bottom |
| Défilement auto vers le dernier message | Auto-scroll to bottom |
| Liste affichée à l'envers | Inverted list (`FlatList inverted`) |
| Respect des encoches / barres système | Safe area insets |

---

## 3. Architecture finale

Le layout est composé manuellement dans `app/ticket/[transactionId].tsx`
(pas de `ScreenLayout` pour ce rendu — trop de contraintes avec `flex:1` et
le keyboard avoidance).

```
View (flex: 1, backgroundColor: white)
├── HeroGridBackground
└── KeyboardAvoidingView (flex: 1, behavior: "padding")
    ├── View (header — paddingTop = insets.top + screenPaddingX)
    ├── FlatList (flex: 1, inverted) — liste des messages
    └── View (footer — input + bouton envoyer)
```

---

## 4. Pourquoi FlatList inversée

### 4.1 Le problème des approches précédentes

Trois approches ont été testées et abandonnées :

**ScrollView + `flexGrow: 1` + `justifyContent: "flex-end"`**
— Le contenu est ancré en bas quand le clavier est fermé. Mais quand le
`KeyboardAvoidingView` réduit la `ScrollView`, le layout ne se recalcule pas
correctement : la position de scroll reste à zéro, laissant un grand vide
blanc entre les messages et l'input.

**`KeyboardAvoidingView` de `react-native-keyboard-controller`**
— Anime via Reanimated (thread UI), ce qui bypass le système de layout de
React Native (Yoga). La `ScrollView` ne "sait" pas qu'elle a rétréci — même
`scrollToEnd` ne corrige pas le problème car il scroll vers l'ancienne hauteur.

**`scrollToEnd` sur `keyboardWillShow`**
— Traite le symptôme (position de scroll) mais pas la cause (layout qui ne
se recalcule pas). Fragile et timing-dépendant.

### 4.2 La solution : FlatList inversée

La FlatList inversée est la méthode standard des apps de chat (WhatsApp,
iMessage, Telegram, Signal). Elle résout tous ces problèmes structurellement :

- `inverted={true}` — retourne la liste visuellement.
- `data={[...messages].reverse()}` — les messages sont passés du plus récent
  au plus ancien. La FlatList les affiche du plus ancien (haut) au plus récent
  (bas).
- Quand le clavier s'ouvre et que la FlatList rétrécit, le message le plus
  récent (index 0 dans la data) reste naturellement visible en bas — aucun
  `scrollToEnd` nécessaire.
- Le `KeyboardAvoidingView` natif (`behavior: "padding"`) fonctionne
  correctement avec la FlatList car la hauteur change via le système de layout
  de React Native (pas Reanimated).

---

## 5. Détails d'implémentation

### 5.1 FlatList

```tsx
const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

<FlatList
  data={reversedMessages}
  inverted
  keyExtractor={(item, index) => String(item.id ?? index)}
  renderItem={({ item }) => <Bubble msg={item} currentUserId={userId} />}
  ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
  contentContainerStyle={{
    paddingHorizontal: spacing.screenPaddingX,
    paddingVertical: 8,
  }}
  keyboardShouldPersistTaps="handled"
  showsVerticalScrollIndicator={false}
  style={{ flex: 1 }}
/>
```

### 5.2 KeyboardAvoidingView

```tsx
<KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
```

- `behavior="padding"` — ajoute du padding en bas quand le clavier s'ouvre.
  Fonctionne via le système de layout RN, pas Reanimated.
- Importé depuis `react-native` (pas `react-native-keyboard-controller`).
- Pas de `keyboardVerticalOffset` — le KAV démarre à y=0, offset inutile.

### 5.3 Safe areas

```tsx
const insets = useSafeAreaInsets();
const topPadding = Math.max(spacing.screenPaddingX, insets.top + spacing.screenPaddingX);

// Header
<View style={{ paddingTop: topPadding, ... }}>

// Footer
<View style={{ paddingBottom: Math.max(24, insets.bottom + 8) }}>
```

### 5.4 États vides et chargement

Rendus en dehors de la FlatList pour éviter les problèmes d'inversion du
`ListEmptyComponent` :

```tsx
{showShimmer ? (
  <View style={{ flex: 1, justifyContent: "flex-end", ... }}>
    <CardShimmer lines={2} />
    <CardShimmer lines={2} />
  </View>
) : messages.length === 0 ? (
  <View style={{ flex: 1, justifyContent: "center", ... }}>
    <EmptyStateCard ... />
  </View>
) : (
  <FlatList inverted ... />
)}
```

---

## 6. `react-native-keyboard-controller` — statut

Le package est installé (`^1.21.11`) et le `KeyboardProvider` enveloppe la
navigation dans `app/_layout.tsx`. Il est disponible pour d'autres usages
(ex: `useKeyboardHandler`, `KeyboardStickyView`).

Le `KeyboardAvoidingView` de cette librairie **n'est pas utilisé** dans l'écran
de chat — il bypasse le layout engine de RN via Reanimated, ce qui cause des
problèmes avec `flex: 1` et la position de scroll.

---

## 7. Comment vérifier

1. **Peu de messages** — le dernier message doit être juste au-dessus de l'input,
   clavier ouvert ou fermé. Aucun vide.
2. **Beaucoup de messages** — scroll fluide vers le haut pour voir l'historique ;
   le plus récent reste en bas à l'ouverture du clavier.
3. **Envoi** — le nouveau message apparaît immédiatement en bas.
4. **iOS et Android** — vérifier les deux.

Checklist :

- [ ] Header fixe en haut
- [ ] Input collé au clavier
- [ ] Dernier message juste au-dessus de l'input (pas de vide)
- [ ] Scroll fluide vers le haut (historique)
- [ ] Nouveau message visible à l'envoi

---

## 8. Fichiers concernés (app Agent)

- `app/ticket/[transactionId].tsx` — écran de chat (layout manuel + FlatList inversée).
- `components/ScreenLayout.tsx` — layout générique (non utilisé pour le rendu principal du chat).
- `app/_layout.tsx` — `KeyboardProvider` de `react-native-keyboard-controller`.

---

## 9. Guide d'implémentation — nouvelle app

Cette section permet de reproduire la solution from scratch dans n'importe
quelle app React Native (Client, Livreur, ou autre).

### 9.1 Dépendances

| Package | Obligatoire | Rôle |
|---|---|---|
| `react-native-safe-area-context` | ✅ | `useSafeAreaInsets` pour les encoches |
| `react-native-keyboard-controller` | Recommandé | `KeyboardProvider` au root (améliore les hooks clavier) |
| `react-native` (natif) | ✅ | `KeyboardAvoidingView`, `FlatList` — pas de lib externe |

Installer :
```bash
npx expo install react-native-safe-area-context react-native-keyboard-controller
```

Envelopper la navigation dans `app/_layout.tsx` :
```tsx
import { KeyboardProvider } from "react-native-keyboard-controller";

// Dans le layout racine :
<KeyboardProvider>
  <Stack screenOptions={{ headerShown: false }} />
</KeyboardProvider>
```

### 9.2 Template générique (sans composants maison)

Copier-coller ce squelette et remplacer les `TODO` :

```tsx
import { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// TODO : remplacer par le type de message de l'app
type Message = { id: number | string; content: string; senderId: number };

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState("");

  // TODO : remplacer par les vraies données
  const messages: Message[] = [];
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const topPadding = insets.top + 16;          // 16 = padding vertical du header
  const bottomPadding = Math.max(24, insets.bottom + 8);

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">

        {/* HEADER — fixe en haut */}
        <View style={{ paddingTop: topPadding, paddingHorizontal: 16 }}>
          {/* TODO : contenu du header (titre, bouton retour, etc.) */}
        </View>

        {/* LISTE DES MESSAGES — ou état vide */}
        {messages.length === 0 ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#999" }}>Aucun message</Text>
          </View>
        ) : (
          <FlatList
            data={reversedMessages}
            inverted
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              // TODO : remplacer par le composant de bulle de message
              <View style={{ padding: 8 }}>
                <Text>{item.content}</Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
          />
        )}

        {/* FOOTER — input collé au clavier */}
        <View style={{ paddingHorizontal: 16, paddingBottom: bottomPadding }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Écrire un message..."
              style={{ flex: 1, borderWidth: 1, borderColor: "#ddd", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 }}
            />
            <Pressable
              onPress={() => { /* TODO : envoyer */ setDraft(""); }}
              style={{ backgroundColor: "#0EA5E9", borderRadius: 20, padding: 10 }}
            >
              <Text style={{ color: "#fff" }}>Envoyer</Text>
            </Pressable>
          </View>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}
```

### 9.3 Variables à adapter par app

| Élément | App Agent | À remplacer par |
|---|---|---|
| Couleur de fond | `colors.white` | La couleur de fond de l'app |
| Padding horizontal | `spacing.screenPaddingX` (24) | La valeur de padding de l'app |
| Composant message | `<Bubble>` | Le composant bulle de l'app |
| Composant input | `<AppTextInput>` | `<TextInput>` natif ou équivalent |
| Bouton envoi | `<MorphingButton>` | `<Pressable>` + style |
| État vide | `<EmptyStateCard>` | Un composant texte simple |
| État chargement | `<CardShimmer>` | `<ActivityIndicator>` ou skeleton |
| Background décoratif | `<HeroGridBackground>` | Supprimer ou remplacer |

### 9.4 Anti-patterns à ne pas reproduire

> ⛔ **Ne pas utiliser `ScrollView` + `flexGrow: 1` + `justifyContent: "flex-end"`**
> Quand le KAV réduit la ScrollView, le layout ne se recalcule pas — grand
> vide blanc entre les messages et l'input.

> ⛔ **Ne pas utiliser le `KeyboardAvoidingView` de `react-native-keyboard-controller`**
> Il anime via Reanimated (thread UI) et bypasse le layout engine React Native.
> La ScrollView/FlatList ne "sait" pas qu'elle a rétréci.

> ⛔ **Ne pas utiliser `scrollToEnd` sur `keyboardWillShow` comme seul fix**
> C'est un patch du symptôme, pas de la cause. Fragile et timing-dépendant.

> ⛔ **Ne pas mettre l'état vide dans `ListEmptyComponent` d'une FlatList `inverted`**
> Le composant s'affiche à l'envers. Gérer les états vides/chargement en
> dehors de la FlatList avec un conditionnel.
