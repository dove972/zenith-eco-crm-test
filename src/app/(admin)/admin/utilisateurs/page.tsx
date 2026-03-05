"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Loader2, Users, KeyRound, X } from "lucide-react";
import type { UserRole } from "@/types/database";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrateur",
  manager: "Manager",
  commercial: "Commercial",
};

const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline"> = {
  admin: "default",
  manager: "secondary",
  commercial: "outline",
};

const ROLES: UserRole[] = ["admin", "manager", "commercial"];

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  manager_id: string | null;
  phone: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserFormData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone: string;
  manager_id: string;
}

const DEFAULT_FORM: UserFormData = {
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  role: "commercial",
  phone: "",
  manager_id: "",
};

export default function UtilisateursPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [formData, setFormData] = useState<UserFormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Password change state
  const [passwordUser, setPasswordUser] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const supabase = createClient();

  const managers = users.filter((u) => u.role === "manager");

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("role")
      .order("last_name");

    if (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
      setLoading(false);
      return;
    }

    setUsers(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openInviteForm() {
    setEditingUser(null);
    setFormData(DEFAULT_FORM);
    setShowForm(true);
  }

  function openEditForm(user: Profile) {
    setEditingUser(user);
    setFormData({
      email: "",
      password: "",
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      phone: user.phone ?? "",
      manager_id: user.manager_id ?? "",
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingUser(null);
    setFormData(DEFAULT_FORM);
  }

  function updateField(field: keyof UserFormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  // Open password change dialog
  function openPasswordDialog(user: Profile) {
    setPasswordUser(user);
    setNewPassword("");
    setConfirmPassword("");
  }

  function closePasswordDialog() {
    setPasswordUser(null);
    setNewPassword("");
    setConfirmPassword("");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!passwordUser) return;

    if (newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setChangingPassword(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch("/api/admin/users/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: passwordUser.id,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors du changement de mot de passe");
        return;
      }

      toast.success(
        `Mot de passe modifié pour ${passwordUser.first_name} ${passwordUser.last_name}`
      );
      closePasswordDialog();
    } catch {
      toast.error("Erreur lors du changement de mot de passe");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        const { error } = await supabase
          .from("profiles")
          .update({
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            phone: formData.phone || null,
            manager_id: formData.manager_id || null,
          })
          .eq("id", editingUser.id);

        if (error) {
          toast.error("Erreur lors de la modification de l'utilisateur");
          return;
        }
        toast.success("Utilisateur modifié avec succès");
      } else {
        if (!formData.email || !formData.first_name || !formData.last_name) {
          toast.error("Veuillez remplir tous les champs obligatoires");
          return;
        }

        // Utiliser l'API route server-side qui a le service_role key
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password || "TempPass123!",
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: formData.role,
            phone: formData.phone || null,
            manager_id: formData.manager_id || null,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const msg = data.error?.includes("already been registered")
            ? "Un utilisateur avec cet email existe déjà"
            : data.error || "Erreur lors de la création";
          toast.error(msg);
          return;
        }

        toast.success("Utilisateur créé avec succès");

        // Envoyer l'email d'invitation
        try {
          const emailRes = await fetch("/api/email/send-invitation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password || "TempPass123!",
              firstName: formData.first_name,
              lastName: formData.last_name,
              role: formData.role,
            }),
          });
          if (emailRes.ok) {
            toast.success("Email d'invitation envoyé !");
          } else {
            toast.warning("Utilisateur créé mais l'email n'a pas pu être envoyé");
          }
        } catch {
          toast.warning("Utilisateur créé mais l'email n'a pas pu être envoyé");
        }
      }

      cancelForm();
      await fetchUsers();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(user: Profile) {
    setTogglingId(user.id);
    const { error } = await supabase
      .from("profiles")
      .update({ active: !user.active })
      .eq("id", user.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, active: !u.active } : u
        )
      );
    }
    setTogglingId(null);
  }

  function getManagerName(managerId: string | null): string {
    if (!managerId) return "—";
    const manager = users.find((u) => u.id === managerId);
    return manager
      ? `${manager.first_name} ${manager.last_name}`
      : "—";
  }

  const groupedUsers = ROLES.map((role) => ({
    role,
    label: ROLE_LABELS[role],
    users: users.filter((u) => u.role === role),
  }));

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les comptes utilisateurs et leurs rôles
          </p>
        </div>
        <Button onClick={openInviteForm} disabled={showForm}>
          <Plus className="mr-2 h-4 w-4" />
          Inviter un utilisateur
        </Button>
      </div>

      {/* Password change dialog */}
      {passwordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">
                Changer le mot de passe
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={closePasswordDialog}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                {passwordUser.first_name} {passwordUser.last_name}
              </p>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Nouveau mot de passe
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 caractères"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Confirmer le mot de passe
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retapez le mot de passe"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={changingPassword}>
                    {changingPassword && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Changer le mot de passe
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closePasswordDialog}
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingUser
                ? "Modifier l'utilisateur"
                : "Inviter un utilisateur"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {!editingUser && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Email <span className="text-destructive">*</span>
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="email@exemple.fr"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium">
                        Mot de passe provisoire
                      </label>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          updateField("password", e.target.value)
                        }
                        placeholder="Laisser vide pour le défaut"
                      />
                    </div>
                  </>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Prénom <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) =>
                      updateField("first_name", e.target.value)
                    }
                    placeholder="Prénom"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Nom <span className="text-destructive">*</span>
                  </label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) =>
                      updateField("last_name", e.target.value)
                    }
                    placeholder="Nom"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Rôle</label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      updateField("role", e.target.value)
                    }
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Téléphone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </div>

                {formData.role === "commercial" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-medium">
                      Manager assigné
                    </label>
                    <select
                      value={formData.manager_id}
                      onChange={(e) =>
                        updateField("manager_id", e.target.value)
                      }
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Aucun manager</option>
                      {managers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.first_name} {m.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingUser ? "Enregistrer" : "Inviter"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelForm}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">Aucun utilisateur</p>
            <p className="text-sm text-muted-foreground">
              Invitez votre premier utilisateur
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedUsers.map(
            (group) =>
              group.users.length > 0 && (
                <Card key={group.role}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {group.label}
                      <Badge variant="secondary" className="ml-1">
                        {group.users.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left text-sm text-muted-foreground">
                            <th className="px-4 py-3 font-medium">Nom</th>
                            <th className="px-4 py-3 font-medium">
                              Téléphone
                            </th>
                            {group.role === "commercial" && (
                              <th className="px-4 py-3 font-medium">
                                Manager
                              </th>
                            )}
                            <th className="px-4 py-3 font-medium text-center">
                              Statut
                            </th>
                            <th className="px-4 py-3 font-medium text-right">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.users.map((user) => (
                            <tr
                              key={user.id}
                              className="border-b last:border-0 hover:bg-muted/50"
                            >
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {user.first_name} {user.last_name}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {user.phone || "—"}
                              </td>
                              {group.role === "commercial" && (
                                <td className="px-4 py-3 text-sm">
                                  {getManagerName(user.manager_id)}
                                </td>
                              )}
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  role="switch"
                                  aria-checked={user.active}
                                  disabled={togglingId === user.id}
                                  onClick={() => handleToggleActive(user)}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                                    user.active ? "bg-primary" : "bg-muted"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                                      user.active
                                        ? "translate-x-5"
                                        : "translate-x-0"
                                    }`}
                                  />
                                </button>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openPasswordDialog(user)}
                                    title="Changer le mot de passe"
                                  >
                                    <KeyRound className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditForm(user)}
                                    title="Modifier"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )
          )}
        </div>
      )}
    </div>
  );
}
