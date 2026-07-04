import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AnnulationScreen from "@/app/annulation";

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCancelTransaction = jest.fn();
const mockGetTransactionById = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: (...args: unknown[]) => mockBack(...args),
    replace: (...args: unknown[]) => mockReplace(...args),
  },
  useLocalSearchParams: () => ({ id: "42" }),
}));

jest.mock("@/lib/api/transactions", () => ({
  cancelTransaction: (...args: unknown[]) => mockCancelTransaction(...args),
  getTransactionById: (...args: unknown[]) => mockGetTransactionById(...args),
  canClientCancelTransaction: (status?: string | null) => String(status ?? "").trim().toLowerCase() === "pending",
  CLIENT_CANCEL_BLOCKED_MESSAGE:
    "Cette livraison est déjà en cours. Seules les commandes en attente peuvent être annulées depuis l'application.",
}));

jest.mock("@/lib/haptics", () => ({
  hapticSuccess: jest.fn(async () => undefined),
}));

jest.mock("@/components/SolarIcon", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View /> };
});

jest.mock("@/components/AppTextInput", () => {
  const React = require("react");
  const { TextInput } = require("react-native");
  return {
    __esModule: true,
    default: (props: React.ComponentProps<typeof TextInput>) => <TextInput {...props} />,
  };
});

jest.mock("@/components/ScreenLayout", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) => (
      <View>
        {children}
        {footer}
      </View>
    ),
  };
});

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <AnnulationScreen />
    </SafeAreaProvider>,
  );
}

describe("AnnulationScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactionById.mockResolvedValue({ id: 42, status: "pending", type: "delivery" });
    mockCancelTransaction.mockResolvedValue({ id: 42, status: "failed" });
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls cancelTransaction and navigates to confirmation on success", async () => {
    const { findByText, getByText } = renderScreen();

    await findByText(/Dites-nous pourquoi/);
    fireEvent.press(getByText(/Confirmer l/));

    await waitFor(() => {
      expect(mockCancelTransaction).toHaveBeenCalledWith("42", {
        reason: "Client injoignable",
        details: undefined,
      });
    });

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/annulation-confirmee",
      params: { id: "42" },
    });
  });

  it("shows an alert when cancelTransaction fails", async () => {
    mockCancelTransaction.mockRejectedValueOnce(new Error("HTTP 500"));
    const { findByText, getByText } = renderScreen();

    await findByText(/Dites-nous pourquoi/);
    fireEvent.press(getByText(/Confirmer l/));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Erreur", "HTTP 500");
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("blocks cancellation when status is not pending", async () => {
    mockGetTransactionById.mockResolvedValueOnce({ id: 42, status: "processing", type: "delivery" });
    const { findByText, getByText } = renderScreen();

    await findByText(/Dites-nous pourquoi/);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Annulation impossible",
        expect.stringContaining("déjà en cours"),
        expect.any(Array),
      );
    });

    fireEvent.press(getByText(/Confirmer l/));
    expect(mockCancelTransaction).not.toHaveBeenCalled();
  });
});
