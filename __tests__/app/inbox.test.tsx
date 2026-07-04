const mockUseLocalSearchParams = jest.fn(() => ({ id: "1001" }));

jest.mock("expo-router", () => ({
  router: { back: jest.fn(), push: jest.fn() },
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

jest.mock("@/lib/api/transactions", () => ({
  getTransactionById: jest.fn(),
}));

jest.mock("@/lib/api/tickets", () => ({
  loadClientThread: jest.fn(),
  sendClientMessage: jest.fn(),
  resolveNumericTransactionIdFromRoute: jest.fn(),
}));

jest.mock("@/lib/auth/currentUser", () => ({
  getCurrentUserId: jest.fn(),
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
    default: ({ children, footer, header }: { children: React.ReactNode; footer?: React.ReactNode; header?: React.ReactNode }) => (
      <View>
        {header}
        {children}
        {footer}
      </View>
    ),
  };
});

import React from "react";
import { Alert } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import InboxChatScreen from "@/app/inbox/[id]";
import { getTransactionById } from "@/lib/api/transactions";
import { loadClientThread, sendClientMessage, resolveNumericTransactionIdFromRoute } from "@/lib/api/tickets";
import { getCurrentUserId } from "@/lib/auth/currentUser";

const mockLoadClientThread = loadClientThread as jest.Mock;
const mockSendClientMessage = sendClientMessage as jest.Mock;
const mockResolveNumericTransactionIdFromRoute = resolveNumericTransactionIdFromRoute as jest.Mock;
const mockGetTransactionById = getTransactionById as jest.Mock;
const mockGetCurrentUserId = getCurrentUserId as jest.Mock;

function renderScreen() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <InboxChatScreen />
    </SafeAreaProvider>,
  );
}

describe("InboxChatScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({ id: "1001" });
    mockResolveNumericTransactionIdFromRoute.mockResolvedValue(1001);
    mockGetCurrentUserId.mockResolvedValue(3);
    mockGetTransactionById.mockResolvedValue({
      id: 1001,
      transactionReference: "LVS-1",
      type: "delivery",
      status: "pending",
      destination: { street: "Bastos" },
    });
    mockLoadClientThread.mockResolvedValue({
      ticket: {
        id: 12,
        channel: "client",
        status: "open",
        createdAt: "2026-06-14T10:00:00.000Z",
        lastUpdatedAt: "2026-06-14T10:00:00.000Z",
        isMessageRead: true,
        assignedAgent: 5,
        createdBy: 3,
        transaction: 1001,
      },
      messages: [
        {
          id: 1,
          content: "Bonjour depuis le support",
          ticketId: 12,
          senderId: 5,
          createdAt: "2026-06-14T10:00:00.000Z",
        },
      ],
    });
    mockSendClientMessage.mockResolvedValue({
      id: 12,
      channel: "client",
      status: "open",
      createdAt: "2026-06-14T10:00:00.000Z",
      lastUpdatedAt: "2026-06-14T11:00:00.000Z",
      isMessageRead: true,
      assignedAgent: 5,
      createdBy: 3,
      transaction: 1001,
    });
    jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders messages from the ticket API", async () => {
    const { findByText } = renderScreen();
    expect(await findByText("Bonjour depuis le support")).toBeTruthy();
  });

  it("sends a message when the user submits", async () => {
    const { findByPlaceholderText, getByLabelText } = renderScreen();
    const input = await findByPlaceholderText("Écrire un message...");
    fireEvent.changeText(input, "Ma réponse");
    fireEvent.press(getByLabelText("Envoyer le message"));

    await waitFor(() => {
      expect(mockSendClientMessage).toHaveBeenCalledWith(1001, 12, "Ma réponse");
    });
  });

  it("marks ticket read in report compose mode without loading messages", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "1001", intent: "report" });
    mockLoadClientThread.mockResolvedValue({ ticket: null, messages: [] });
    const { findByText, queryByText } = renderScreen();

    expect(await findByText(/Décrivez votre problème dans le champ ci-dessous/)).toBeTruthy();
    expect(queryByText("Bonjour depuis le support")).toBeNull();
    expect(mockLoadClientThread).toHaveBeenCalledWith(1001, { composeOnly: true });
  });

  it("creates the ticket only when the user sends in report compose mode", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "1001", intent: "report" });
    const { findByPlaceholderText, getByLabelText } = renderScreen();
    const input = await findByPlaceholderText("Décrivez votre problème...");
    fireEvent.changeText(input, "Mon colis est endommagé");
    fireEvent.press(getByLabelText("Envoyer le message"));

    await waitFor(() => {
      expect(mockSendClientMessage).toHaveBeenCalledWith(1001, null, "Mon colis est endommagé");
    });
  });
});
