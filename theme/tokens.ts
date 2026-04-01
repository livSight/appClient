// ─── Colors ──────────────────────────────────────────────────────────────────
export const colors = {
  bg: "#F8F9FA",
  primary: "#3090C0",
  primaryDark: "#1D6E96",
  text: "#191C1D",
  muted: "#3C4A3C",
  white: "#FFFFFF",
  cardBg: "#FFFFFF",
  cardStroke: "#BBCBB8",
  iconBg: "#E9F4FB",
  placeholderBg: "#EEF2F7",
  tabInactive: {
    commandes: "#64748B",
    rapports: "#94A3B8",
    stock: "#6B7280",
  },
} as const;

// ─── Border Radii ────────────────────────────────────────────────────────────
export const radii = {
  card: 32,
  pill: 9999,
  icon: 20,
} as const;

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const spacing = {
  screenPaddingX: 24,
  sectionGap: 40,
  cardPadding: 24,
  gridColGap: 12,
  gridRowGap: 4,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const shadows = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;

// ─── Typography ──────────────────────────────────────────────────────────────
export const typography = {
  screenTitle: {
    fontWeight: "800" as const,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.9,
    color: colors.text,
  },
  subtitle: {
    fontWeight: "500" as const,
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
  sectionTitle: {
    fontWeight: "700" as const,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.5,
    color: colors.text,
  },
  cardTitle: {
    fontWeight: "700" as const,
    fontSize: 18,
    lineHeight: 28,
    color: colors.text,
  },
  cardSubtitle: {
    fontWeight: "500" as const,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.6,
    color: colors.muted,
  },
  bodyRegular: {
    fontWeight: "400" as const,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
  label: {
    fontWeight: "700" as const,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    color: colors.white,
  },
  link: {
    fontWeight: "700" as const,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
  buttonText: {
    fontWeight: "700" as const,
    fontSize: 14,
    lineHeight: 20,
    color: colors.primary,
  },
  buttonTextInverse: {
    fontWeight: "700" as const,
    fontSize: 14,
    lineHeight: 20,
    color: colors.white,
  },
  bannerTitle: {
    fontWeight: "800" as const,
    fontSize: 24,
    lineHeight: 30,
    color: colors.white,
  },
} as const;
