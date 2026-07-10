import { renderHook, act } from "@testing-library/react-native";
import { Keyboard, Platform } from "react-native";
import { useKeyboardInsets } from "@/lib/hooks/useKeyboardVisible";

describe("useKeyboardInsets", () => {
  const listeners = new Map<string, (event?: { endCoordinates: { height: number } }) => void>();

  beforeEach(() => {
    listeners.clear();
    jest.spyOn(Keyboard, "addListener").mockImplementation((event, callback) => {
      listeners.set(event, callback as (event?: { endCoordinates: { height: number } }) => void);
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns zero height when keyboard is hidden", () => {
    const { result } = renderHook(() => useKeyboardInsets());
    expect(result.current).toEqual({ visible: false, height: 0 });
  });

  it("tracks keyboard height on show and resets on hide", () => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const { result } = renderHook(() => useKeyboardInsets());

    act(() => {
      listeners.get(showEvent)?.({ endCoordinates: { height: 336 } });
    });
    expect(result.current).toEqual({ visible: true, height: 336 });

    act(() => {
      listeners.get(hideEvent)?.();
    });
    expect(result.current).toEqual({ visible: false, height: 0 });
  });
});
