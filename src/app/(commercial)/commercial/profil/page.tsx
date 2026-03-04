"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LogOut,
  User,
  Phone,
  Shield,
  Mail,
  Pencil,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  manager: "Manager",
  commercial: "Commercial",
};

export default function ProfilPage() {
  const { profile, loading, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone ?? "",
      });
    }
  }, [profile]);

  useEffect(() => {
    async function getEmail() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    }
    getEmail();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du profil");
    } else {
      toast.success("Profil mis à jour");
      setEditing(false);
      window.location.reload();
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <User className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">
          Profil non disponible
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FA7800] text-lg font-bold text-white">
                {profile.first_name[0]}
                {profile.last_name[0]}
              </div>
              <CardTitle className="text-lg">
                {editing ? "Modifier le profil" : `${profile.first_name} ${profile.last_name}`}
              </CardTitle>
            </div>
            {!editing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {editing ? (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Prénom
                </label>
                <Input
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, first_name: e.target.value }))
                  }
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Nom
                </label>
                <Input
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, last_name: e.target.value }))
                  }
                  placeholder="Nom"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <Input value={email} disabled className="opacity-60" />
                <p className="text-[11px] text-muted-foreground">
                  L&apos;email ne peut pas être modifié ici
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Téléphone
                </label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  placeholder="06 XX XX XX XX"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Enregistrer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      first_name: profile.first_name,
                      last_name: profile.last_name,
                      phone: profile.phone ?? "",
                    });
                  }}
                  disabled={saving}
                >
                  <X className="mr-2 h-4 w-4" />
                  Annuler
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Nom</p>
                  <p className="truncate text-sm font-medium">
                    {profile.first_name} {profile.last_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="truncate text-sm font-medium">
                    {email || "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Rôle</p>
                  <p className="truncate text-sm font-medium">
                    {ROLE_LABELS[profile.role] ?? profile.role}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Téléphone</p>
                  <p className="truncate text-sm font-medium">
                    {profile.phone ?? "Non renseigné"}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full" onClick={signOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Se déconnecter
      </Button>
    </div>
  );
}
