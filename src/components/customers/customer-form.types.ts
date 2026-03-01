import type { Customer } from "@/types/database";

export interface CustomerFormState {
  customer_id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  social_media_url: string;
  platform: string;
}

export const emptyCustomerForm: CustomerFormState = {
  customer_id: "",
  name: "",
  phone: "",
  address: "",
  city: "",
  social_media_url: "",
  platform: "",
};

export const mapCustomerToForm = (customer: Customer): CustomerFormState => ({
  customer_id: customer.customer_id ?? "",
  name: customer.name,
  phone: customer.phone ?? "",
  address: customer.address ?? "",
  city: customer.city ?? "",
  social_media_url: customer.social_media_url ?? "",
  platform: customer.platform ?? "",
});

export const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};
