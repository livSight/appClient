import { shouldRegisterPushNotifications } from "@/lib/push/pushConfig";

describe("shouldRegisterPushNotifications", () => {
  it("is disabled in dev unless EXPO_PUBLIC_ENABLE_PUSH is set", () => {
    expect(shouldRegisterPushNotifications({ dev: true, enablePushEnv: undefined })).toBe(false);
    expect(shouldRegisterPushNotifications({ dev: true, enablePushEnv: "" })).toBe(false);
    expect(shouldRegisterPushNotifications({ dev: true, enablePushEnv: "true" })).toBe(true);
    expect(shouldRegisterPushNotifications({ dev: true, enablePushEnv: "1" })).toBe(true);
  });

  it("is enabled in production builds", () => {
    expect(shouldRegisterPushNotifications({ dev: false, enablePushEnv: undefined })).toBe(true);
  });
});
