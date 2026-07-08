import {
  AUTOCOMPLETE_MIN_QUERY_LENGTH,
  filterInventoryByName,
  isAutocompleteQueryReady,
} from "@/lib/formAutocomplete";

describe("formAutocomplete", () => {
  const items = [
    { id: "1", name: "Acide Glycolique" },
    { id: "2", name: "Crème visage" },
    { id: "3", name: "Huile de coco" },
  ];

  it("isAutocompleteQueryReady requires minimum length", () => {
    expect(isAutocompleteQueryReady("")).toBe(false);
    expect(isAutocompleteQueryReady("a")).toBe(false);
    expect(isAutocompleteQueryReady("ac")).toBe(true);
    expect(isAutocompleteQueryReady("  ac  ")).toBe(true);
  });

  it("filterInventoryByName returns empty when query is too short", () => {
    expect(filterInventoryByName(items, "")).toEqual([]);
    expect(filterInventoryByName(items, "a")).toEqual([]);
  });

  it("filterInventoryByName filters case-insensitively when query is long enough", () => {
    expect(filterInventoryByName(items, "AC")).toEqual([items[0]]);
    expect(filterInventoryByName(items, "cr")).toEqual([items[1]]);
  });

  it("AUTOCOMPLETE_MIN_QUERY_LENGTH defaults to 2", () => {
    expect(AUTOCOMPLETE_MIN_QUERY_LENGTH).toBe(2);
    expect(filterInventoryByName(items, "x", 3)).toEqual([]);
    expect(filterInventoryByName(items, "xxx", 3)).toEqual([]);
  });
});
