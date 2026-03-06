"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ProductCategory } from "@/types/database";

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  chauffe_eau: "Chauffe-eau",
  gouttiere: "Gouttière",
  faux_plafond: "Faux plafond",
  bois: "Bois",
  electricite: "Électricité",
  plomberie: "Plomberie",
  peinture: "Peinture",
  etancheite: "Étanchéité",
  ventilation: "Ventilation",
  securite: "Sécurité",
  nettoyage: "Nettoyage",
  accessoires: "Accessoires",
  toiture: "Toiture",
  main_oeuvre: "Main d'œuvre",
  isolation: "Isolation",
  logistique: "Logistique",
  etude: "Étude",
  autre: "Autre",
};

const CATEGORIES: ProductCategory[] = [
  "chauffe_eau",
  "gouttiere",
  "faux_plafond",
  "bois",
  "electricite",
  "plomberie",
  "peinture",
  "etancheite",
  "ventilation",
  "securite",
  "nettoyage",
  "accessoires",
  "toiture",
  "main_oeuvre",
  "isolation",
  "logistique",
  "etude",
  "autre",
];

const productSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  category: z.enum(["chauffe_eau", "gouttiere", "faux_plafond", "bois", "electricite", "plomberie", "peinture", "etancheite", "ventilation", "securite", "nettoyage", "accessoires", "toiture", "main_oeuvre", "isolation", "logistique", "etude", "autre"]),
  unit_price_sell: z.coerce.number().min(0, "Le prix de vente doit être positif"),
  unit_price_cost: z.coerce.number().min(0, "Le prix coût doit être positif"),
  tva_rate: z.coerce.number().min(0).max(100, "La TVA doit être entre 0 et 100"),
  unit_label: z.string().min(1, "L'unité est requise"),
  active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit_price_sell: number;
  unit_price_cost: number;
  tva_rate: number;
  unit_label: string;
  active: boolean;
  sort_order: number;
  is_devis_line: boolean;
  devis_line_key: string | null;
  devis_group: string | null;
  quantity_mode: string;
  inclusion_condition: string | null;
  sheet_type_variant: string | null;
  created_at: string;
  updated_at: string;
}

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"addons" | "devis_lines">("addons");

  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      category: "autre",
      unit_price_sell: 0,
      unit_price_cost: 0,
      tva_rate: 10,
      unit_label: "unité",
      active: true,
    },
  });

  const activeValue = watch("active");

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("complementary_products")
      .select("*")
      .order("sort_order")
      .order("name");

    if (error) {
      toast.error("Erreur lors du chargement des produits");
      setLoading(false);
      return;
    }

    setProducts(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openAddForm() {
    setEditingProduct(null);
    reset({
      name: "",
      category: "autre",
      unit_price_sell: 0,
      unit_price_cost: 0,
      tva_rate: 10,
      unit_label: "unité",
      active: true,
    });
    setShowForm(true);
  }

  function openEditForm(product: Product) {
    setEditingProduct(product);
    reset({
      name: product.name,
      category: product.category,
      unit_price_sell: product.unit_price_sell,
      unit_price_cost: product.unit_price_cost,
      tva_rate: product.tva_rate,
      unit_label: product.unit_label,
      active: product.active,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingProduct(null);
    reset();
  }

  async function onSubmit(data: ProductFormData) {
    setSaving(true);
    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("complementary_products")
          .update({
            name: data.name,
            category: data.category,
            unit_price_sell: data.unit_price_sell,
            unit_price_cost: data.unit_price_cost,
            tva_rate: data.tva_rate,
            unit_label: data.unit_label,
            active: data.active,
          })
          .eq("id", editingProduct.id);

        if (error) {
          toast.error("Erreur lors de la modification du produit");
          return;
        }
        toast.success("Produit modifié avec succès");
      } else {
        const { error } = await supabase
          .from("complementary_products")
          .insert({
            name: data.name,
            category: data.category,
            unit_price_sell: data.unit_price_sell,
            unit_price_cost: data.unit_price_cost,
            tva_rate: data.tva_rate,
            unit_label: data.unit_label,
            active: data.active,
          });

        if (error) {
          toast.error("Erreur lors de l'ajout du produit");
          return;
        }
        toast.success("Produit ajouté avec succès");
      }

      cancelForm();
      await fetchProducts();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(product: Product) {
    setTogglingId(product.id);
    const { error } = await supabase
      .from("complementary_products")
      .update({ active: !product.active })
      .eq("id", product.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour du statut");
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, active: !p.active } : p
        )
      );
    }
    setTogglingId(null);
  }

  async function handleDelete(product: Product) {
    if (product.is_devis_line) {
      toast.error("Les lignes de devis ne peuvent pas être supprimées");
      return;
    }
    if (!confirm(`Supprimer le produit "${product.name}" ?`)) return;

    setDeletingId(product.id);
    const { error } = await supabase
      .from("complementary_products")
      .delete()
      .eq("id", product.id);

    if (error) {
      toast.error("Erreur lors de la suppression du produit");
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Produit supprimé");
    }
    setDeletingId(null);
  }

  const filteredProducts = products.filter((p) =>
    activeTab === "devis_lines" ? p.is_devis_line : !p.is_devis_line
  );

  function formatPrice(value: number) {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  }

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
          <h1 className="text-3xl font-bold tracking-tight">
            Catalogue produits
          </h1>
          <p className="text-muted-foreground">
            Gérez les tarifs des lignes de devis et des produits complémentaires
          </p>
        </div>
        {activeTab === "addons" && (
          <Button onClick={openAddForm} disabled={showForm}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un produit
          </Button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => { setActiveTab("devis_lines"); cancelForm(); }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "devis_lines"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Lignes de devis ({products.filter((p) => p.is_devis_line).length})
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("addons"); cancelForm(); }}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "addons"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Produits complémentaires ({products.filter((p) => !p.is_devis_line).length})
        </button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nom</label>
                  <Input
                    {...register("name")}
                    placeholder="Nom du produit"
                  />
                  {errors.name && (
                    <p className="text-xs text-destructive">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Catégorie</label>
                  <select
                    {...register("category")}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-xs text-destructive">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Prix de vente (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("unit_price_sell")}
                  />
                  {errors.unit_price_sell && (
                    <p className="text-xs text-destructive">
                      {errors.unit_price_sell.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    Prix coût (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("unit_price_cost")}
                  />
                  {errors.unit_price_cost && (
                    <p className="text-xs text-destructive">
                      {errors.unit_price_cost.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">TVA (%)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    {...register("tva_rate")}
                  />
                  {errors.tva_rate && (
                    <p className="text-xs text-destructive">
                      {errors.tva_rate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Unité</label>
                  <Input
                    {...register("unit_label")}
                    placeholder="m², unité, ml..."
                  />
                  {errors.unit_label && (
                    <p className="text-xs text-destructive">
                      {errors.unit_label.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Actif</label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={activeValue}
                  onClick={() => setValue("active", !activeValue)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    activeValue ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      activeValue ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingProduct ? "Enregistrer" : "Ajouter"}
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

      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">
              {activeTab === "devis_lines" ? "Aucune ligne de devis" : "Aucun produit"}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeTab === "devis_lines"
                ? "Les lignes de devis seront disponibles après la migration"
                : "Ajoutez votre premier produit complémentaire"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Produit</th>
                    <th className="px-4 py-3 font-medium">Catégorie</th>
                    {activeTab === "devis_lines" && (
                      <th className="px-4 py-3 font-medium">Groupe devis</th>
                    )}
                    <th className="px-4 py-3 font-medium text-right">
                      Prix vente
                    </th>
                    {activeTab === "addons" && (
                      <th className="px-4 py-3 font-medium text-right">
                        Prix coût
                      </th>
                    )}
                    <th className="px-4 py-3 font-medium text-right">TVA</th>
                    <th className="px-4 py-3 font-medium">Unité</th>
                    <th className="px-4 py-3 font-medium text-center">
                      Statut
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="px-4 py-3 font-medium">{product.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {CATEGORY_LABELS[product.category]}
                        </Badge>
                      </td>
                      {activeTab === "devis_lines" && (
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {product.devis_group || "—"}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        {formatPrice(product.unit_price_sell)}
                      </td>
                      {activeTab === "addons" && (
                        <td className="px-4 py-3 text-right">
                          {formatPrice(product.unit_price_cost)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        {product.tva_rate}%
                      </td>
                      <td className="px-4 py-3">{product.unit_label}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={product.active}
                          disabled={togglingId === product.id}
                          onClick={() => handleToggleActive(product)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors disabled:opacity-50 ${
                            product.active ? "bg-primary" : "bg-muted"
                          }`}
                        >
                          <span
                            className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                              product.active
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
                            onClick={() => openEditForm(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!product.is_devis_line && (
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={deletingId === product.id}
                              onClick={() => handleDelete(product)}
                            >
                              {deletingId === product.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
