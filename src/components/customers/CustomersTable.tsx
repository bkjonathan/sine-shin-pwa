import { ExternalLink, MapPin, PencilLine, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/types/database";

interface CustomersTableProps {
  customers: Customer[];
  totalCustomers: number;
  isLoading: boolean;
  deletingId: number | null;
  onDelete: (id: number) => void;
}

const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const CustomersTable = ({
  customers,
  totalCustomers,
  isLoading,
  deletingId,
  onDelete,
}: CustomersTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-white/40 hover:bg-transparent dark:border-white/20">
          <TableHead>Customer</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Platform</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading && (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center">
              Loading customers...
            </TableCell>
          </TableRow>
        )}

        {!isLoading && totalCustomers === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center">
              No customers available yet.
            </TableCell>
          </TableRow>
        )}

        {!isLoading && totalCustomers > 0 && customers.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-center">
              No records match the current filters.
            </TableCell>
          </TableRow>
        )}

        {customers.map((customer) => (
          <TableRow
            key={customer.id}
            className="border-white/35 hover:bg-white/30 dark:border-white/15 dark:hover:bg-slate-900/45"
          >
            <TableCell className="whitespace-normal">
              <div className="space-y-0.5">
                <p className="font-medium">{customer.name}</p>
                <p className="text-muted-foreground text-xs">
                  {customer.customer_id || "No customer code"}
                </p>
              </div>
            </TableCell>
            <TableCell className="whitespace-normal">
              <p>{customer.phone || "-"}</p>
              {customer.social_media_url ? (
                <a
                  href={customer.social_media_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary mt-0.5 inline-flex items-center gap-1 text-xs hover:underline"
                >
                  Open profile
                  <ExternalLink className="size-3" />
                </a>
              ) : (
                <p className="text-muted-foreground text-xs">No social link</p>
              )}
            </TableCell>
            <TableCell className="whitespace-normal">
              <div className="space-y-0.5">
                <p className="inline-flex items-center gap-1">
                  <MapPin className="text-muted-foreground size-3.5" />
                  {customer.city || "-"}
                </p>
                <p className="text-muted-foreground text-xs">
                  {customer.address || "No address"}
                </p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="secondary" className="rounded-full px-2 py-0.5">
                {customer.platform || "N/A"}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(customer.created_at)}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/customers/${customer.id}/edit`}>
                    <PencilLine className="size-4" />
                    Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === customer.id}
                  onClick={() => onDelete(customer.id)}
                >
                  <Trash2 className="size-4" />
                  {deletingId === customer.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
