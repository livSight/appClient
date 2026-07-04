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

const mockGetCurrentUser = jest.fn(async () => ({
  id: 3,
  first_name: "Snake",
  last_name: "User",
  email: "snake123@example.com",
  phone: "+221 77 000 00 00",
}));

jest.mock("@/lib/auth/currentUser", () => ({
  getCurrentUser: (...args: unknown[]) => mockGetCurrentUser(...args),
  getCurrentUserId: jest.fn(),
  resetCurrentUserIdCache: jest.fn(),
}));

jest.mock("expo-router/react-navigation", () => ({
  useFocusEffect: (cb: () => void) => {
    const React = require("react");
    React.useEffect(() => cb(), [cb]);
  },
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

describe("ProfileScreen", () => {
  beforeEach(() => {
    mockLogout.mockReset();
    mockReplace.mockReset();
    mockLogout.mockResolvedValue(undefined);
    mockGetCurrentUser.mockReset();
    mockGetCurrentUser.mockResolvedValue({
      id: 3,
      first_name: "Snake",
      last_name: "User",
      email: "snake123@example.com",
      phone: "+221 77 000 00 00",
    });
  });

  it("shows name, email, and initials after load", async () => {
    const screen = renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Snake User")).toBeTruthy();
      expect(screen.getByText("snake123@example.com")).toBeTruthy();
      expect(screen.getByText("SU")).toBeTruthy();
    });
  });

  it("shows error and retry when profile load fails", async () => {
    mockGetCurrentUser.mockRejectedValueOnce(new Error("Network error"));

    const screen = renderProfile();

    await waitFor(() => {
      expect(screen.getByText("Impossible de charger votre profil")).toBeTruthy();
      expect(screen.getByText("Network error")).toBeTruthy();
    });
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
