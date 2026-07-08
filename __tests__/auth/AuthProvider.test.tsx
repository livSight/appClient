import React from "react";
import { Pressable, Text, View } from "react-native";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { createAuthProvider } from "@/lib/auth/AuthProvider";
import type { AuthSession, SessionUser } from "@/lib/auth/session";

const sampleUser: SessionUser = {
  keycloakId: "5785160a-6c5c-44d5-96fd-d28aa677d8d4",
  email: "snake123@example.com",
};

function createMockSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    loginAndPersist: jest.fn(),
    login: jest.fn(),
    getValidAccessToken: jest.fn(),
    getAccessToken: jest.fn(),
    forceRefreshAccessToken: jest.fn(),
    logout: jest.fn(),
    getSessionUser: jest.fn(),
    ...overrides,
  };
}

function renderWithSession(session: AuthSession) {
  const { AuthProvider, useAuth } = createAuthProvider({ session });

  function Probe() {
    const auth = useAuth();
    return (
      <View>
        <Text testID="loading">{String(auth.isLoading)}</Text>
        <Text testID="authenticated">{String(auth.isAuthenticated)}</Text>
        <Text testID="email">{auth.user?.email ?? ""}</Text>
        <Pressable
          testID="login"
          onPress={() => auth.login({ username: "snake123@example.com", password: "Abc123" })}
        />
        <Pressable testID="logout" onPress={() => auth.logout()} />
      </View>
    );
  }

  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe("AuthProvider", () => {
  it("starts unauthenticated after session restore", async () => {
    const session = createMockSession({
      getSessionUser: jest.fn().mockResolvedValue(null),
    });

    const screen = renderWithSession(session);

    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("false");
    });

    expect(screen.getByTestId("authenticated").props.children).toBe("false");
    expect(session.getSessionUser).toHaveBeenCalled();
  });

  it("sets isAuthenticated true after login succeeds", async () => {
    const session = createMockSession({
      getSessionUser: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(sampleUser)
        .mockResolvedValue(sampleUser),
      login: jest.fn().mockResolvedValue(undefined),
    });

    const screen = renderWithSession(session);

    await waitFor(() => {
      expect(screen.getByTestId("loading").props.children).toBe("false");
    });

    fireEvent.press(screen.getByTestId("login"));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").props.children).toBe("true");
    });

    expect(screen.getByTestId("email").props.children).toBe(sampleUser.email);
    expect(session.login).toHaveBeenCalledWith({
      username: "snake123@example.com",
      password: "Abc123",
    });
  });

  it("resets state on logout", async () => {
    const session = createMockSession({
      getSessionUser: jest.fn().mockResolvedValue(sampleUser),
      logout: jest.fn().mockResolvedValue(undefined),
    });

    const screen = renderWithSession(session);

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").props.children).toBe("true");
    });

    fireEvent.press(screen.getByTestId("logout"));

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").props.children).toBe("false");
    });

    expect(session.logout).toHaveBeenCalledTimes(1);
  });

  it("restores an existing session on mount", async () => {
    const session = createMockSession({
      getSessionUser: jest.fn().mockResolvedValue(sampleUser),
    });

    const screen = renderWithSession(session);

    await waitFor(() => {
      expect(screen.getByTestId("authenticated").props.children).toBe("true");
    });

    expect(screen.getByTestId("email").props.children).toBe(sampleUser.email);
  });
});

describe("useAuth", () => {
  it("throws when used outside AuthProvider", () => {
    const { useAuth } = createAuthProvider({ session: createMockSession() });

    function Orphan() {
      useAuth();
      return null;
    }

    expect(() => render(<Orphan />)).toThrow("useAuth must be used within AuthProvider");
  });
});
