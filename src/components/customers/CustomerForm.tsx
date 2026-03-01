import type { FormEvent } from "react";
import { ArrowLeft, CirclePlus, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { CustomerFormState } from "@/components/customers/customer-form.types";

interface CustomerFormProps {
  form: CustomerFormState;
  isSaving: boolean;
  isEditMode: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFieldChange: <K extends keyof CustomerFormState>(
    field: K,
    value: CustomerFormState[K],
  ) => void;
}

export const CustomerForm = ({
  form,
  isSaving,
  isEditMode,
  onCancel,
  onSubmit,
  onFieldChange,
}: CustomerFormProps) => {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-id">Customer Code</Label>
          <Input
            id="customer-id"
            value={form.customer_id}
            onChange={(event) => onFieldChange("customer_id", event.target.value)}
            placeholder="CUS-0001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-name">Customer Name</Label>
          <Input
            id="customer-name"
            value={form.name}
            onChange={(event) => onFieldChange("name", event.target.value)}
            required
            placeholder="Aung Min"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-phone">Phone</Label>
          <Input
            id="customer-phone"
            value={form.phone}
            onChange={(event) => onFieldChange("phone", event.target.value)}
            placeholder="+66..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-city">City</Label>
          <Input
            id="customer-city"
            value={form.city}
            onChange={(event) => onFieldChange("city", event.target.value)}
            placeholder="Bangkok"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-address">Address</Label>
        <Textarea
          id="customer-address"
          value={form.address}
          onChange={(event) => onFieldChange("address", event.target.value)}
          className="border-white/60 bg-white/48 shadow-[0_10px_28px_-24px_rgba(15,23,42,0.75)] backdrop-blur-xl"
          placeholder="Street, district, and delivery instructions"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer-platform">Platform</Label>
          <Input
            id="customer-platform"
            value={form.platform}
            onChange={(event) => onFieldChange("platform", event.target.value)}
            placeholder="Facebook"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-social">Social URL</Label>
          <Input
            id="customer-social"
            value={form.social_media_url}
            onChange={(event) => onFieldChange("social_media_url", event.target.value)}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={isSaving}>
          {isEditMode ? <PencilLine className="size-4" /> : <CirclePlus className="size-4" />}
          {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Create Customer"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          <ArrowLeft className="size-4" />
          Back to Customers
        </Button>
      </div>
    </form>
  );
};
