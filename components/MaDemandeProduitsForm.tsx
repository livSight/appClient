import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search, PackageOpen, Hand, Hash, Wallet, Camera, X } from "lucide-react-native";
import ScreenLayout from "./ScreenLayout";
import AppText from "./AppText";
import AppTextInput from "./AppTextInput";
import ExpressToggleCard from "./ExpressToggleCard";
import FormInput from "./FormInput";
import FormButton from "./FormButton";
import { colors, fonts, radii, typography } from "../theme/tokens";
import {
  parseExpeditionClient,
  SERVICE_EXPEDITION,
  stringifyExpeditionClient,
} from "@/lib/expeditionClient";
import { hapticSuccess } from "@/lib/haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

export type MaDemandeProduitsFlow = "livraison" | "expedition";

type Mode = "stock" | "pickup";

const INPUT_BG = "#F3F4F5";
const INPUT_RADIUS = 24;
const PH = "rgba(60,74,60,0.4)";

function RamassageFieldLabel({ children }: { children: string }) {
  return (
    <AppText
      style={{
        fontSize: 14,
        lineHeight: 20,
        fontFamily: fonts.bodySemi,
        color: colors.text,
        marginBottom: 8,
      }}
      numberOfLines={2}
    >
      {children}
    </AppText>
  );
}

function PhotoPicker({
  label,
  uri,
  onChangeUri,
  required,
}: {
  label: string;
  uri: string | null;
  onChangeUri: (next: string | null) => void;
  required?: boolean;
}) {
  return (
    <View style={{ marginTop: 14 }}>
      <RamassageFieldLabel>{required ? label : `${label} (optionnel)`}</RamassageFieldLabel>
      {uri ? (
        <View style={{ borderRadius: 16, backgroundColor: colors.white, overflow: "hidden", borderWidth: 1, borderColor: "rgba(187,203,184,0.20)" }}>
          <Image source={{ uri }} style={{ width: "100%", height: 180 }} contentFit="cover" />
          <Pressable
            onPress={() => onChangeUri(null)}
            hitSlop={10}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 36,
              height: 36,
              borderRadius: radii.pill,
              backgroundColor: "rgba(15,23,42,0.65)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={colors.white} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) return;
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (res.canceled) return;
            const nextUri = res.assets?.[0]?.uri;
            if (typeof nextUri === "string" && nextUri.length > 0) onChangeUri(nextUri);
          }}
          style={{
            minHeight: 88,
            borderRadius: 16,
            borderWidth: 2,
            borderStyle: "dashed",
            borderColor: "rgba(187,203,184,0.35)",
            backgroundColor: colors.white,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 18,
            paddingHorizontal: 16,
            gap: 10,
          }}
        >
          <Camera size={22} color={"rgba(60,74,60,0.55)"} />
          <AppText variant="dense" style={{ fontSize: 13, lineHeight: 18, fontFamily: fonts.bodySemi, color: "rgba(60,74,60,0.75)" }} numberOfLines={2}>
            Ajouter une photo
          </AppText>
        </Pressable>
      )}
    </View>
  );
}

type InventoryItem = {
  id: string;
  name: string;
  stockLabel: string;
  stockAvailable: number;
};

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "paper-a4", name: "Papier A4 (80g)", stockLabel: "STOCK: 45 RAMES", stockAvailable: 45 },
  { id: "markers", name: "Set Marqueurs (x12)", stockLabel: "STOCK: 12 SETS", stockAvailable: 12 },
  { id: "folders", name: "Classeurs Rigides", stockLabel: "STOCK: 28 UNITÉS", stockAvailable: 28 },
];

const YAOUNDE_QUARTIERS = [
  "Bastos",
  "Mvan",
  "Emombo",
  "Nlongkak",
  "Essos",
  "Ekounou",
  "Mokolo",
  "Nkoldongo",
] as const;

function parseXaf(input: string): number {
  const cleaned = input.replace(/[^\d]/g, "");
  const n = cleaned.length ? Number(cleaned) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function ModeCard({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}) {
  const Icon = icon;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 103,
        borderRadius: 24,
        backgroundColor: active ? "#297FC6" : colors.white,
        borderWidth: active ? 0 : 1,
        borderColor: active ? "transparent" : "rgba(187,203,184,0.20)",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
      }}
    >
      <Icon size={22} color={active ? colors.white : colors.muted} />
      <AppText
        style={{
          marginTop: 10,
          fontSize: 14,
          lineHeight: 20,
          fontFamily: active ? fonts.bodyBold : fonts.bodySemi,
          color: active ? colors.white : colors.muted,
          letterSpacing: 0.35,
        }}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {label}
      </AppText>
    </Pressable>
  );
}

type FormProps = {
  flow: MaDemandeProduitsFlow;
};

export default function MaDemandeProduitsForm({ flow }: FormProps) {
  const isExpedition = flow === "expedition";
  const screenTitle = isExpedition ? "Ma demande d'expédition" : "Ma demande de livraison";

  const { quartier: quartierParam, mode: modeParam, expeditionClient: expeditionClientRaw } = useLocalSearchParams<{
    quartier?: string;
    mode?: Mode;
    expeditionClient?: string;
  }>();

  const quartier = typeof quartierParam === "string" ? quartierParam : "";
  const initialMode: Mode = modeParam === "pickup" ? "pickup" : "stock";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [pickupName, setPickupName] = useState("");
  const [pickupQty, setPickupQty] = useState("1");
  const [pickupExpress, setPickupExpress] = useState<"yes" | "no">("no");
  const [pickupCollectCash, setPickupCollectCash] = useState<"yes" | "no">("no");
  const [pickupAmount, setPickupAmount] = useState("");
  const [pickupPhone, setPickupPhone] = useState("");
  const [pickupPickupQuartierQuery, setPickupPickupQuartierQuery] = useState("");
  const [pickupPickupLandmark, setPickupPickupLandmark] = useState("");
  const [pickupDropoffQuartierQuery, setPickupDropoffQuartierQuery] = useState("");
  const [pickupDropoffLandmark, setPickupDropoffLandmark] = useState("");
  const [pickupPhotoUri, setPickupPhotoUri] = useState<string | null>(null);

  const [expVille, setExpVille] = useState(() => (typeof quartierParam === "string" ? quartierParam.trim() : ""));
  const [expAgence, setExpAgence] = useState("");
  const [expPickupAddress, setExpPickupAddress] = useState("");
  const [expNomDestinataire, setExpNomDestinataire] = useState(() =>
    parseExpeditionClient(typeof expeditionClientRaw === "string" ? expeditionClientRaw : undefined)?.clientName ?? ""
  );
  const [expTelephoneDestinataire, setExpTelephoneDestinataire] = useState(() =>
    parseExpeditionClient(typeof expeditionClientRaw === "string" ? expeditionClientRaw : undefined)?.phone ?? ""
  );

  const [expStockSearch, setExpStockSearch] = useState("");
  const [expStockOpen, setExpStockOpen] = useState(false);
  const [expSelectedStockItemId, setExpSelectedStockItemId] = useState<string | null>(null);
  const [expStockQty, setExpStockQty] = useState("1");

  const [livStockSearch, setLivStockSearch] = useState("");
  const [livStockOpen, setLivStockOpen] = useState(false);
  const [livSelectedStockItemId, setLivSelectedStockItemId] = useState<string | null>(null);
  const [livStockQty, setLivStockQty] = useState("1");
  const [livPhone, setLivPhone] = useState("");
  const [livQuartierQuery, setLivQuartierQuery] = useState("");
  const [livQuartierOpen, setLivQuartierOpen] = useState(false);
  const [livSelectedQuartier, setLivSelectedQuartier] = useState<string | null>(null);
  const [livDeliveryLandmark, setLivDeliveryLandmark] = useState("");
  const [livPhotoUri, setLivPhotoUri] = useState<string | null>(null);
  const [livNotes, setLivNotes] = useState("");
  const [livExpress, setLivExpress] = useState<"yes" | "no">("no");
  const [livCollectCash, setLivCollectCash] = useState<"yes" | "no">("no");
  const [livAmountDueText, setLivAmountDueText] = useState("");

  const expFilteredStock = useMemo(() => {
    const q = expStockSearch.trim().toLowerCase();
    if (!q) return MOCK_INVENTORY;
    return MOCK_INVENTORY.filter((it) => it.name.toLowerCase().includes(q));
  }, [expStockSearch]);

  const expSelectedStockItem = useMemo(() => {
    if (!expSelectedStockItemId) return null;
    return MOCK_INVENTORY.find((it) => it.id === expSelectedStockItemId) ?? null;
  }, [expSelectedStockItemId]);

  const livFilteredStock = useMemo(() => {
    const q = livStockSearch.trim().toLowerCase();
    if (!q) return MOCK_INVENTORY;
    return MOCK_INVENTORY.filter((it) => it.name.toLowerCase().includes(q));
  }, [livStockSearch]);

  const livSelectedStockItem = useMemo(() => {
    if (!livSelectedStockItemId) return null;
    return MOCK_INVENTORY.find((it) => it.id === livSelectedStockItemId) ?? null;
  }, [livSelectedStockItemId]);

  const livStockAvailable = livSelectedStockItem?.stockAvailable ?? 0;
  const livOutOfStock = Boolean(livSelectedStockItem) && livStockAvailable <= 0;

  const livFilteredQuartiers = useMemo(() => {
    const q = livQuartierQuery.trim().toLowerCase();
    if (!q) return YAOUNDE_QUARTIERS as readonly string[];
    return (YAOUNDE_QUARTIERS as readonly string[]).filter((it) => it.toLowerCase().includes(q));
  }, [livQuartierQuery]);

  const livNeedsCashAmount = livCollectCash === "yes";

  const livAmountDue = useMemo(() => {
    const cleaned = livAmountDueText.replace(/[^\d.,]/g, "").replace(",", ".");
    const n = cleaned.length ? Number(cleaned) : NaN;
    return Number.isFinite(n) ? n : NaN;
  }, [livAmountDueText]);
  const canContinuePickup = useMemo(() => {
    if (isExpedition) {
      const q = parseXaf(expStockQty);
      return (
        (mode !== "stock" || q > 0) &&
        expVille.trim().length > 0 &&
        expAgence.trim().length > 0 &&
        (mode !== "pickup" || expPickupAddress.trim().length > 0) &&
        expNomDestinataire.trim().length > 0 &&
        expTelephoneDestinataire.trim().length > 0
      );
    }
    if (mode === "stock") {
      const q = parseXaf(livStockQty);
      const hasQty = q > 0;
      const hasStock = Boolean(livSelectedStockItem);
      const stockOk = !livOutOfStock;
      const phoneOk = livPhone.trim().length > 0;
      const addressOk = Boolean(livSelectedQuartier && livSelectedQuartier.trim().length > 0);
      if (!hasQty || !hasStock || !stockOk || !phoneOk || !addressOk) return false;
      if (!livNeedsCashAmount) return true;
      return Number.isFinite(livAmountDue) && livAmountDue > 0;
    }
    const baseOk =
      pickupName.trim().length > 0 &&
      parseXaf(pickupQty) > 0 &&
      pickupPhone.trim().length > 0 &&
      pickupPickupQuartierQuery.trim().length > 0 &&
      pickupPickupLandmark.trim().length > 0 &&
      pickupDropoffQuartierQuery.trim().length > 0 &&
      pickupDropoffLandmark.trim().length > 0;
    if (!baseOk) return false;
    if (pickupCollectCash === "no") return true;
    return parseXaf(pickupAmount) > 0;
  }, [
    isExpedition,
    mode,
    expVille,
    expAgence,
    expPickupAddress,
    expNomDestinataire,
    expTelephoneDestinataire,
    expStockQty,
    livSelectedStockItem,
    livOutOfStock,
    livStockQty,
    livPhone,
    livSelectedQuartier,
    livNeedsCashAmount,
    livAmountDue,
    pickupName,
    pickupQty,
    pickupPhone,
    pickupPickupQuartierQuery,
    pickupPickupLandmark,
    pickupDropoffQuartierQuery,
    pickupDropoffLandmark,
    pickupCollectCash,
    pickupAmount,
  ]);

  return (
    <ScreenLayout
      header={
        <View style={{ paddingBottom: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", minHeight: 44 }}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 44, height: 44, justifyContent: "center", marginRight: 10 }}>
              <ArrowLeft size={22} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <AppText style={{ ...typography.screenTitle, fontSize: 26, lineHeight: 30 }} numberOfLines={2} ellipsizeMode="tail">
                {screenTitle}
              </AppText>
            </View>
          </View>

          <AppText
            variant="dense"
            style={{
              marginTop: 14,
              fontSize: 10,
              lineHeight: 15,
              fontFamily: fonts.bodyBold,
              color: "rgba(60,74,60,0.7)",
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {isExpedition ? "SOURCE DU COLIS (STOCK OU RAMASSAGE)" : "CHOISIR OÙ RÉCUPÉRER LE COLIS À LIVRER"}
          </AppText>

          {!isExpedition ? (
            <View style={{ marginTop: 12, flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1, minWidth: 0, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: "rgba(41,127,198,0.12)", borderWidth: 1, borderColor: "rgba(41,127,198,0.18)", alignItems: "center", justifyContent: "center" }}>
                <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary, letterSpacing: 0.6 }} numberOfLines={1}>
                  1 DÉTAILS
                </AppText>
              </View>
              <View style={{ flex: 1, minWidth: 0, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" }}>
                <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: "#6B7280", letterSpacing: 0.6 }} numberOfLines={1}>
                  2 LIVRAISON
                </AppText>
              </View>
              <View style={{ flex: 1, minWidth: 0, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: "#E5E7EB", alignItems: "center", justifyContent: "center" }}>
                <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: "#6B7280", letterSpacing: 0.6 }} numberOfLines={1}>
                  3 CONFIRMATION
                </AppText>
              </View>
            </View>
          ) : null}

          <View style={{ marginTop: 14, flexDirection: "row", gap: 16 }}>
            <ModeCard label="Ramassage" active={mode === "pickup"} onPress={() => setMode("pickup")} icon={Hand} />
            <ModeCard label="Colis en stock" active={mode === "stock"} onPress={() => setMode("stock")} icon={PackageOpen} />
          </View>
        </View>
      }
      footer={
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: "#EDEEEF",
            backgroundColor: "rgba(255,255,255,0.95)",
            paddingHorizontal: 24,
            paddingTop: 14,
            paddingBottom: 28,
          }}
        >
          <FormButton
            label="Continuer"
            disabled={!canContinuePickup}
            onPress={async () => {
              await hapticSuccess();
              if (mode === "stock" && isExpedition) {
                const chosen = expSelectedStockItem;
                const q = Math.max(0, Math.floor(parseXaf(expStockQty)));
                const itemsOne = chosen && q > 0 ? JSON.stringify([{ id: chosen.id, name: chosen.name, qty: q }]) : "[]";
                const expeditionClient = stringifyExpeditionClient({
                  clientName: expNomDestinataire.trim(),
                  phone: expTelephoneDestinataire.trim(),
                  address: [expVille.trim(), expAgence.trim()].filter(Boolean).join(" — ") || quartier.trim(),
                  notes: "",
                });
                router.push({
                  pathname: "/resume-produit-en-stock",
                  params: {
                    quartier: expVille.trim(),
                    selectedItems: itemsOne,
                    phone: expTelephoneDestinataire.trim(),
                    notes: "",
                    express: "no",
                    collectCash: "no",
                    amountDueText: "",
                    service: SERVICE_EXPEDITION,
                    expeditionClient,
                  },
                });
                return;
              }

              if (mode === "pickup" && isExpedition) {
                const pickupAddressCombined = [expAgence.trim(), expPickupAddress.trim()].filter(Boolean).join(" — ");
                const expeditionPickupParams = {
                  service: SERVICE_EXPEDITION,
                  expeditionClient: stringifyExpeditionClient({
                    clientName: expNomDestinataire.trim(),
                    phone: expTelephoneDestinataire.trim(),
                    address: [expVille.trim(), pickupAddressCombined].filter(Boolean).join(" — "),
                    notes: "",
                  }),
                };
                router.push({
                  pathname: "/resume-produit-ramasse",
                  params: {
                    quartier: expVille.trim(),
                    pickupName: expNomDestinataire.trim(),
                    pickupAddress: pickupAddressCombined,
                    pickupQty: "1",
                    pickupExpress: "no",
                    pickupCollectCash: "no",
                    pickupAmount: "",
                    pickupPhone: expTelephoneDestinataire.trim(),
                    ...expeditionPickupParams,
                  },
                });
                return;
              }

              if (mode === "stock" && !isExpedition) {
                const chosen = livSelectedStockItem;
                const q = Math.max(0, Math.floor(parseXaf(livStockQty)));
                const selectedItemsOne = chosen && q > 0 ? JSON.stringify([{ id: chosen.id, name: chosen.name, qty: q }]) : "[]";
              const deliveryQuartier = (livSelectedQuartier ?? livQuartierQuery).trim();
              const deliveryLandmark = livDeliveryLandmark.trim();
              const deliveryAddress = [deliveryQuartier, deliveryLandmark].filter(Boolean).join(" — ");
                router.push({
                  pathname: "/resume-produit-en-stock",
                  params: {
                  quartier,
                  deliveryAddress,
                  deliveryQuartier,
                  deliveryLandmark,
                    selectedItems: selectedItemsOne,
                    phone: livPhone.trim(),
                    notes: livNotes.trim(),
                    express: livExpress,
                    collectCash: livCollectCash,
                    amountDueText: livNeedsCashAmount ? livAmountDueText : "",
                  },
                });
                return;
              }

              if (mode === "pickup") {
                const pickupQuartier = pickupPickupQuartierQuery.trim();
                const pickupLandmark = pickupPickupLandmark.trim();
                const pickupAddress = [pickupQuartier, pickupLandmark].filter(Boolean).join(" — ");

                const dropoffQuartier = pickupDropoffQuartierQuery.trim();
                const dropoffLandmark = pickupDropoffLandmark.trim();
                const deliveryAddress = [dropoffQuartier, dropoffLandmark].filter(Boolean).join(" — ");

                router.push({
                  pathname: "/resume-produit-ramasse",
                  params: {
                    quartier,
                    deliveryAddress,
                    pickupAddress,
                    pickupName,
                    pickupQty,
                    pickupExpress,
                    pickupCollectCash,
                    pickupAmount,
                    pickupPhone,
                    pickupPickupQuartier: pickupQuartier,
                    pickupPickupLandmark: pickupLandmark,
                    pickupDropoffQuartier: dropoffQuartier,
                    pickupDropoffLandmark: dropoffLandmark,
                    pickupPhotoUri,
                  },
                });
              }
            }}
          />
          {!canContinuePickup ? (
            <AppText
              variant="dense"
              style={{ marginTop: 8, textAlign: "center", fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.5)" }}
              numberOfLines={2}
            >
              Complétez tous les champs obligatoires pour continuer
            </AppText>
          ) : null}
        </View>
      }
    >

      {mode === "stock" ? (
        isExpedition ? (
          <View style={{ marginTop: 22, gap: 20 }}>
            <View>
              <RamassageFieldLabel>Colis en stock</RamassageFieldLabel>
              <View
                style={{
                  minHeight: 56,
                  borderRadius: INPUT_RADIUS,
                  backgroundColor: INPUT_BG,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Search size={18} color={"rgba(60,74,60,0.45)"} />
                <AppTextInput
                  value={expStockSearch}
                  onChangeText={(t) => {
                    setExpStockSearch(t);
                    setExpStockOpen(true);
                  }}
                  onFocus={() => setExpStockOpen(true)}
                  onBlur={() => setTimeout(() => setExpStockOpen(false), 150)}
                  placeholder="Rechercher un colis en stock..."
                  placeholderTextColor={PH}
                  style={{ ...typography.bodyRegular, fontSize: 14, lineHeight: 20, flex: 1, color: colors.text }}
                />
              </View>

              {expSelectedStockItem ? (
                <View style={{ marginTop: 10, borderRadius: 16, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                    {expSelectedStockItem.name}
                  </AppText>
                  <AppText variant="dense" style={{ marginTop: 4, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.7)" }} numberOfLines={1}>
                    {expSelectedStockItem.stockLabel}
                  </AppText>
                </View>
              ) : null}

              {expStockOpen ? (
                <View
                  style={{
                    marginTop: 10,
                    borderRadius: 16,
                    backgroundColor: colors.white,
                    borderWidth: 1,
                    borderColor: "rgba(187,203,184,0.20)",
                    overflow: "hidden",
                  }}
                >
                  {expFilteredStock.slice(0, 6).map((it) => (
                    <Pressable
                      key={it.id}
                      onPress={() => {
                        setExpSelectedStockItemId(it.id);
                        setExpStockSearch(it.name);
                        setExpStockOpen(false);
                      }}
                      style={{
                        minHeight: 52,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(237,238,239,0.9)",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View style={{ width: 36, height: 36, borderRadius: 14, backgroundColor: "#EDEEEF", alignItems: "center", justifyContent: "center" }}>
                        <PackageOpen size={16} color={"rgba(25,28,29,0.75)"} />
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                          {it.name}
                        </AppText>
                        <AppText variant="dense" style={{ marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.65)" }} numberOfLines={1}>
                          {it.stockLabel}
                        </AppText>
                      </View>
                    </Pressable>
                  ))}
                  {expFilteredStock.length === 0 ? (
                    <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
                      <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.65)" }} numberOfLines={2}>
                        Aucun colis trouvé.
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <FormInput label="Quantité" keyboardType="number-pad" value={expStockQty} onChangeText={(t) => setExpStockQty(t.replace(/[^\d]/g, ""))} placeholder="1" />
            <FormInput label="Ville de l'expédition" value={expVille} onChangeText={setExpVille} placeholder="Ex. Douala" />
            <FormInput label="Agence de l'expédition" value={expAgence} onChangeText={setExpAgence} placeholder="Ex. Agence Liv Sight" />
            <FormInput label="Adresse de ramassage" value={expPickupAddress} onChangeText={setExpPickupAddress} placeholder="Ex. Rue, repère, quartier…" />
            <FormInput label="Nom du destinataire" value={expNomDestinataire} onChangeText={setExpNomDestinataire} placeholder="Nom complet" autoCapitalize="words" />
            <FormInput label="Numéro de téléphone du destinataire" keyboardType="phone-pad" value={expTelephoneDestinataire} onChangeText={setExpTelephoneDestinataire} placeholder="6XXXXXX" />
          </View>
        ) : (
          <>
            <View style={{ marginTop: 22, gap: 20 }}>
              <View>
                <RamassageFieldLabel>Sélectionner un produit</RamassageFieldLabel>
                <View
                  style={{
                    minHeight: 56,
                    borderRadius: INPUT_RADIUS,
                    backgroundColor: INPUT_BG,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Search size={18} color={"rgba(60,74,60,0.45)"} />
                  <AppTextInput
                    value={livStockSearch}
                    onChangeText={(t) => {
                      setLivStockSearch(t);
                      setLivStockOpen(true);
                    }}
                    onFocus={() => setLivStockOpen(true)}
                    onBlur={() => setTimeout(() => setLivStockOpen(false), 150)}
                    placeholder="Rechercher dans votre catalogue..."
                    placeholderTextColor={PH}
                    style={{ ...typography.bodyRegular, fontSize: 14, lineHeight: 20, flex: 1, color: colors.text }}
                  />
                </View>

                {livSelectedStockItem ? (
                  <View style={{ marginTop: 10, borderRadius: 16, backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 12 }}>
                    <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                      {livSelectedStockItem.name}
                    </AppText>
                    <AppText variant="dense" style={{ marginTop: 4, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.7)" }} numberOfLines={1}>
                      {livSelectedStockItem.stockLabel}
                    </AppText>
                  <AppText
                    variant="dense"
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      lineHeight: 16,
                      fontFamily: fonts.bodySemi,
                      color:
                        livStockAvailable === 0
                          ? "#B91C1C"
                          : livStockAvailable === 1
                            ? "#B45309"
                            : "rgba(60,74,60,0.75)",
                    }}
                    numberOfLines={2}
                  >
                    {livStockAvailable === 0
                      ? "Rupture de stock — commande impossible"
                      : livStockAvailable === 1
                        ? "Dernier article disponible"
                        : `Stock disponible : ${livStockAvailable} unités`}
                  </AppText>
                  </View>
                ) : null}

                {livStockOpen ? (
                  <View
                    style={{
                      marginTop: 10,
                      borderRadius: 16,
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: "rgba(187,203,184,0.20)",
                      overflow: "hidden",
                    }}
                  >
                    {livFilteredStock.slice(0, 6).map((it) => (
                      <Pressable
                        key={it.id}
                        onPress={() => {
                          setLivSelectedStockItemId(it.id);
                          setLivStockSearch(it.name);
                          setLivStockOpen(false);
                          if (it.stockAvailable > 0) setLivStockQty("1");
                        }}
                        style={{
                          minHeight: 52,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: "rgba(237,238,239,0.9)",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <View style={{ width: 36, height: 36, borderRadius: 14, backgroundColor: "#EDEEEF", alignItems: "center", justifyContent: "center" }}>
                          <PackageOpen size={16} color={"rgba(25,28,29,0.75)"} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                            {it.name}
                          </AppText>
                          <AppText variant="dense" style={{ marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.65)" }} numberOfLines={1}>
                            {it.stockLabel}
                          </AppText>
                        </View>
                      </Pressable>
                    ))}
                    {livFilteredStock.length === 0 ? (
                      <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
                        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.65)" }} numberOfLines={2}>
                          Aucun colis trouvé.
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View>
                <RamassageFieldLabel>Quantité</RamassageFieldLabel>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => {
                      const current = Math.max(1, Math.floor(parseXaf(livStockQty) || 1));
                      const next = Math.max(1, current - 1);
                      setLivStockQty(String(next));
                    }}
                    disabled={!livSelectedStockItem || livOutOfStock || parseXaf(livStockQty) <= 1}
                    style={{
                      width: 56,
                      minHeight: 56,
                      borderRadius: radii.pill,
                      backgroundColor: !livSelectedStockItem || livOutOfStock || parseXaf(livStockQty) <= 1 ? "#E5E7EB" : colors.white,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(187,203,184,0.20)",
                    }}
                  >
                    <AppText style={{ fontSize: 22, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                      —
                    </AppText>
                  </Pressable>

                  <View
                    style={{
                      flex: 1,
                      minHeight: 56,
                      borderRadius: radii.pill,
                      backgroundColor: INPUT_BG,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 12,
                    }}
                  >
                    <AppText style={{ fontSize: 18, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                      {Math.max(1, Math.floor(parseXaf(livStockQty) || 1))}
                    </AppText>
                  </View>

                  <Pressable
                    onPress={() => {
                      const current = Math.max(1, Math.floor(parseXaf(livStockQty) || 1));
                      const max = Math.max(1, livStockAvailable || 1);
                      const next = Math.min(max, current + 1);
                      setLivStockQty(String(next));
                    }}
                    disabled={!livSelectedStockItem || livOutOfStock || (livStockAvailable > 0 && parseXaf(livStockQty) >= livStockAvailable)}
                    style={{
                      width: 56,
                      minHeight: 56,
                      borderRadius: radii.pill,
                      backgroundColor:
                        !livSelectedStockItem || livOutOfStock || (livStockAvailable > 0 && parseXaf(livStockQty) >= livStockAvailable) ? "#E5E7EB" : colors.white,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: "rgba(187,203,184,0.20)",
                    }}
                  >
                    <AppText style={{ fontSize: 22, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1}>
                      +
                    </AppText>
                  </Pressable>
                </View>
              </View>
              <FormInput label="Numéro destinataire" keyboardType="phone-pad" value={livPhone} onChangeText={setLivPhone} placeholder="6XXXXXXX" />
              <View>
                <RamassageFieldLabel>Quartier de livraison</RamassageFieldLabel>
                <View
                  style={{
                    minHeight: 56,
                    borderRadius: INPUT_RADIUS,
                    backgroundColor: INPUT_BG,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Search size={18} color={"rgba(60,74,60,0.45)"} />
                  <AppTextInput
                    value={livQuartierQuery}
                    onChangeText={(t) => {
                      setLivQuartierQuery(t);
                      setLivQuartierOpen(true);
                      setLivSelectedQuartier(null);
                    }}
                    onFocus={() => setLivQuartierOpen(true)}
                    onBlur={() => setTimeout(() => setLivQuartierOpen(false), 150)}
                    placeholder="Sélectionner un quartier..."
                    placeholderTextColor={PH}
                    style={{ ...typography.bodyRegular, fontSize: 14, lineHeight: 20, flex: 1, color: colors.text }}
                  />
                </View>

                {livQuartierOpen ? (
                  <View
                    style={{
                      marginTop: 10,
                      borderRadius: 16,
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: "rgba(187,203,184,0.20)",
                      overflow: "hidden",
                    }}
                  >
                    {livFilteredQuartiers.slice(0, 8).map((q) => (
                      <Pressable
                        key={q}
                        onPress={() => {
                          setLivSelectedQuartier(q);
                          setLivQuartierQuery(q);
                          setLivQuartierOpen(false);
                        }}
                        style={{
                          minHeight: 46,
                          paddingHorizontal: 14,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: "rgba(237,238,239,0.9)",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodySemi, color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
                          {q}
                        </AppText>
                      </Pressable>
                    ))}
                    {livFilteredQuartiers.length === 0 ? (
                      <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
                        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.65)" }} numberOfLines={2}>
                          Aucun quartier trouvé.
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <FormInput
                label="Détail (optionnel)"
                value={livDeliveryLandmark}
                onChangeText={setLivDeliveryLandmark}
                placeholder="Ex: Face à la pharmacie, portail rouge"
              />

              <View>
                <RamassageFieldLabel>Type de livraison</RamassageFieldLabel>
                <ExpressToggleCard value={livExpress === "yes"} onChange={(next) => setLivExpress(next ? "yes" : "no")} supplementXaf={1000} />
              </View>

              <FormInput label="Instructions (optionnel)" multiline value={livNotes} onChangeText={setLivNotes} placeholder="Ex: appeler avant d'arriver, laisser au gardien..." />

              <View>
                <RamassageFieldLabel>Y a-t-il de l&apos;argent à récupérer ?</RamassageFieldLabel>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => setLivCollectCash("yes")}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: radii.pill,
                      backgroundColor: livCollectCash === "yes" ? "#297FC6" : INPUT_BG,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 10,
                    }}
                  >
                    <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: livCollectCash === "yes" ? colors.white : colors.text }} numberOfLines={1}>
                      Oui
                    </AppText>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setLivCollectCash("no");
                      setLivAmountDueText("");
                    }}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: radii.pill,
                      backgroundColor: livCollectCash === "no" ? "#297FC6" : INPUT_BG,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 10,
                    }}
                  >
                    <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: livCollectCash === "no" ? colors.white : colors.text }} numberOfLines={1}>
                      Non
                    </AppText>
                  </Pressable>
                </View>

                {livNeedsCashAmount ? (
                  <View style={{ marginTop: 12 }}>
                    <FormInput
                      label="Montant à encaisser"
                      keyboardType="number-pad"
                      value={livAmountDueText}
                      onChangeText={setLivAmountDueText}
                      placeholder="Ex: 5 000"
                      trailing={
                        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                          FCFA
                        </AppText>
                      }
                    />
                  </View>
                ) : null}
              </View>

              <View style={{ marginTop: 14 }}>
                <RamassageFieldLabel>Photo de l&apos;article (optionnel)</RamassageFieldLabel>
                {livPhotoUri ? (
                  <View style={{ borderRadius: 16, backgroundColor: colors.white, overflow: "hidden", borderWidth: 1, borderColor: "rgba(187,203,184,0.20)" }}>
                    <Image source={{ uri: livPhotoUri }} style={{ width: "100%", height: 180 }} contentFit="cover" />
                    <Pressable
                      onPress={() => setLivPhotoUri(null)}
                      hitSlop={10}
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 36,
                        height: 36,
                        borderRadius: radii.pill,
                        backgroundColor: "rgba(15,23,42,0.65)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={18} color={colors.white} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    onPress={async () => {
                      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                      if (!perm.granted) return;
                      const res = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        quality: 0.8,
                      });
                      if (res.canceled) return;
                      const uri = res.assets?.[0]?.uri;
                      if (typeof uri === "string" && uri.length > 0) setLivPhotoUri(uri);
                    }}
                    style={{
                      minHeight: 88,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "rgba(187,203,184,0.35)",
                      backgroundColor: colors.white,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingVertical: 18,
                      paddingHorizontal: 16,
                      gap: 10,
                    }}
                  >
                    <Camera size={22} color={"rgba(60,74,60,0.55)"} />
                    <AppText variant="dense" style={{ fontSize: 13, lineHeight: 18, fontFamily: fonts.bodySemi, color: "rgba(60,74,60,0.75)" }} numberOfLines={2}>
                      Ajouter une photo
                    </AppText>
                  </Pressable>
                )}
              </View>
            </View>
        </>
        )
      ) : isExpedition ? (
        <View style={{ marginTop: 22, gap: 20 }}>
          <FormInput label="Ville de l'expédition" value={expVille} onChangeText={setExpVille} placeholder="Ex. Douala" />
          <FormInput label="Agence de l'expédition" value={expAgence} onChangeText={setExpAgence} placeholder="Ex. Agence Liv Sight" />
          <FormInput label="Adresse de ramassage" value={expPickupAddress} onChangeText={setExpPickupAddress} placeholder="Ex. Rue, repère, quartier…" />
          <FormInput label="Nom du destinataire" value={expNomDestinataire} onChangeText={setExpNomDestinataire} placeholder="Nom complet" autoCapitalize="words" />
          <FormInput label="Numéro de téléphone du destinataire" keyboardType="phone-pad" value={expTelephoneDestinataire} onChangeText={setExpTelephoneDestinataire} placeholder="6XXXXXX" />
        </View>
      ) : (
        <View style={{ marginTop: 22, gap: 24 }}>
          <FormInput
            label="Quartier de ramassage"
            value={pickupPickupQuartierQuery}
            onChangeText={setPickupPickupQuartierQuery}
            placeholder="Quartier de ramassage..."
          />
          <FormInput
            label="Détail"
            value={pickupPickupLandmark}
            onChangeText={setPickupPickupLandmark}
            placeholder="Ex: Bastos, face à la pharmacie"
          />

          <FormInput
            label="Quartier de livraison"
            value={pickupDropoffQuartierQuery}
            onChangeText={setPickupDropoffQuartierQuery}
            placeholder="Quartier de livraison..."
          />
          <FormInput
            label="Détail"
            value={pickupDropoffLandmark}
            onChangeText={setPickupDropoffLandmark}
            placeholder="Ex: Emombo, derrière la station"
          />

          <View
            style={{
              borderRadius: 24,
              backgroundColor: colors.white,
              borderWidth: 1,
              borderColor: "rgba(187,203,184,0.20)",
              padding: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 18,
                  backgroundColor: "rgba(245,158,11,0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Hand size={20} color={"#B45309"} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={2} ellipsizeMode="tail">
                  Ramassage hors stock
                </AppText>
                <AppText variant="dense" style={{ marginTop: 2, fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyRegular, color: "rgba(60,74,60,0.7)" }} numberOfLines={2}>
                  Le colis sera récupéré à votre adresse
                </AppText>
              </View>
              <View style={{ flexShrink: 0 }}>
                <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: "#B45309" }} numberOfLines={1}>
                  +500 FCFA
                </AppText>
              </View>
            </View>
          </View>

          <View>
            <RamassageFieldLabel>Type de livraison</RamassageFieldLabel>
            <ExpressToggleCard value={pickupExpress === "yes"} onChange={(next) => setPickupExpress(next ? "yes" : "no")} supplementXaf={1000} />
          </View>

          <FormInput
            label="Description du colis"
            leadingIcon={PackageOpen}
            value={pickupName}
            onChangeText={setPickupName}
            placeholder="Ex: iPhone 15 Pro, chaussures Nike..."
          />

          <FormInput label="Quantité" leadingIcon={Hash} keyboardType="number-pad" value={pickupQty} onChangeText={(t) => setPickupQty(t.replace(/[^\d]/g, ""))} placeholder="1" />

          <View>
            <RamassageFieldLabel>Y a-t-il de l&apos;argent à récupérer ?</RamassageFieldLabel>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setPickupCollectCash("yes")}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: radii.pill,
                  backgroundColor: pickupCollectCash === "yes" ? "#297FC6" : INPUT_BG,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 10,
                }}
              >
                <AppText
                  variant="dense"
                  style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: pickupCollectCash === "yes" ? colors.white : colors.muted }}
                  numberOfLines={1}
                >
                  Oui
                </AppText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setPickupCollectCash("no");
                  setPickupAmount("");
                }}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: radii.pill,
                  backgroundColor: pickupCollectCash === "no" ? "#297FC6" : INPUT_BG,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 10,
                }}
              >
                <AppText
                  variant="dense"
                  style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: pickupCollectCash === "no" ? colors.white : colors.muted }}
                  numberOfLines={1}
                >
                  Non
                </AppText>
              </Pressable>
            </View>

            {pickupCollectCash === "yes" ? (
              <View style={{ marginTop: 12 }}>
                <FormInput
                  label="Montant à encaisser"
                  leadingIcon={Wallet}
                  keyboardType="number-pad"
                  value={pickupAmount}
                  onChangeText={(t) => setPickupAmount(t.replace(/[^\d]/g, ""))}
                  placeholder="Ex: 5 000"
                  trailing={
                    <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                      FCFA
                    </AppText>
                  }
                />
              </View>
            ) : null}
          </View>

          <FormInput label="Téléphone" keyboardType="phone-pad" value={pickupPhone} onChangeText={setPickupPhone} placeholder="6XXXXXXX" />

          <PhotoPicker label="Photo du colis" uri={pickupPhotoUri} onChangeUri={setPickupPhotoUri} />
        </View>
      )}

    </ScreenLayout>
  );
}
