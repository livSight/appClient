import { useEffect, useMemo, useRef, useState } from "react";
import { View, Pressable, ScrollView as RNScrollView } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import ScreenLayout from "./ScreenLayout";
import AppText from "./AppText";
import AppTextInput from "./AppTextInput";
import ExpressToggleCard from "./ExpressToggleCard";
import FormInput from "./FormInput";
import FormButton from "./FormButton";
import SolarIcon from "./SolarIcon";
import CenteredScreenHeader from "./CenteredScreenHeader";
import { card } from "../theme/styles";
import { colors, fonts, radii, shadows, typography } from "../theme/tokens";
import {
  parseExpeditionClient,
  SERVICE_EXPEDITION,
  stringifyExpeditionClient,
} from "@/lib/expeditionClient";
import { hapticSuccess } from "@/lib/haptics";
import { listPackages, makeClientId, type Package } from "@/lib/api/packages";
import { formatSupplementFcfaLabel } from "@/lib/api/tariffUi";
import { useDeliveryFeeSettings } from "@/lib/hooks/useDeliveryFeeSettings";

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

type InventoryItem = {
  id: string;
  name: string;
  stockLabel: string;
  stockAvailable: number;
};

function toInventory(items: Package[]): InventoryItem[] {
  return items
    .map((p) => {
      const name = String(p?.package_name ?? "").trim();
      if (!name) return null;
      const description = String(p?.description ?? "").trim();
      const qty = Number.isFinite(Number(p?.quantity)) ? Math.max(0, Math.floor(Number(p.quantity))) : 0;
      const stockLabel = [description, `STOCK: ${qty}`].filter(Boolean).join(" • ");
      return {
        id: makeClientId(p),
        name,
        stockLabel,
        stockAvailable: qty,
      } satisfies InventoryItem;
    })
    .filter(Boolean) as InventoryItem[];
}

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
  iconName,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  iconName: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: radii.card,
        backgroundColor: active ? colors.primary : colors.cardBg,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 4,
        ...shadows.card,
      }}
    >
      <SolarIcon name={iconName} size={28} color={active ? colors.white : colors.primary} />
      <AppText
        style={{
          marginTop: 6,
          fontSize: 12,
          lineHeight: 16,
          fontFamily: active ? fonts.bodyBold : fonts.bodySemi,
          color: active ? colors.white : colors.text,
          textAlign: "center",
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
  const { expressFee, pickupFee } = useDeliveryFeeSettings();

  const {
    quartier: quartierParam,
    mode: modeParam,
    expeditionClient: expeditionClientRaw,
    editSection,
    phone: expPhoneParam,
    selectedItems: expSelectedItemsParam,
    livPhone: livPhoneParam,
    livNotes: livNotesParam,
    livExpress: livExpressParam,
    livCollectCash: livCollectCashParam,
    livAmountDueText: livAmountDueTextParam,
    deliveryQuartier: deliveryQuartierParam,
    deliveryLandmark: deliveryLandmarkParam,
    stockItemId: stockItemIdParam,
    stockQty: stockQtyParam,
    pickupPhone: pickupPhoneParam,
    pickupExpress: pickupExpressParam,
    pickupCollectCash: pickupCollectCashParam,
    pickupAmount: pickupAmountParam,
    pickupName: pickupNameParam,
    pickupQty: pickupQtyParam,
    pickupPickupQuartier: pickupPickupQuartierParam,
    pickupPickupLandmark: pickupPickupLandmarkParam,
    pickupDropoffQuartier: pickupDropoffQuartierParam,
    pickupDropoffLandmark: pickupDropoffLandmarkParam,
    pickupPhotoUri: pickupPhotoUriParam,
  } = useLocalSearchParams<{
    quartier?: string;
    mode?: Mode;
    expeditionClient?: string;
    editSection?: string;
    phone?: string;
    notes?: string;
    express?: "yes" | "no";
    collectCash?: "yes" | "no";
    amountDueText?: string;
    selectedItems?: string;
    livPhone?: string;
    livNotes?: string;
    livExpress?: "yes" | "no";
    livCollectCash?: "yes" | "no";
    livAmountDueText?: string;
    deliveryQuartier?: string;
    deliveryLandmark?: string;
    stockItemId?: string;
    stockQty?: string;
    pickupPhone?: string;
    pickupExpress?: "yes" | "no";
    pickupCollectCash?: "yes" | "no";
    pickupAmount?: string;
    pickupName?: string;
    pickupQty?: string;
    pickupPickupQuartier?: string;
    pickupPickupLandmark?: string;
    pickupDropoffQuartier?: string;
    pickupDropoffLandmark?: string;
  }>();

  const quartier = typeof quartierParam === "string" ? quartierParam : "";
  const initialMode: Mode = modeParam === "pickup" ? "pickup" : "stock";
  const editSectionKey = typeof editSection === "string" ? editSection : "";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [pickupName, setPickupName] = useState(() => (typeof pickupNameParam === "string" ? pickupNameParam : ""));
  const [pickupQty, setPickupQty] = useState(() => (typeof pickupQtyParam === "string" && pickupQtyParam.length ? pickupQtyParam : "1"));
  const [pickupExpress, setPickupExpress] = useState<"yes" | "no">(() => (pickupExpressParam === "yes" ? "yes" : "no"));
  const [pickupCollectCash, setPickupCollectCash] = useState<"yes" | "no">(() => (pickupCollectCashParam === "yes" ? "yes" : "no"));
  const [pickupAmount, setPickupAmount] = useState(() => (typeof pickupAmountParam === "string" ? pickupAmountParam : ""));
  const [pickupPhone, setPickupPhone] = useState(() => (typeof pickupPhoneParam === "string" ? pickupPhoneParam : ""));
  const [pickupPickupQuartierQuery, setPickupPickupQuartierQuery] = useState(() => (typeof pickupPickupQuartierParam === "string" ? pickupPickupQuartierParam : ""));
  const [pickupPickupLandmark, setPickupPickupLandmark] = useState(() => (typeof pickupPickupLandmarkParam === "string" ? pickupPickupLandmarkParam : ""));
  const [pickupDropoffQuartierQuery, setPickupDropoffQuartierQuery] = useState(() => (typeof pickupDropoffQuartierParam === "string" ? pickupDropoffQuartierParam : ""));
  const [pickupDropoffLandmark, setPickupDropoffLandmark] = useState(() => (typeof pickupDropoffLandmarkParam === "string" ? pickupDropoffLandmarkParam : ""));

  const [expVille, setExpVille] = useState(() => (typeof quartierParam === "string" ? quartierParam.trim() : ""));
  const [expAgence, setExpAgence] = useState("");
  const [expPickupAddress, setExpPickupAddress] = useState("");
  const [expNomDestinataire, setExpNomDestinataire] = useState(() =>
    parseExpeditionClient(typeof expeditionClientRaw === "string" ? expeditionClientRaw : undefined)?.clientName ?? ""
  );
  const [expTelephoneDestinataire, setExpTelephoneDestinataire] = useState(() =>
    (typeof expPhoneParam === "string" && expPhoneParam.trim().length ? expPhoneParam.trim() : "") ||
    (parseExpeditionClient(typeof expeditionClientRaw === "string" ? expeditionClientRaw : undefined)?.phone ?? "")
  );

  const [expStockOpen, setExpStockOpen] = useState(false);
  const expSelectedFromParams = useMemo(() => {
    if (typeof expSelectedItemsParam !== "string" || !expSelectedItemsParam.length) return null;
    try {
      const parsed = JSON.parse(expSelectedItemsParam);
      if (!Array.isArray(parsed) || !parsed.length) return null;
      const first = parsed[0];
      const id = typeof first?.id === "string" ? first.id : "";
      const name = typeof first?.name === "string" ? first.name : "";
      const qty = Number.isFinite(Number(first?.qty)) ? String(Math.max(1, Math.floor(Number(first.qty)))) : "1";
      if (!id) return null;
      return { id, name, qty };
    } catch {
      return null;
    }
  }, [expSelectedItemsParam]);

  const [expSelectedStockItemId, setExpSelectedStockItemId] = useState<string | null>(() => expSelectedFromParams?.id ?? null);
  const [expStockQty, setExpStockQty] = useState(() => expSelectedFromParams?.qty ?? "1");
  const [expStockSearch, setExpStockSearch] = useState(() =>
    isExpedition ? expSelectedFromParams?.name ?? "" : ""
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setInventoryLoading(true);
        setInventoryError(null);
        const items = await listPackages();
        if (!mounted) return;
        setInventory(toInventory(items));
      } catch (e: any) {
        if (!mounted) return;
        setInventoryError(String(e?.message ?? e ?? "Erreur de chargement"));
        setInventory([]);
      } finally {
        if (!mounted) return;
        setInventoryLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const [livStockSearch, setLivStockSearch] = useState("");
  const [livStockOpen, setLivStockOpen] = useState(false);
  const [livSelectedStockItemId, setLivSelectedStockItemId] = useState<string | null>(() =>
    typeof stockItemIdParam === "string" && stockItemIdParam.length ? stockItemIdParam : null
  );
  const [livStockQty, setLivStockQty] = useState(() =>
    typeof stockQtyParam === "string" && stockQtyParam.length ? stockQtyParam : "1"
  );
  const [livPhone, setLivPhone] = useState(() => (typeof livPhoneParam === "string" ? livPhoneParam : ""));
  const [livQuartierQuery, setLivQuartierQuery] = useState(() => (typeof deliveryQuartierParam === "string" ? deliveryQuartierParam : ""));
  const [livQuartierOpen, setLivQuartierOpen] = useState(false);
  const [livSelectedQuartier, setLivSelectedQuartier] = useState<string | null>(() =>
    typeof deliveryQuartierParam === "string" && deliveryQuartierParam.length ? deliveryQuartierParam : null
  );
  const [livDeliveryLandmark, setLivDeliveryLandmark] = useState(() => (typeof deliveryLandmarkParam === "string" ? deliveryLandmarkParam : ""));
  const [livNotes, setLivNotes] = useState(() => (typeof livNotesParam === "string" ? livNotesParam : ""));
  const [livExpress, setLivExpress] = useState<"yes" | "no">(() => (livExpressParam === "yes" ? "yes" : "no"));
  const [livCollectCash, setLivCollectCash] = useState<"yes" | "no">(() => (livCollectCashParam === "yes" ? "yes" : "no"));
  const [livAmountDueText, setLivAmountDueText] = useState(() => (typeof livAmountDueTextParam === "string" ? livAmountDueTextParam : ""));

  const scrollRef = useRef<RNScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const recordSectionLayout = (key: string, e: any) => {
    sectionY.current[key] = e?.nativeEvent?.layout?.y ?? 0;
  };

  useEffect(() => {
    if (!editSectionKey) return;
    if (mode !== "stock" && mode !== "pickup") return;
    const y = sectionY.current[editSectionKey];
    if (typeof y !== "number") return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
      if (mode === "stock") {
        if (!isExpedition) {
          if (editSectionKey === "address") setLivQuartierOpen(true);
          if (editSectionKey === "items") setLivStockOpen(true);
        } else {
          if (editSectionKey === "items") setExpStockOpen(true);
        }
      }
    });
  }, [editSectionKey, isExpedition, mode]);

  const expFilteredStock = useMemo(() => {
    const q = expStockSearch.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((it) => it.name.toLowerCase().includes(q));
  }, [expStockSearch, inventory]);

  const expSelectedStockItem = useMemo(() => {
    if (!expSelectedStockItemId) return null;
    return inventory.find((it) => it.id === expSelectedStockItemId) ?? null;
  }, [expSelectedStockItemId, inventory]);

  const livFilteredStock = useMemo(() => {
    const q = livStockSearch.trim().toLowerCase();
    if (!q) return inventory;
    return inventory.filter((it) => it.name.toLowerCase().includes(q));
  }, [livStockSearch, inventory]);

  const livSelectedStockItem = useMemo(() => {
    if (!livSelectedStockItemId) return null;
    return inventory.find((it) => it.id === livSelectedStockItemId) ?? null;
  }, [livSelectedStockItemId, inventory]);

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
      scrollViewRef={scrollRef}
      scrollViewProps={{ keyboardShouldPersistTaps: "handled" }}
      header={
        <View>
          <CenteredScreenHeader
            title={screenTitle}
            subtitle={isExpedition ? "SOURCE DU COLIS (STOCK OU RAMASSAGE)" : "CHOISIR OÙ RÉCUPÉRER LE COLIS À LIVRER"}
            showBack
          />

          <View onLayout={(e) => recordSectionLayout("mode", e)} />
          <View style={{ marginTop: 14, flexDirection: "row", gap: 16 }}>
            <ModeCard label="Ramassage" active={mode === "pickup"} onPress={() => setMode("pickup")} iconName="solar:hand-shake-bold" />
            <ModeCard label="Colis en stock" active={mode === "stock"} onPress={() => setMode("stock")} iconName="solar:box-bold" />
          </View>
        </View>
      }
      footer={
        <View
          style={{
            backgroundColor: "transparent",
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
                    expAgence: expAgence.trim(),
                    expPickupAddress: expPickupAddress.trim(),
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
              <View onLayout={(e) => recordSectionLayout("items", e)} />
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
              <SolarIcon name="solar:magnifer-outline" size={24} color={"rgba(60,74,60,0.45)"} />
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
                <View style={[card.base, { marginTop: 10, paddingHorizontal: 14, paddingVertical: 12 }]}>
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
                  {inventoryLoading ? (
                    <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
                      <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.65)" }} numberOfLines={2}>
                        Chargement du stock…
                      </AppText>
                    </View>
                  ) : inventoryError ? (
                    <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
                      <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "#B91C1C" }} numberOfLines={3}>
                        {inventoryError}
                      </AppText>
                    </View>
                  ) : null}
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
                        <SolarIcon name="solar:box-outline" size={24} color={"rgba(25,28,29,0.75)"} />
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
                        {inventoryLoading ? "Chargement du stock…" : inventoryError ? "Impossible de charger le stock." : "Aucun colis trouvé."}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>

            <FormInput label="Quantité" keyboardType="number-pad" value={expStockQty} onChangeText={(t) => setExpStockQty(t.replace(/[^\d]/g, ""))} placeholder="1" />
            <View onLayout={(e) => recordSectionLayout("pickupAddress", e)} />
            <FormInput label="Ville de l'expédition" value={expVille} onChangeText={setExpVille} placeholder="Ex. Douala" />
            <FormInput label="Agence de l'expédition" value={expAgence} onChangeText={setExpAgence} placeholder="Ex. Agence Liv Sight" />
            <FormInput label="Adresse de ramassage" value={expPickupAddress} onChangeText={setExpPickupAddress} placeholder="Ex. Rue, repère, quartier…" />
            <View onLayout={(e) => recordSectionLayout("recipient", e)} />
            <FormInput label="Nom du destinataire" value={expNomDestinataire} onChangeText={setExpNomDestinataire} placeholder="Nom complet" autoCapitalize="words" />
            <FormInput label="Numéro de téléphone du destinataire" keyboardType="phone-pad" value={expTelephoneDestinataire} onChangeText={setExpTelephoneDestinataire} placeholder="6XXXXXX" />
          </View>
        ) : (
          <>
            <View style={{ marginTop: 22, gap: 20 }}>
              <View>
                <RamassageFieldLabel>Sélectionner un produit</RamassageFieldLabel>
                <View onLayout={(e) => recordSectionLayout("items", e)} />
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
                <SolarIcon name="solar:magnifer-outline" size={24} color={"rgba(60,74,60,0.45)"} />
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
                  <View style={[card.base, { marginTop: 10, paddingHorizontal: 14, paddingVertical: 12 }]}>
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
                    {inventoryLoading ? (
                      <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
                        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "rgba(60,74,60,0.65)" }} numberOfLines={2}>
                          Chargement du stock…
                        </AppText>
                      </View>
                    ) : inventoryError ? (
                      <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
                        <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyMedium, color: "#B91C1C" }} numberOfLines={3}>
                          {inventoryError}
                        </AppText>
                      </View>
                    ) : null}
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
                          <SolarIcon name="solar:box-outline" size={24} color={"rgba(25,28,29,0.75)"} />
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
                          {inventoryLoading ? "Chargement du stock…" : inventoryError ? "Impossible de charger le stock." : "Aucun colis trouvé."}
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
              <View onLayout={(e) => recordSectionLayout("recipient", e)} />
              <FormInput label="Numéro destinataire" keyboardType="phone-pad" value={livPhone} onChangeText={setLivPhone} placeholder="6XXXXXXX" />
              <View>
                <View onLayout={(e) => recordSectionLayout("address", e)} />
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
                  <SolarIcon name="solar:magnifer-outline" size={24} color={"rgba(60,74,60,0.45)"} />
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
                <View onLayout={(e) => recordSectionLayout("deliveryType", e)} />
                <RamassageFieldLabel>Type de livraison</RamassageFieldLabel>
                <ExpressToggleCard
                  value={livExpress === "yes"}
                  onChange={(next) => setLivExpress(next ? "yes" : "no")}
                  supplementXaf={expressFee ?? undefined}
                />
              </View>

              <View onLayout={(e) => recordSectionLayout("notes", e)} />
              <FormInput label="Instructions (optionnel)" multiline value={livNotes} onChangeText={setLivNotes} placeholder="Ex: appeler avant d'arriver, laisser au gardien..." />

              <View>
                <View onLayout={(e) => recordSectionLayout("payment", e)} />
                <RamassageFieldLabel>Y a-t-il de l&apos;argent à récupérer ?</RamassageFieldLabel>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => setLivCollectCash("yes")}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: radii.pill,
                      backgroundColor: livCollectCash === "yes" ? colors.primary : INPUT_BG,
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
                      backgroundColor: livCollectCash === "no" ? colors.primary : INPUT_BG,
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
            </View>
        </>
        )
      ) : isExpedition ? (
        <View style={{ marginTop: 22, gap: 20 }}>
          <View onLayout={(e) => recordSectionLayout("pickupAddress", e)} />
          <FormInput label="Ville de l'expédition" value={expVille} onChangeText={setExpVille} placeholder="Ex. Douala" />
          <FormInput label="Agence de l'expédition" value={expAgence} onChangeText={setExpAgence} placeholder="Ex. Agence Liv Sight" />
          <FormInput label="Adresse de ramassage" value={expPickupAddress} onChangeText={setExpPickupAddress} placeholder="Ex. Rue, repère, quartier…" />
          <View onLayout={(e) => recordSectionLayout("recipient", e)} />
          <FormInput label="Nom du destinataire" value={expNomDestinataire} onChangeText={setExpNomDestinataire} placeholder="Nom complet" autoCapitalize="words" />
          <FormInput label="Numéro de téléphone du destinataire" keyboardType="phone-pad" value={expTelephoneDestinataire} onChangeText={setExpTelephoneDestinataire} placeholder="6XXXXXX" />
        </View>
      ) : (
        <View style={{ marginTop: 22, gap: 24 }}>
          <View onLayout={(e) => recordSectionLayout("pickupAddress", e)} />
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

          <View onLayout={(e) => recordSectionLayout("deliveryAddress", e)} />
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

          <View style={[card.base, { padding: 20 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <SolarIcon name="solar:hand-shake-bold" size={28} color={"#B45309"} />
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
                  {formatSupplementFcfaLabel(pickupFee)}
                </AppText>
              </View>
            </View>
          </View>

          <View>
            <View onLayout={(e) => recordSectionLayout("deliveryType", e)} />
            <RamassageFieldLabel>Type de livraison</RamassageFieldLabel>
            <ExpressToggleCard
              value={pickupExpress === "yes"}
              onChange={(next) => setPickupExpress(next ? "yes" : "no")}
              supplementXaf={expressFee ?? undefined}
            />
          </View>

          <View onLayout={(e) => recordSectionLayout("items", e)} />
          <FormInput
            label="Description du colis"
            leadingIconName="solar:box-outline"
            leadingIconSize={24}
            value={pickupName}
            onChangeText={setPickupName}
            placeholder="Ex: iPhone 15 Pro, chaussures Nike..."
          />

          <FormInput label="Quantité" leadingIconName="solar:hashtag-outline" leadingIconSize={24} keyboardType="number-pad" value={pickupQty} onChangeText={(t) => setPickupQty(t.replace(/[^\d]/g, ""))} placeholder="1" />

          <View>
            <View onLayout={(e) => recordSectionLayout("payment", e)} />
            <RamassageFieldLabel>Y a-t-il de l&apos;argent à récupérer ?</RamassageFieldLabel>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setPickupCollectCash("yes")}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: radii.pill,
                  backgroundColor: pickupCollectCash === "yes" ? colors.primary : INPUT_BG,
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
                  backgroundColor: pickupCollectCash === "no" ? colors.primary : INPUT_BG,
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
                  leadingIconName="solar:wallet-outline"
                  leadingIconSize={24}
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
        </View>
      )}

    </ScreenLayout>
  );
}
