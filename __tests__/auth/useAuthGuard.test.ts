import { renderHook, waitFor } from "@testing-library/react-native";
import { resolveAuthGuardRedirect, useAuthGuard } from "@/lib/auth/useAuthGuard";

const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: (...args: unknown[]) => mockReplace(...args),
  }),
}));

const mockUseAuth = jest.fn();

jest.mock("@/lib/auth/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("resolveAuthGuardRedirect", () => {
  it("shows splash while session is restoring", () => {
    expect(
      resolveAuthGuardRedirect({
        pathname: "/(tabs)",
        isAuthenticated: false,
        isLoading: true,
      }),
    ).toEqual({ showSplash: true, redirectTo: null });
  });

  it("redirects unauthenticated users away from protected routes", () => {
    expect(
      resolveAuthGuardRedirect({
        pathname: "/(tabs)/livraison",
        isAuthenticated: false,
        isLoading: false,
      }),
    ).toEqual({ showSplash: false, redirectTo: "/login" });
  });

  it("allows unauthenticated users to stay on /login", () => {
    expect(
      resolveAuthGuardRedirect({
        pathname: "/login",
        isAuthenticated: false,
        isLoading: false,
      }),
    ).toEqual({ showSplash: false, redirectTo: null });
  });

  it("allows authenticated users on tab routes", () => {
    expect(
      resolveAuthGuardRedirect({
        pathname: "/(tabs)",
        isAuthenticated: true,
        isLoading: false,
      }),
    ).toEqual({ showSplash: false, redirectTo: null });
  });

  it("redirects authenticated users away from /login", () => {
    expect(
      resolveAuthGuardRedirect({
        pathname: "/login",
        isAuthenticated: true,
        isLoading: false,
      }),
    ).toEqual({ showSplash: false, redirectTo: "/(tabs)" });
  });
});

describe("useAuthGuard", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    });
  });

  it("returns showSplash true while auth is loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    });

    const { result } = renderHook(() => useAuthGuard("/(tabs)"));

    expect(result.current.showSplash).toBe(true);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("calls router.replace('/login') when unauthenticated on a protected route", async () => {
    const { result } = renderHook(() => useAuthGuard("/profile"));

    expect(result.current.showSplash).toBe(false);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("does not redirect from /login when logged out", async () => {
    renderHook(() => useAuthGuard("/login"));

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it("calls router.replace('/(tabs)') when authenticated on /login", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { keycloakId: "abc", email: "user@example.com" },
      login: jest.fn(),
      logout: jest.fn(),
    });

    renderHook(() => useAuthGuard("/login"));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/(tabs)");
    });
  });
});
