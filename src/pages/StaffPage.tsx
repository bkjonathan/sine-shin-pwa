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
import { usersService } from "@/services/users.service";
import type { User } from "@/types/database";

interface StaffFormState {
  name: string;
  password_hash: string;
  role: string;
}

const emptyStaffForm: StaffFormState = {
  name: "",
  password_hash: "",
  role: "owner",
};

const toNullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

export const StaffPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState<StaffFormState>(emptyStaffForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setError(null);
      const data = await usersService.getUsers();
      setUsers(data);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "Failed to load users.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleReset = () => {
    setEditingId(null);
    setForm(emptyStaffForm);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const passwordHash = form.password_hash.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (editingId === null && !passwordHash) {
      setError("Password hash is required when creating a user.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (editingId === null) {
        await usersService.createUser({
          name,
          password_hash: passwordHash,
          role: toNullable(form.role),
        });
      } else {
        const payload: Partial<User> = {
          name,
          role: toNullable(form.role),
        };

        if (passwordHash) {
          payload.password_hash = passwordHash;
        }

        await usersService.updateUser(editingId, payload);
      }

      await loadUsers();
      handleReset();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Failed to save user.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      password_hash: "",
      role: user.role ?? "",
    });
    setError(null);
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) {
      return;
    }

    setError(null);

    try {
      await usersService.deleteUser(id);
      if (editingId === id) {
        handleReset();
      }
      await loadUsers();
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete user.";
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
          <h1 className="text-3xl font-semibold tracking-tight">Staff Directory</h1>
          <p className="text-muted-foreground text-sm">
            Manage internal user access records.
          </p>
        </div>
        <Badge variant="outline" className="glass-pill w-fit text-xs">
          {users.length} users
        </Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card className="glass-panel border-white/60">
          <CardHeader>
            <CardTitle>{editingId === null ? "Create User" : "Edit User"}</CardTitle>
            <CardDescription>
              {editingId === null
                ? "Add a new staff profile."
                : "Update selected staff details."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="staff-name">Name</Label>
                <Input
                  id="staff-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-role">Role</Label>
                <Input
                  id="staff-role"
                  placeholder="owner"
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, role: event.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="staff-password">Password Hash</Label>
                <Input
                  id="staff-password"
                  value={form.password_hash}
                  placeholder={
                    editingId === null
                      ? "Required for new user"
                      : "Leave empty to keep existing hash"
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      password_hash: event.target.value,
                    }))
                  }
                />
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
                      ? "Create User"
                      : "Update User"}
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
              <CardTitle className="text-xl">Users</CardTitle>
              <CardDescription>All registered staff records.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => void loadUsers()}>
              <RefreshCcw className="size-4" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/40 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-4 text-center">
                      Loading users...
                    </TableCell>
                  </TableRow>
                )}

                {!isLoading && users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-4 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}

                {users.map((user) => (
                  <TableRow key={user.id} className="border-white/35 hover:bg-white/30">
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.role || "-"}</TableCell>
                    <TableCell>
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <UserPen className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDelete(user.id)}
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
