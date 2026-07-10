import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AccueilScreen from "@/app/(tabs)/index";
import { listTransactions } from "@/lib/api/transactions";
import { getCurrentUser } from "@/lib/auth/currentUser";

jest.mock("@/lib/haptics", () => ({
  hapticLight: jest.fn(async () => undefined),
}));

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("expo-router/react-navigation", () => ({
  useFocusEffect: (cb: () => void) => {
    const React = require("react");
    React.useEffect(() => cb(), [cb]);
  },
}));

jest.mock("@/lib/api/transactions", () => {
  const actual = jest.requireActual<typeof import("@/lib/api/transactions")>("@/lib/api/transactions");
  return {
    ...actual,
    listTransactions: jest.fn(),
  };
});

jest.mock("@/lib/auth/currentUser", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/components/SolarIcon", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View /> };
});

jest.mock("@/components/ScreenLayout", () => {
  const React = require("react");
  const { View, ScrollView } = require("react-native");
  return {
    __esModule: true,
    default: ({ children, header }: { children: React.ReactNode; header?: React.ReactNode }) => (
      <View testID="screen-layout">
        {header}
        <ScrollView>{children}</ScrollView>
      </View>
    ),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...props }: { children: React.ReactNode }) => (
      <View testID="promo-banner" {...props}>
        {children}
      </View>
    ),
  };
});

const mockListTransactions = listTransactions as jest.Mock;
const mockGetCurrentUser = getCurrentUser as jest.Mock;

function renderAccueil() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <AccueilScreen />
    </SafeAreaProvider>,
  );
}

describe("AccueilScreen promo banner", () => {
  beforeEach(() => {
    mockListTransactions.mockReset();
    mockGetCurrentUser.mockReset();
    mockGetCurrentUser.mockResolvedValue({
      id: 1,
      first_name: "Alice",
      name: "Alice User",
    });
  });

  it("shows promo banner when the customer has no transactions", async () => {
    mockListTransactions.mockResolvedValue([]);

    const screen = renderAccueil();

    await waitFor(() => {
      expect(screen.getByText("Offre de bienvenue")).toBeTruthy();
    });
  });

  it("hides promo banner when the customer already has transactions", async () => {
    mockListTransactions.mockResolvedValue([
      {
        id: 42,
        package_name: "Sac",
        type: "delivery",
        source: "stock",
        status: "pending",
        transactionReference: "LVS-TEST",
      },
    ]);

    const screen = renderAccueil();

    await waitFor(() => {
      expect(screen.getByText("Dernière commande")).toBeTruthy();
      expect(screen.queryByText("Offre de bienvenue")).toBeNull();
    });
  });

  it("hides promo banner when transaction load fails", async () => {
    mockListTransactions.mockRejectedValue(new Error("Network error"));

    const screen = renderAccueil();

    await waitFor(() => {
      expect(screen.getByText("Impossible de charger vos commandes")).toBeTruthy();
      expect(screen.queryByText("Offre de bienvenue")).toBeNull();
    });
  });
});
