import { emitPushReceived, onPushReceived } from "@/lib/push/pushNotificationEvents";

describe("pushNotificationEvents", () => {
  it("notifies subscribers when a push is received", () => {
    const listener = jest.fn();
    const unsubscribe = onPushReceived(listener);

    emitPushReceived({
      type: "driver_assigned",
      transactionId: "1001",
    });

    expect(listener).toHaveBeenCalledWith({
      type: "driver_assigned",
      transactionId: "1001",
    });

    unsubscribe();
    emitPushReceived({ type: "ticket_message", transactionId: "1001", ticketId: "12" });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
