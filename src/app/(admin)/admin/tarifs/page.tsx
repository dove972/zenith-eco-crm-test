"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

const LABEL_MAP: Record<string, string> = {
  toles_acier: "Tôles ACIER",
  toles_alu: "Tôles ALU",
  charpente_toles_acier: "Charpente + Tôles ACIER",
  charpente_toles_alu: "Charpente + Tôles ALU",
};

interface SalePrice {
  id: string;
  label: string;
  price_per_m2: number;
  updated_at: string;
  updated_by: string | null;
}

export default function TarifsPage() {
  const [prices, setPrices] = useState<SalePrice[]>([]);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function fetchPrices() {
      const { data, error } = await supabase
        .from("sale_prices")
        .select("*")
        .order("label");

      if (error) {
        toast.error("Erreur lors du chargement des tarifs");
        setLoading(false);
        return;
      }

      setPrices(data ?? []);
      const initial: Record<string, number> = {};
      (data ?? []).forEach((p) => {
        initial[p.id] = p.price_per_m2;
      });
      setEditedPrices(initial);
      setLoading(false);
    }

    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePriceChange(id: string, value: string) {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      setEditedPrices((prev) => ({ ...prev, [id]: parsed }));
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updates = prices.map((p) =>
        supabase
          .from("sale_prices")
          .update({ price_per_m2: editedPrices[p.id] })
          .eq("id", p.id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        toast.error("Erreur lors de la sauvegarde des tarifs");
        return;
      }

      const { data } = await supabase
        .from("sale_prices")
        .select("*")
        .order("label");

      if (data) {
        setPrices(data);
        const refreshed: Record<string, number> = {};
        data.forEach((p) => {
          refreshed[p.id] = p.price_per_m2;
        });
        setEditedPrices(refreshed);
      }

      toast.success("Tarifs mis à jour avec succès");
    } finally {
      setSaving(false);
    }
  }

  const tolesSeules = prices.filter(
    (p) => p.label === "toles_acier" || p.label === "toles_alu"
  );
  const charpenteToles = prices.filter(
    (p) => p.label === "charpente_toles_acier" || p.label === "charpente_toles_alu"
  );

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tarifs de vente au m²
        </h1>
        <p className="text-muted-foreground">
          Gérez les prix de vente par type de toiture
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tôles seules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tolesSeules.map((price) => (
              <PriceRow
                key={price.id}
                price={price}
                value={editedPrices[price.id] ?? price.price_per_m2}
                onChange={(val) => handlePriceChange(price.id, val)}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Charpente + Tôles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {charpenteToles.map((price) => (
              <PriceRow
                key={price.id}
                price={price}
                value={editedPrices[price.id] ?? price.price_per_m2}
                onChange={(val) => handlePriceChange(price.id, val)}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer les tarifs
        </Button>
      </div>
    </div>
  );
}

function PriceRow({
  price,
  value,
  onChange,
}: {
  price: SalePrice;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">
        {LABEL_MAP[price.label] ?? price.label}
      </label>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-[200px]"
        />
        <span className="text-sm text-muted-foreground">€ / m²</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Dernière mise à jour : {formatDate(price.updated_at)}
      </p>
    </div>
  );
}
