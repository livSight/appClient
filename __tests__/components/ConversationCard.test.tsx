import { render } from "@testing-library/react-native";
import TransactionCard from "@/components/TransactionCard";
import { mapConversationToTransactionCardItem } from "@/lib/api/conversationUi";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
}));

jest.mock("@/lib/haptics", () => ({
  hapticLight: jest.fn(async () => undefined),
}));

jest.mock("@/components/SolarIcon", () => {
  const React = require("react");
  const { View } = require("react-native");
  return { __esModule: true, default: () => <View testID="icon" /> };
});

describe("inbox conversation cards", () => {
  it("renders mapped conversations with TransactionCard layout", () => {
    const item = mapConversationToTransactionCardItem({
      id: "1",
      refLabel: "REF: LVS-1",
      timeLabel: "il y a 2 h",
      type: "livraison",
      title: "Sac x2",
      locationLine: "Akwa",
      subtitle: "Agent : Le coursier arrive",
      isUnread: true,
      unreadCount: 1,
    });

    const { getByText, queryByText } = render(<TransactionCard item={item} />);
    // WhatsApp-style card: no order reference, no product — quartier + message preview.
    expect(queryByText(/^REF /)).toBeNull();
    expect(queryByText(/Sac x2/)).toBeNull();
    expect(getByText("1 NON LU")).toBeTruthy();
    expect(getByText("Akwa")).toBeTruthy();
    expect(getByText(/Agent : Le coursier arrive/)).toBeTruthy();
    expect(getByText("LIVRAISON")).toBeTruthy();
  });
});
