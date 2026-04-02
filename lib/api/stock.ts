import { apiFetch } from "@/lib/api/client";

export type StockItem = {
  id: number;
  name: string;
  subtitle?: string | null;
  quantity: number;
  updated_at?: string | null;
  created_at?: string | null;
};

export async function listVendorStockItems() {
  return apiFetch<StockItem[]>("/vendor/stock-items");
}

export type CreateVendorStockItemBody = {
  name: string;
  subtitle?: string;
  quantity?: number;
};

export async function createVendorStockItem(body: CreateVendorStockItemBody) {
  return apiFetch<StockItem>("/vendor/stock-items", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type PatchVendorStockItemBody =
  | { delta: number; quantity?: never }
  | { quantity: number; delta?: never };

export async function patchVendorStockItem(id: number | string, body: PatchVendorStockItemBody) {
  return apiFetch<StockItem>(`/vendor/stock-items/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteVendorStockItem(id: number | string) {
  return apiFetch<{ message: string }>(`/vendor/stock-items/${encodeURIComponent(String(id))}`, {
    method: "DELETE",
  });
}

