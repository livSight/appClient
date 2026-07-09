import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LoginScreen from "@/app/login";
import { AuthError } from "@/lib/auth/authApi";

const mockLogin = jest.fn();
const mockReplace = jest.fn();

const mockExpoConfig = { name: "livsight" };

jest.mock("expo-router", () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
  },
}));

jest.mock("expo-constants", () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return mockExpoConfig;
    },
  },
}));

jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: (props: Record<string, unknown>) => <View testID="login-logo" {...props} />,
  };
});

jest.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => ({
    login: mockLogin,
    logout: jest.fn(),
    isAuthenticated: false,
    isLoading: false,
    user: null,
  }),
}));

jest.mock("@/lib/haptics", () => ({
  hapticLight: jest.fn(async () => undefined),
  hapticSuccess: jest.fn(async () => undefined),
  hapticError: jest.fn(async () => undefined),
}));

jest.mock("@/components/SolarIcon", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: () => <View />,
  };
});

jest.mock("@/components/HeroGridBackground", () => {
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
    default: ({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) => (
      <View testID="screen-layout">
        <ScrollView>{children}</ScrollView>
        {footer}
      </View>
    ),
  };
});

function renderLogin() {
  return render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <LoginScreen />
    </SafeAreaProvider>,
  );
}

describe("LoginScreen", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockReplace.mockReset();
    mockLogin.mockResolvedValue(undefined);
    mockExpoConfig.name = "livsight";
  });

  it("renders welcome header, email and password fields with submit button", () => {
    const screen = renderLogin();

    expect(screen.getByText("Bienvenue")).toBeTruthy();
    expect(screen.getByTestId("login-logo")).toBeTruthy();
    expect(screen.getByText("Adresse e-mail")).toBeTruthy();
    expect(screen.getByText("Mot de passe")).toBeTruthy();
    expect(screen.getByText("Se connecter")).toBeTruthy();
    expect(screen.getByTestId("login-email")).toBeTruthy();
    expect(screen.getByTestId("login-password")).toBeTruthy();
    expect(screen.queryByTestId("login-staging-badge")).toBeNull();
  });

  it("calls useAuth login with trimmed form values on submit", async () => {
    const screen = renderLogin();

    fireEvent.changeText(screen.getByTestId("login-email"), "  snake123@example.com  ");
    fireEvent.changeText(screen.getByTestId("login-password"), "Abc123");
    fireEvent.press(screen.getByText("Se connecter"));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: "snake123@example.com",
        password: "Abc123",
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
  });

  it("submits when the password field fires submitEditing", async () => {
    const screen = renderLogin();

    fireEvent.changeText(screen.getByTestId("login-email"), "snake123@example.com");
    fireEvent.changeText(screen.getByTestId("login-password"), "Abc123");
    fireEvent(screen.getByTestId("login-password"), "submitEditing");

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        username: "snake123@example.com",
        password: "Abc123",
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
  });

  it("toggles password visibility", () => {
    const screen = renderLogin();
    const passwordInput = screen.getByTestId("login-password");

    expect(passwordInput.props.secureTextEntry).toBe(true);

    fireEvent.press(screen.getByTestId("login-password-toggle"));
    expect(passwordInput.props.secureTextEntry).toBe(false);

    fireEvent.press(screen.getByTestId("login-password-toggle"));
    expect(passwordInput.props.secureTextEntry).toBe(true);
  });

  it("shows staging badge on staging builds", () => {
    mockExpoConfig.name = "livsight Staging";

    const screen = renderLogin();

    expect(screen.getByTestId("login-staging-badge")).toBeTruthy();
    expect(screen.getByText("Staging")).toBeTruthy();
  });

  it("shows a French error message on 401", async () => {
    mockLogin.mockRejectedValue(new AuthError("Unauthorized", 401));

    const screen = renderLogin();

    fireEvent.changeText(screen.getByTestId("login-email"), "wrong@example.com");
    fireEvent.changeText(screen.getByTestId("login-password"), "bad");
    fireEvent.press(screen.getByText("Se connecter"));

    await waitFor(() => {
      expect(screen.getByText(/identifiants incorrects/i)).toBeTruthy();
    });

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("disables submit while login is in progress", async () => {
    let resolveLogin!: () => void;
    mockLogin.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveLogin = resolve;
        }),
    );

    const screen = renderLogin();

    fireEvent.changeText(screen.getByTestId("login-email"), "snake123@example.com");
    fireEvent.changeText(screen.getByTestId("login-password"), "Abc123");
    fireEvent.press(screen.getByText("Se connecter"));

    await waitFor(() => {
      expect(screen.getByText("Connexion…")).toBeTruthy();
    });

    fireEvent.press(screen.getByText("Connexion…"));
    expect(mockLogin).toHaveBeenCalledTimes(1);

    resolveLogin();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });
});
