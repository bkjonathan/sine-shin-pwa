import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, RefreshCcw, Trash2, UserPen } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { customersService } from "@/services/customers.service";
import type { Customer } from "@/types/database";

interface CustomerFormState {
  customer_id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  social_media_url: string;
  platform: string;
}

const emptyCustomerForm: CustomerFormState = {
  customer_id: "",
  name: "",
  phone: "",
  address: "",
  city: "",
  social_media_url: "",
  platform: "",
};

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setError(null);
      const data = await customersService.getCustomers();
      setCustomers(data);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customers.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const handleReset = () => {
    setEditingId(null);
    setForm(emptyCustomerForm);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setError("Customer name is required.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      if (editingId === null) {
        await customersService.createCustomer({
          customer_id: toNullable(form.customer_id),
          name,
          phone: toNullable(form.phone),
          address: toNullable(form.address),
          city: toNullable(form.city),
          social_media_url: toNullable(form.social_media_url),
          platform: toNullable(form.platform),
          synced_from_device_at: null,
        });
      } else {
        await customersService.updateCustomer(editingId, {
          customer_id: toNullable(form.customer_id),
          name,
          phone: toNullable(form.phone),
          address: toNullable(form.address),
          city: toNullable(form.city),
          social_media_url: toNullable(form.social_media_url),
          platform: toNullable(form.platform),
        });
      }

      await loadCustomers();
      handleReset();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to save customer.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setForm({
      customer_id: customer.customer_id ?? "",
      name: customer.name,
      phone: customer.phone ?? "",
      address: customer.address ?? "",
      city: customer.city ?? "",
      social_media_url: customer.social_media_url ?? "",
      platform: customer.platform ?? "",
    });
    setError(null);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this customer?");
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await customersService.deleteCustomer(id);
      if (editingId === id) {
        handleReset();
      }
      await loadCustomers();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete customer.";
      setError(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-6xl space-y-6"
    >
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm">
            Full customer CRUD lifecycle.
          </p>
        </div>
        <Badge variant="outline" className="glass-pill w-fit text-xs">
          {customers.length} customers
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[400px_1fr]">
        <Card className="glass-panel border-white/60">
          <CardHeader>
            <CardTitle>
              {editingId === null ? "Create Customer" : "Edit Customer"}
            </CardTitle>
            <CardDescription>
              {editingId === null
                ? "Capture a new customer profile."
                : "Update selected customer details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="customer-id">Customer ID</Label>
                <Input
                  id="customer-id"
                  value={form.customer_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      customer_id: event.target.value,
                    }))
                  }
                  placeholder="SSC-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-name">Name</Label>
                <Input
                  id="customer-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-phone">Phone</Label>
                  <Input
                    id="customer-phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-city">City</Label>
                  <Input
                    id="customer-city"
                    value={form.city}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, city: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-address">Address</Label>
                <Input
                  id="customer-address"
                  value={form.address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address: event.target.value }))
                  }
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer-platform">Platform</Label>
                  <Input
                    id="customer-platform"
                    value={form.platform}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, platform: event.target.value }))
                    }
                    placeholder="Facebook"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer-social">Social URL</Label>
                  <Input
                    id="customer-social"
                    value={form.social_media_url}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        social_media_url: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSaving}>
                  <UserPen className="size-4" />
                  {isSaving
                    ? "Saving..."
                    : editingId === null
                      ? "Create Customer"
                      : "Update Customer"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  <Plus className="size-4" />
                  New
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-panel border-white/60">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl">Customer Records</CardTitle>
              <CardDescription>Read, edit, and remove customer profiles.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadCustomers()}>
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4 text-center">
                      Loading customers...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-4 text-center">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}

                {customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="border-white/35 hover:bg-white/30"
                  >
                    <TableCell>{customer.customer_id || "-"}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || "-"}</TableCell>
                    <TableCell>{customer.city || "-"}</TableCell>
                    <TableCell>{customer.platform || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <UserPen className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDelete(customer.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
