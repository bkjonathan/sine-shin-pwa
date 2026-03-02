import { supabase } from "@/lib/supabase";

export type LocalIdTable =
  | "shop_settings"
  | "users"
  | "customers"
  | "orders"
  | "order_items"
  | "expenses";

type LocalIdRecord = {
  id?: number | null;
  local_id?: number | null;
};

const resolveId = (record: LocalIdRecord): number => {
  if (typeof record.local_id === "number") {
    return record.local_id;
  }

  if (typeof record.id === "number") {
    return record.id;
  }

  throw new Error("Record is missing local_id.");
};

export const withLegacyId = <T extends LocalIdRecord>(
  record: T,
): T & { id: number } => ({
  ...record,
  id: resolveId(record),
});

export const withLegacyIds = <T extends LocalIdRecord>(
  records: T[] | null | undefined,
): Array<T & { id: number }> => (records ?? []).map(withLegacyId);

export const getNextLocalId = async (table: LocalIdTable): Promise<number> => {
  const { data, error } = await supabase
    .from(table)
    .select("local_id")
    .order("local_id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(`Error fetching next local_id for ${table}:`, error);
    throw error;
  }

  const maxLocalId = typeof data?.local_id === "number" ? data.local_id : 0;
  return maxLocalId + 1;
};

export const stripIdentityFields = <T extends object>(
  value: T,
): Omit<T, "id" | "local_id" | "uuid"> => {
  const payload = { ...value } as Record<string, unknown>;
  delete payload.id;
  delete payload.local_id;
  delete payload.uuid;
  return payload as Omit<T, "id" | "local_id" | "uuid">;
};
