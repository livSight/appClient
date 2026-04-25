import { useMemo, useState } from "react";
import { View, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Search, PackageOpen, Hand, Hash, Wallet } from "lucide-react-native";
import ScreenLayout from "./ScreenLayout";
import AppText from "./AppText";
import AppTextInput from "./AppTextInput";
import ExpressToggleCard from "./ExpressToggleCard";
import { colors, fonts, radii, typography } from "../theme/tokens";
import {
  parseExpeditionClient,
  SERVICE_EXPEDITION,
  stringifyExpeditionClient,
} from "@/lib/expeditionClient";

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
};

const MOCK_INVENTORY: InventoryItem[] = [
  { id: "paper-a4", name: "Papier A4 (80g)", stockLabel: "STOCK: 45 RAMES" },
  { id: "markers", name: "Set Marqueurs (x12)", stockLabel: "STOCK: 12 SETS" },
  { id: "folders", name: "Classeurs Rigides", stockLabel: "STOCK: 28 UNITÉS" },
];

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
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupQty, setPickupQty] = useState("1");
  const [pickupExpress, setPickupExpress] = useState<"yes" | "no">("no");
  const [pickupCollectCash, setPickupCollectCash] = useState<"yes" | "no">("yes");
  const [pickupAmount, setPickupAmount] = useState("50000");
  const [pickupPhone, setPickupPhone] = useState("");

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
  const [livDeliveryAddress, setLivDeliveryAddress] = useState("");
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
      const phoneOk = livPhone.trim().length > 0;
      const addressOk = livDeliveryAddress.trim().length > 0;
      if (!hasQty || !hasStock || !phoneOk || !addressOk) return false;
      if (!livNeedsCashAmount) return true;
      return Number.isFinite(livAmountDue) && livAmountDue > 0;
    }
    const baseOk =
      pickupName.trim().length > 0 &&
      parseXaf(pickupQty) > 0 &&
      pickupPhone.trim().length > 0 &&
      pickupAddress.trim().length > 0 &&
      livDeliveryAddress.trim().length > 0;
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
    livStockQty,
    livPhone,
    livDeliveryAddress,
    livNeedsCashAmount,
    livAmountDue,
    pickupName,
    pickupQty,
    pickupPhone,
    pickupAddress,
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
            {isExpedition ? "SOURCE DU COLIS (STOCK OU RAMASSAGE)" : "CHOISIR OÙ RECUPERER LE COLIS A LIVRER"}
          </AppText>

          <View style={{ marginTop: 14, flexDirection: "row", gap: 16 }}>
            <ModeCard label="Ramassage" active={mode === "pickup"} onPress={() => setMode("pickup")} icon={Hand} />
            <ModeCard label="Colis en stock" active={mode === "stock"} onPress={() => setMode("stock")} icon={PackageOpen} />
          </View>
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

            <View>
              <RamassageFieldLabel>Quantité</RamassageFieldLabel>
              <View
                style={{
                  minHeight: 56,
                  borderRadius: INPUT_RADIUS,
                  backgroundColor: INPUT_BG,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  justifyContent: "center",
                }}
              >
                <AppTextInput
                  value={expStockQty}
                  onChangeText={(t) => setExpStockQty(t.replace(/[^\d]/g, ""))}
                  placeholder="1"
                  placeholderTextColor={PH}
                  keyboardType="number-pad"
                  style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                />
              </View>
            </View>

            <View>
              <RamassageFieldLabel>Ville de l&apos;expédition</RamassageFieldLabel>
              <View
                style={{
                  minHeight: 56,
                  borderRadius: INPUT_RADIUS,
                  backgroundColor: INPUT_BG,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  justifyContent: "center",
                }}
              >
                <AppTextInput
                  value={expVille}
                  onChangeText={setExpVille}
                  placeholder="Ex. Douala"
                  placeholderTextColor={PH}
                  style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                />
              </View>
            </View>

            <View>
              <RamassageFieldLabel>Agence de l&apos;expédition</RamassageFieldLabel>
              <View
                style={{
                  minHeight: 56,
                  borderRadius: INPUT_RADIUS,
                  backgroundColor: INPUT_BG,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  justifyContent: "center",
                }}
              >
                <AppTextInput
                  value={expAgence}
                  onChangeText={setExpAgence}
                  placeholder="Ex. Agence Liv Sight"
                  placeholderTextColor={PH}
                  style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                />
              </View>
            </View>

            <View>
              <RamassageFieldLabel>Adresse de ramassage</RamassageFieldLabel>
              <View
                style={{
                  minHeight: 56,
                  borderRadius: INPUT_RADIUS,
                  backgroundColor: INPUT_BG,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  justifyContent: "center",
                }}
              >
                <AppTextInput
                  value={expPickupAddress}
                  onChangeText={setExpPickupAddress}
                  placeholder="Ex. Rue, repère, quartier…"
                  placeholderTextColor={PH}
                  style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                />
              </View>
            </View>

            <View>
              <RamassageFieldLabel>Nom du destinataire</RamassageFieldLabel>
              <View
                style={{
                  minHeight: 56,
                  borderRadius: INPUT_RADIUS,
                  backgroundColor: INPUT_BG,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  justifyContent: "center",
                }}
              >
                <AppTextInput
                  value={expNomDestinataire}
                  onChangeText={setExpNomDestinataire}
                  placeholder="Nom complet"
                  placeholderTextColor={PH}
                  autoCapitalize="words"
                  style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                />
              </View>
            </View>

            <View>
              <RamassageFieldLabel>Numéro de téléphone du destinataire</RamassageFieldLabel>
              <View
                style={{
                  minHeight: 56,
                  borderRadius: INPUT_RADIUS,
                  backgroundColor: INPUT_BG,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  justifyContent: "center",
                }}
              >
                <AppTextInput
                  value={expTelephoneDestinataire}
                  onChangeText={setExpTelephoneDestinataire}
                  placeholder="6XXXXXX"
                  placeholderTextColor={PH}
                  keyboardType="phone-pad"
                  style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                />
              </View>
            </View>
          </View>
        ) : (
          <>
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
                    value={livStockSearch}
                    onChangeText={(t) => {
                      setLivStockSearch(t);
                      setLivStockOpen(true);
                    }}
                    onFocus={() => setLivStockOpen(true)}
                    placeholder="Rechercher un colis en stock..."
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
                <View
                  style={{
                    minHeight: 56,
                    borderRadius: INPUT_RADIUS,
                    backgroundColor: INPUT_BG,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    justifyContent: "center",
                  }}
                >
                  <AppTextInput
                    value={livStockQty}
                    onChangeText={(t) => setLivStockQty(t.replace(/[^\d]/g, ""))}
                    placeholder="1"
                    placeholderTextColor={PH}
                    keyboardType="number-pad"
                    style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                  />
                </View>
              </View>

              <View>
                <RamassageFieldLabel>Numéro destinataire</RamassageFieldLabel>
                <View
                  style={{
                    minHeight: 56,
                    borderRadius: INPUT_RADIUS,
                    backgroundColor: INPUT_BG,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    justifyContent: "center",
                  }}
                >
                  <AppTextInput
                    value={livPhone}
                    onChangeText={setLivPhone}
                    placeholder="6XXXXXXX"
                    placeholderTextColor={PH}
                    keyboardType="phone-pad"
                    style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                  />
                </View>
              </View>

              <View>
                <RamassageFieldLabel>Adresse de livraison</RamassageFieldLabel>
                <View
                  style={{
                    minHeight: 56,
                    borderRadius: INPUT_RADIUS,
                    backgroundColor: INPUT_BG,
                    paddingHorizontal: 20,
                    paddingVertical: 12,
                    justifyContent: "center",
                  }}
                >
                  <AppTextInput
                    value={livDeliveryAddress}
                    onChangeText={setLivDeliveryAddress}
                    placeholder="Ex. Rue, repère, quartier…"
                    placeholderTextColor={PH}
                    style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
                  />
                </View>
              </View>

              <View>
                <RamassageFieldLabel>Type de livraison</RamassageFieldLabel>
                <ExpressToggleCard value={livExpress === "yes"} onChange={(next) => setLivExpress(next ? "yes" : "no")} supplementXaf={1000} />
              </View>

              <View>
                <RamassageFieldLabel>Instructions (optionnel)</RamassageFieldLabel>
                <View style={{ minHeight: 128, borderRadius: 16, backgroundColor: INPUT_BG, paddingHorizontal: 16, paddingTop: 14 }}>
                  <AppTextInput
                    value={livNotes}
                    onChangeText={setLivNotes}
                    placeholder={"Ex: appeler avant d'arriver, laisser au gardien..."}
                    placeholderTextColor={PH}
                    multiline
                    style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: colors.text }}
                  />
                </View>
              </View>

              <View>
                <RamassageFieldLabel>Y a-t-il de l&apos;argent à récupérer ?</RamassageFieldLabel>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    onPress={() => setLivCollectCash("yes")}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: radii.pill,
                      backgroundColor: livCollectCash === "yes" ? "#297FC6" : "#E9E9EA",
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
                      backgroundColor: livCollectCash === "no" ? "#297FC6" : "#E9E9EA",
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
                    <RamassageFieldLabel>Montant à récupérer</RamassageFieldLabel>
                    <View style={{ minHeight: 56, borderRadius: 16, backgroundColor: INPUT_BG, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center" }}>
                      <AppTextInput
                        value={livAmountDueText}
                        onChangeText={setLivAmountDueText}
                        placeholder="0"
                        placeholderTextColor={PH}
                        keyboardType="decimal-pad"
                        style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text, flex: 1 }}
                      />
                      <AppText variant="dense" style={{ fontSize: 12, lineHeight: 16, fontFamily: fonts.bodyBold, color: colors.primary, marginLeft: 10 }} numberOfLines={1}>
                        XAF
                      </AppText>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
        </>
        )
      ) : isExpedition ? (
        <View style={{ marginTop: 22, gap: 20 }}>
          <View>
            <RamassageFieldLabel>Ville de l&apos;expédition</RamassageFieldLabel>
            <View
              style={{
                minHeight: 56,
                borderRadius: INPUT_RADIUS,
                backgroundColor: INPUT_BG,
                paddingHorizontal: 20,
                paddingVertical: 12,
                justifyContent: "center",
              }}
            >
              <AppTextInput
                value={expVille}
                onChangeText={setExpVille}
                placeholder="Ex. Douala"
                placeholderTextColor={PH}
                style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
              />
            </View>
          </View>
          <View>
            <RamassageFieldLabel>Agence de l&apos;expédition</RamassageFieldLabel>
            <View
              style={{
                minHeight: 56,
                borderRadius: INPUT_RADIUS,
                backgroundColor: INPUT_BG,
                paddingHorizontal: 20,
                paddingVertical: 12,
                justifyContent: "center",
              }}
            >
              <AppTextInput
                value={expAgence}
                onChangeText={setExpAgence}
                placeholder="Ex. Agence Liv Sight"
                placeholderTextColor={PH}
                style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
              />
            </View>
          </View>
          <View>
            <RamassageFieldLabel>Adresse de ramassage</RamassageFieldLabel>
            <View
              style={{
                minHeight: 56,
                borderRadius: INPUT_RADIUS,
                backgroundColor: INPUT_BG,
                paddingHorizontal: 20,
                paddingVertical: 12,
                justifyContent: "center",
              }}
            >
              <AppTextInput
                value={expPickupAddress}
                onChangeText={setExpPickupAddress}
                placeholder="Ex. Rue, repère, quartier…"
                placeholderTextColor={PH}
                style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
              />
            </View>
          </View>
          <View>
            <RamassageFieldLabel>Nom du destinataire</RamassageFieldLabel>
            <View
              style={{
                minHeight: 56,
                borderRadius: INPUT_RADIUS,
                backgroundColor: INPUT_BG,
                paddingHorizontal: 20,
                paddingVertical: 12,
                justifyContent: "center",
              }}
            >
              <AppTextInput
                value={expNomDestinataire}
                onChangeText={setExpNomDestinataire}
                placeholder="Nom complet"
                placeholderTextColor={PH}
                autoCapitalize="words"
                style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
              />
            </View>
          </View>
          <View>
            <RamassageFieldLabel>Numéro de téléphone du destinataire</RamassageFieldLabel>
            <View
              style={{
                minHeight: 56,
                borderRadius: INPUT_RADIUS,
                backgroundColor: INPUT_BG,
                paddingHorizontal: 20,
                paddingVertical: 12,
                justifyContent: "center",
              }}
            >
              <AppTextInput
                value={expTelephoneDestinataire}
                onChangeText={setExpTelephoneDestinataire}
                placeholder="6XXXXXX"
                placeholderTextColor={PH}
                keyboardType="phone-pad"
                style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
              />
            </View>
          </View>
        </View>
      ) : (
        <View style={{ marginTop: 22, gap: 24 }}>
          <View>
            <AppText
              variant="dense"
              style={{
                fontSize: 10,
                lineHeight: 15,
                fontFamily: fonts.bodyBold,
                color: "rgba(60,74,60,0.6)",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
              numberOfLines={1}
            >
              ADRESSE EXACTE / QUARTIER (RAMASSAGE)
            </AppText>
            <View
              style={{
                minHeight: 64,
                borderRadius: 16,
                backgroundColor: colors.white,
                paddingHorizontal: 16,
                paddingVertical: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <AppTextInput
                value={pickupAddress}
                onChangeText={setPickupAddress}
                placeholder="Ex: Bastos, face à la pharmacie..."
                placeholderTextColor={"rgba(60,74,60,0.4)"}
                style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: colors.text }}
              />
            </View>
          </View>

          <View>
            <AppText
              variant="dense"
              style={{
                fontSize: 10,
                lineHeight: 15,
                fontFamily: fonts.bodyBold,
                color: "rgba(60,74,60,0.6)",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
              numberOfLines={1}
            >
              ADRESSE DE LIVRAISON
            </AppText>
            <View
              style={{
                minHeight: 64,
                borderRadius: 16,
                backgroundColor: colors.white,
                paddingHorizontal: 16,
                paddingVertical: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 2,
                elevation: 1,
              }}
            >
              <AppTextInput
                value={livDeliveryAddress}
                onChangeText={setLivDeliveryAddress}
                placeholder="Ex: Emombo, derrière la station..."
                placeholderTextColor={"rgba(60,74,60,0.4)"}
                style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyRegular, color: colors.text }}
              />
            </View>
          </View>

          <View>
            <AppText
              variant="dense"
              style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyBold, color: "rgba(60,74,60,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}
              numberOfLines={1}
            >
              TYPE DE LIVRAISON
            </AppText>
            <ExpressToggleCard
              value={pickupExpress === "yes"}
              onChange={(next) => setPickupExpress(next ? "yes" : "no")}
              supplementXaf={1000}
            />
          </View>

          <View>
            <AppText
              variant="dense"
              style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyBold, color: "rgba(60,74,60,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}
              numberOfLines={1}
            >
              NOM DU PRODUITS
            </AppText>
            <View
              style={{
                minHeight: 55,
                borderRadius: 24,
                backgroundColor: "#F3F4F5",
                paddingHorizontal: 18,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <PackageOpen size={18} color={"rgba(60,74,60,0.45)"} />
              <AppTextInput
                value={pickupName}
                onChangeText={setPickupName}
                placeholder="Ex: iPhone 15 Pro"
                placeholderTextColor={"rgba(60,74,60,0.4)"}
                style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyMedium, color: colors.text, flex: 1, marginLeft: 10 }}
              />
            </View>
          </View>

          <View>
            <AppText
              variant="dense"
              style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyBold, color: "rgba(60,74,60,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}
              numberOfLines={1}
            >
              QUANTITÉ
            </AppText>
            <View
              style={{
                minHeight: 56,
                borderRadius: 24,
                backgroundColor: "#F3F4F5",
                paddingHorizontal: 18,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Hash size={18} color={"rgba(60,74,60,0.45)"} />
              <AppTextInput
                keyboardType="number-pad"
                value={pickupQty}
                onChangeText={(t) => setPickupQty(t.replace(/[^\d]/g, ""))}
                placeholder="1"
                placeholderTextColor={"rgba(60,74,60,0.4)"}
                style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyMedium, color: colors.text, flex: 1, marginLeft: 10 }}
              />
            </View>
          </View>

          <View>
            <AppText
              variant="dense"
              style={{ fontSize: 10, lineHeight: 15, fontFamily: fonts.bodyBold, color: "rgba(60,74,60,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}
              numberOfLines={1}
            >
              Y a-t-il de l&apos;argent à récupérer ?
            </AppText>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setPickupCollectCash("yes")}
                style={{
                  flex: 1,
                  minHeight: 48,
                  borderRadius: radii.pill,
                  backgroundColor: pickupCollectCash === "yes" ? "#297FC6" : "#F3F4F5",
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
                  backgroundColor: pickupCollectCash === "no" ? "#297FC6" : "#F3F4F5",
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
              <View
                style={{
                  marginTop: 12,
                  minHeight: 55,
                  borderRadius: 24,
                  backgroundColor: "#F3F4F5",
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Wallet size={18} color={"rgba(60,74,60,0.45)"} />
                <AppTextInput
                  keyboardType="number-pad"
                  value={pickupAmount}
                  onChangeText={(t) => setPickupAmount(t.replace(/[^\d]/g, ""))}
                  placeholder="50 000"
                  placeholderTextColor={"rgba(60,74,60,0.4)"}
                  style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyMedium, color: colors.text, flex: 1, marginLeft: 10 }}
                />
              </View>
            ) : null}
          </View>

          <View>
            <AppText
              variant="dense"
              style={{ fontSize: 11, lineHeight: 16.5, fontFamily: fonts.bodyBold, color: "#6C7B6A", letterSpacing: 0.55, textTransform: "uppercase", marginBottom: 8 }}
              numberOfLines={1}
            >
              TÉLÉPHONE
            </AppText>
            <View
              style={{
                minHeight: 55,
                borderRadius: 16,
                backgroundColor: "#FCFCFE",
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <AppTextInput
                value={pickupPhone}
                onChangeText={setPickupPhone}
                placeholder="6XXXXXXX."
                placeholderTextColor={"rgba(60,74,60,0.4)"}
                keyboardType="phone-pad"
                style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodyRegular, color: colors.text }}
              />
            </View>
          </View>
        </View>
      )}

      <View style={{ marginTop: 14, paddingBottom: 10 }}>
        <Pressable
          onPress={() => {
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
              router.push({
                pathname: "/resume-produit-en-stock",
                params: {
                  quartier,
                  deliveryAddress: livDeliveryAddress.trim(),
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
              router.push({
                pathname: "/resume-produit-ramasse",
                params: {
                  quartier,
                  deliveryAddress: livDeliveryAddress.trim(),
                  pickupName,
                  pickupAddress,
                  pickupQty,
                  pickupExpress,
                  pickupCollectCash,
                  pickupAmount,
                  pickupPhone,
                },
              });
            }
          }}
          disabled={mode === "pickup" ? !canContinuePickup : false}
          style={{
            minHeight: 68,
            borderRadius: 24,
            paddingVertical: 18,
            backgroundColor:
              mode === "pickup" && !canContinuePickup ? "rgba(41,127,198,0.45)" : "#297FC6",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#297FC6",
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.15,
            shadowRadius: 25,
            elevation: 6,
          }}
        >
          <AppText style={{ fontSize: 18, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
            Continuer
          </AppText>
        </Pressable>
      </View>
    </ScreenLayout>
  );
}
