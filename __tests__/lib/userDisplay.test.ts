import { displayFullName, displayInitials } from "@/lib/userDisplay";
import type { User } from "@/lib/api/users";

describe("displayFullName", () => {
  it("prefers name field", () => {
    expect(displayFullName({ name: "Top G", first_name: "Top", last_name: "G" })).toBe("Top G");
  });

  it("joins first and last name", () => {
    expect(displayFullName({ first_name: "Eric", last_name: "Djou" })).toBe("Eric Djou");
  });

  it("returns em dash when empty", () => {
    expect(displayFullName(null)).toBe("—");
    expect(displayFullName({})).toBe("—");
  });
});

describe("displayInitials", () => {
  it("uses first and last name initials", () => {
    expect(displayInitials({ first_name: "Top", last_name: "G" })).toBe("TG");
  });

  it("falls back to name tokens", () => {
    expect(displayInitials({ name: "Snake User" })).toBe("SU");
  });

  it("returns A when no name data", () => {
    expect(displayInitials(null)).toBe("A");
  });
});
