import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ProfileScreen from "@/app/profile";

const mockLogout = jest.fn();
const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    replace: (...args: unknown[]) => mockReplace(...args),
    push: jest.fn(),
  },
}));

jest.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({
    logout: mockLogout,
    login: jest.fn(),
    isAuthenticated: true,
    isLoading: false,
    user: { keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4", email: "snake123@example.com" },
  }),
}));

jest.mock("@/lib/api/users", () => ({
  getCurrentUser: jest.fn(async () => ({
    id: 3,
    name: "Snake User",
    phone: "+221 77 000 00 00",
  })),
}));

jest.mock("@/lib/haptics", () => ({
  hapticLight: jest.fn(async () => undefined),
}));

jest.mock("@/components/SolarIcon", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View />,
  };
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

function renderProfile() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ProfileScreen />
    </SafeAreaProvider>,
  );
}

describe("ProfileScreen logout", () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockReplace.mockReset();
    mockLogout.mockResolvedValue(undefined);
  });

  it("calls useAuth logout and redirects to login", async () => {
    const screen = renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Snake User")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("profile-logout"));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });

    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
