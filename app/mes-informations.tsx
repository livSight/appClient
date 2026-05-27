import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import AppText from "@/components/AppText";
import ScreenLayout from "@/components/ScreenLayout";
import SolarIcon from "@/components/SolarIcon";
import { card } from "@/theme/styles";
import { colors, fonts, radii, spacing, typography } from "@/theme/tokens";
import { getUserById, type User } from "@/lib/api/users";

type UserDetails = User & {
  city?: string;
  region?: string;
  street?: string;
  roles?: string[];
  dateOfBird?: string;
};

function InfoRow({ label, value, iconName }: { label: string; value?: string | null; iconName?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 }}>
      {iconName ? (
        <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center", marginTop: 2 }}>
          <SolarIcon name={iconName} size={20} color={colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="dense" style={{ fontSize: 11, lineHeight: 16, fontFamily: fonts.bodyBold, color: "rgba(60,74,60,0.6)", letterSpacing: 1.1 }} numberOfLines={1}>
          {label.toUpperCase()}
        </AppText>
        <AppText style={{ fontSize: 16, lineHeight: 22, fontFamily: fonts.bodySemi, color: colors.text, marginTop: 6 }} numberOfLines={3} ellipsizeMode="tail">
          {value?.trim?.() ? value : "—"}
        </AppText>
      </View>
    </View>
  );
}

function SectionHeading({ iconName, title }: { iconName: string; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(48,144,192,0.10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SolarIcon name={iconName} size={20} color={colors.primary} />
      </View>
      <AppText style={{ ...typography.sectionTitle, fontSize: 18, lineHeight: 26 }} numberOfLines={1}>
        {title}
      </AppText>
    </View>
  );
}

function formatDateFr(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function MesInformationsScreen() {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fullName = useMemo(() => {
    const name = String(user?.name ?? "").trim();
    if (name) return name;
    const first = String(user?.first_name ?? "").trim();
    const last = String(user?.last_name ?? "").trim();
    const both = `${first} ${last}`.trim();
    return both || "—";
  }, [user?.first_name, user?.last_name, user?.name]);

  const rolesLabel = useMemo(() => {
    const roles = Array.isArray(user?.roles) ? user!.roles!.filter(Boolean) : [];
    return roles.length ? roles.join(" · ") : "—";
  }, [user?.roles]);

  const initials = useMemo(() => {
    const first = String(user?.first_name ?? "").trim();
    const last = String(user?.last_name ?? "").trim();
    if (first || last) {
      const a = first ? first[0] : "";
      const b = last ? last[0] : "";
      const s = `${a}${b}`.trim();
      if (s.length) return s.toUpperCase();
    }
    const name = String(user?.name ?? "").trim();
    if (!name) return "A";
    const parts = name.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "";
    const b = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    const s = `${a}${b}`.trim();
    return (s.length ? s : "A").toUpperCase();
  }, [user?.first_name, user?.last_name, user?.name]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserById(1);
      setUser(data as UserDetails);
    } catch (e: any) {
      setUser(null);
      setError(String(e?.message ?? e ?? "Erreur"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenLayout
      header={
        <View style={{ flexDirection: "row", alignItems: "center", minHeight: 44, paddingVertical: 8, marginBottom: 12 }}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={{ width: 44, height: 44, justifyContent: "center" }}>
            <SolarIcon name="solar:alt-arrow-left-outline" size={24} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: "center" }}>
            <AppText style={{ ...typography.sectionTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={1}>
              Mes informations
            </AppText>
          </View>
          <View style={{ width: 44, height: 44 }} />
        </View>
      }
    >
      {loading ? (
        <View style={[card.base, { padding: 20 }]}>
          <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
            Chargement…
          </AppText>
        </View>
      ) : error ? (
        <View style={[card.base, { padding: 20 }]}>
          <AppText style={{ ...typography.cardTitle, fontSize: 16, lineHeight: 24 }} numberOfLines={2}>
            Impossible de charger vos informations
          </AppText>
          <AppText style={{ ...typography.subtitle, marginTop: 6 }} numberOfLines={3} ellipsizeMode="tail">
            {error}
          </AppText>
          <Pressable
            onPress={load}
            hitSlop={10}
            style={{
              marginTop: 14,
              minHeight: 44,
              borderRadius: radii.pill,
              paddingHorizontal: 16,
              alignSelf: "flex-start",
              backgroundColor: colors.primary,
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 10,
            }}
          >
            <AppText style={{ fontSize: 14, lineHeight: 20, fontFamily: fonts.bodyBold, color: colors.white }} numberOfLines={1}>
              Réessayer
            </AppText>
          </Pressable>
        </View>
      ) : (
        <View style={{ gap: 16 }}>
          <View style={[card.base, { padding: 20, flexDirection: "row", alignItems: "center", gap: 16 }]}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "rgba(48,144,192,0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText style={{ fontSize: 22, lineHeight: 28, fontFamily: fonts.bodyBold, color: colors.primary }} numberOfLines={1}>
                {initials}
              </AppText>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText style={{ fontSize: 18, lineHeight: 24, fontFamily: fonts.bodyBold, color: colors.text }} numberOfLines={1} ellipsizeMode="tail">
                {fullName}
              </AppText>
              <AppText style={{ ...typography.subtitle, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">
                {rolesLabel}
              </AppText>
            </View>
          </View>

          <View style={[card.base, { padding: 20 }]}>
            <SectionHeading iconName="solar:user-id-bold-duotone" title="Identité" />
            <View style={{ marginTop: 10 }}>
              <InfoRow iconName="solar:user-outline" label="Nom" value={fullName} />
              <InfoRow iconName="solar:letter-outline" label="Email" value={String(user?.email ?? "")} />
              <InfoRow iconName="solar:phone-outline" label="Téléphone" value={String(user?.phone ?? "")} />
              <InfoRow iconName="solar:tag-outline" label="Rôles" value={rolesLabel} />
              <InfoRow iconName="solar:calendar-outline" label="Date de naissance" value={formatDateFr(String((user as any)?.dateOfBird ?? ""))} />
            </View>
          </View>

          <View style={[card.base, { padding: 20 }]}>
            <SectionHeading iconName="solar:map-point-bold-duotone" title="Adresse" />
            <View style={{ marginTop: 10 }}>
              <InfoRow iconName="solar:map-point-outline" label="Ville" value={String((user as any)?.city ?? "")} />
              <InfoRow iconName="solar:map-point-outline" label="Région" value={String((user as any)?.region ?? "")} />
              <InfoRow iconName="solar:map-point-outline" label="Rue" value={String((user as any)?.street ?? "")} />
            </View>
          </View>
        </View>
      )}

      <View style={{ height: spacing.sectionGap }} />
    </ScreenLayout>
  );
}

