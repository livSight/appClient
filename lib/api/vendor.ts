import { apiFetch } from "@/lib/api/client";

export type VendorLoginResponse = {
  token: string;
};

export type VendorMe = {
  id: number;
  name?: string;
  email?: string;
  agencyId?: number;
  groupId?: number;
};

export type VendorDeliveryStatus =
  | "pending"
  | "delivered"
  | "failed"
  | "cancelled"
  | "pickup"
  | "expedition"
  | "client_absent"
  | "present_ne_decroche_zone1"
  | "present_ne_decroche_zone2"
  | (string & {});

export type VendorDelivery = {
  id: number;
  phone: string;
  customer_name?: string | null;
  items: string;
  amount_due: number;
  amount_paid?: number | null;
  delivery_fee?: number | null;
  status: VendorDeliveryStatus;
  quartier?: string | null;
  notes?: string | null;
  carrier?: string | null;
  created_at?: string;
  updated_at?: string;
};

export async function vendorLogin(email: string, password: string) {
  return apiFetch<VendorLoginResponse>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export async function vendorMe() {
  return apiFetch<VendorMe>("/vendor/me");
}

export type ListVendorDeliveriesParams = Partial<{
  page: number;
  limit: number;
  status: string;
  date: string;
  phone: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}>;

export async function listVendorDeliveries(params: ListVendorDeliveriesParams = {}) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return apiFetch<VendorDelivery[]>(`/vendor/deliveries${qs ? `?${qs}` : ""}`);
}

export type CreateVendorDeliveryBody = {
  phone: string;
  items: string;
  amount_due: number;
  quartier?: string;
  notes?: string;
  carrier?: string | null;
  delivery_fee?: number | null;
};

export async function createVendorDelivery(body: CreateVendorDeliveryBody) {
  return apiFetch<VendorDelivery>("/vendor/deliveries", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

