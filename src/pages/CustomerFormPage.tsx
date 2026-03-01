import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, PencilLine, UserPlus2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
import { CustomerForm } from "@/components/customers/CustomerForm";
import {
  emptyCustomerForm,
  mapCustomerToForm,
  toNullable,
  type CustomerFormState,
} from "@/components/customers/customer-form.types";
import { customersService } from "@/services/customers.service";

export const CustomerFormPage = () => {
  const navigate = useNavigate();
  const { customerId } = useParams<{ customerId: string }>();
  const hasCustomerIdParam = typeof customerId === "string";
  const parsedCustomerId = hasCustomerIdParam
    ? Number.parseInt(customerId, 10)
    : null;
  const isEditMode = hasCustomerIdParam;

  const [form, setForm] = useState<CustomerFormState>(emptyCustomerForm);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async () => {
    if (!isEditMode) {
      setForm(emptyCustomerForm);
      setIsLoadingCustomer(false);
      return;
    }

    if (Number.isNaN(parsedCustomerId as number)) {
      setError("Invalid customer id.");
      setIsLoadingCustomer(false);
      return;
    }

    setIsLoadingCustomer(true);
    setError(null);

    try {
      const customer = await customersService.getCustomerById(parsedCustomerId as number);
      if (!customer) {
        setError("Customer record was not found.");
        return;
      }
      setForm(mapCustomerToForm(customer));
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customer profile.";
      setError(message);
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [isEditMode, parsedCustomerId]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setError("Customer name is required.");
      return;
    }

    if (isEditMode && Number.isNaN(parsedCustomerId as number)) {
      setError("Invalid customer id.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = {
        customer_id: toNullable(form.customer_id),
        name,
        phone: toNullable(form.phone),
        address: toNullable(form.address),
        city: toNullable(form.city),
        social_media_url: toNullable(form.social_media_url),
        platform: toNullable(form.platform),
      };

      if (isEditMode) {
        await customersService.updateCustomer(parsedCustomerId as number, payload);
      } else {
        await customersService.createCustomer({
          ...payload,
          synced_from_device_at: null,
        });
      }

      navigate("/customers");
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save customer.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = <K extends keyof CustomerFormState>(
    field: K,
    value: CustomerFormState[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-4xl space-y-6 pb-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase">
            Customer Management
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isEditMode ? "Edit Customer" : "Create Customer"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditMode
              ? "Update customer profile details and save changes."
              : "Create a new customer profile in a dedicated workflow."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="glass-pill text-xs">
            {isEditMode ? "Editing Mode" : "Creation Mode"}
          </Badge>
          <Button asChild variant="outline" size="sm">
            <Link to="/customers">
              <ArrowLeft className="size-4" />
              Back to Directory
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="glass-panel-strong border-white/65">
        <CardHeader>
          <CardTitle className="inline-flex items-center gap-2">
            {isEditMode ? <PencilLine className="size-4" /> : <UserPlus2 className="size-4" />}
            {isEditMode ? "Customer Profile Update" : "New Customer Profile"}
          </CardTitle>
          <CardDescription>
            Required fields are validated before submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCustomer ? (
            <div className="text-muted-foreground py-6 text-sm">Loading customer profile...</div>
          ) : (
            <CustomerForm
              form={form}
              isSaving={isSaving}
              isEditMode={isEditMode}
              onSubmit={handleSubmit}
              onCancel={() => navigate("/customers")}
              onFieldChange={handleFieldChange}
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
