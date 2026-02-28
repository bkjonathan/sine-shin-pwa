import { useCallback, useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Plus, Save, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { shopSettingsService } from "@/services/shopSettings.service";
import type { ShopSettings } from "@/types/database";

interface SettingsFormState {
  shop_name: string;
  phone: string;
  address: string;
  logo_path: string;
  customer_id_prefix: string;
  order_id_prefix: string;
}

const emptySettingsForm: SettingsFormState = {
  shop_name: "",
  phone: "",
  address: "",
  logo_path: "",
  customer_id_prefix: "SSC-",
  order_id_prefix: "SSO-",
};

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const mapSettingsToForm = (settings: ShopSettings): SettingsFormState => ({
  shop_name: settings.shop_name,
  phone: settings.phone ?? "",
  address: settings.address ?? "",
  logo_path: settings.logo_path ?? "",
  customer_id_prefix: settings.customer_id_prefix ?? "",
  order_id_prefix: settings.order_id_prefix ?? "",
});

export const SettingsPage = () => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [form, setForm] = useState<SettingsFormState>(emptySettingsForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      setError(null);
      const data = await shopSettingsService.getSettings();
      setSettings(data);
      setForm(data ? mapSettingsToForm(data) : emptySettingsForm);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load shop settings.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleReset = () => {
    setForm(settings ? mapSettingsToForm(settings) : emptySettingsForm);
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const shopName = form.shop_name.trim();
    if (!shopName) {
      setError("Shop name is required.");
      return;
    }

    setError(null);
    setNotice(null);
    setIsSaving(true);

    try {
      const payload = {
        shop_name: shopName,
        phone: toNullable(form.phone),
        address: toNullable(form.address),
        logo_path: toNullable(form.logo_path),
        customer_id_prefix: toNullable(form.customer_id_prefix),
        order_id_prefix: toNullable(form.order_id_prefix),
        synced_from_device_at: null,
      };

      if (settings) {
        const updated = await shopSettingsService.updateSettings({
          id: settings.id,
          ...payload,
        });
        setSettings(updated);
        setForm(mapSettingsToForm(updated));
        setNotice("Settings updated.");
      } else {
        const created = await shopSettingsService.createSettings(payload);
        setSettings(created);
        setForm(mapSettingsToForm(created));
        setNotice("Settings created.");
      }
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to save settings.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!settings) {
      return;
    }

    const confirmed = window.confirm("Delete shop settings?");
    if (!confirmed) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await shopSettingsService.deleteSettings(settings.id);
      setSettings(null);
      setForm(emptySettingsForm);
      setNotice("Settings deleted.");
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete settings.";
      setError(message);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-4xl space-y-6"
    >
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configuration</h1>
        <p className="text-muted-foreground text-sm">
          Manage the shop-level defaults used across the system.
        </p>
      </div>

      <Card className="glass-panel border-white/60">
        <CardHeader>
          <CardTitle>
            {settings ? "Update Shop Settings" : "Create Shop Settings"}
          </CardTitle>
          <CardDescription>
            Save global profile and ID-prefix defaults.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading settings...</p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="settings-shop-name">Shop Name</Label>
                <Input
                  id="settings-shop-name"
                  value={form.shop_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      shop_name: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settings-phone">Phone</Label>
                  <Input
                    id="settings-phone"
                    value={form.phone}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-address">Address</Label>
                  <Input
                    id="settings-address"
                    value={form.address}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, address: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="settings-logo-path">Logo Path</Label>
                <Input
                  id="settings-logo-path"
                  value={form.logo_path}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      logo_path: event.target.value,
                    }))
                  }
                  placeholder="/assets/logo.png"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="settings-customer-prefix">Customer ID Prefix</Label>
                  <Input
                    id="settings-customer-prefix"
                    value={form.customer_id_prefix}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        customer_id_prefix: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="settings-order-prefix">Order ID Prefix</Label>
                  <Input
                    id="settings-order-prefix"
                    value={form.order_id_prefix}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        order_id_prefix: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {notice && (
                <Alert>
                  <AlertDescription>{notice}</AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSaving || isLoading}>
                  <Save className="size-4" />
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving || isLoading}
                >
                  <Plus className="size-4" />
                  Reset
                </Button>

                {settings && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => void handleDelete()}
                    disabled={isSaving || isLoading}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
