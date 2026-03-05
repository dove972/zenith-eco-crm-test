"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientFormData } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search } from "lucide-react";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  COMMUNES_MARTINIQUE,
  searchCommunes,
  type CommuneMartinique,
} from "@/data/communes-martinique";
import { cn } from "@/lib/utils";

interface StepClientProps {
  data: ClientFormData;
  onNext: (data: ClientFormData) => void;
}

const TEXT_FIELDS = [
  { name: "first_name" as const, label: "Prénom", type: "text", autoComplete: "given-name" },
  { name: "last_name" as const, label: "Nom", type: "text", autoComplete: "family-name" },
  { name: "email" as const, label: "Email", type: "email", autoComplete: "email" },
  { name: "address" as const, label: "Adresse", type: "text", autoComplete: "street-address" },
  { name: "phone" as const, label: "Téléphone", type: "tel", autoComplete: "tel" },
] as const;

export default function StepClient({ data, onNext }: StepClientProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: data,
  });

  const [communeSearch, setCommuneSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCommunes = useMemo(
    () => searchCommunes(communeSearch),
    [communeSearch]
  );

  // Fermer dropdown au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectCommune(commune: CommuneMartinique) {
    setValue("postal_code", commune.code_postal, { shouldValidate: true });
    setValue("city", commune.commune, { shouldValidate: true });
    setCommuneSearch(`${commune.code_postal} — ${commune.commune}`);
    setShowDropdown(false);
  }

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      {TEXT_FIELDS.map((field) => (
        <div key={field.name} className="space-y-1.5">
          <label
            htmlFor={field.name}
            className="text-sm font-medium leading-none"
          >
            {field.label}
          </label>
          <Input
            id={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            placeholder={field.label}
            {...register(field.name)}
          />
          {errors[field.name] && (
            <p className="text-xs text-destructive">
              {errors[field.name]?.message}
            </p>
          )}
        </div>
      ))}

      {/* Commune Martinique dropdown */}
      <div className="space-y-1.5" ref={dropdownRef}>
        <label className="text-sm font-medium leading-none">
          Commune (Martinique)
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            className="pl-9"
            placeholder="Rechercher une commune ou code postal..."
            value={communeSearch}
            onChange={(e) => {
              setCommuneSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
          />
          {showDropdown && filteredCommunes.length > 0 && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border bg-white shadow-lg">
              {filteredCommunes.map((commune, idx) => (
                <button
                  key={`${commune.code_postal}-${commune.commune}-${idx}`}
                  type="button"
                  onClick={() => selectCommune(commune)}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#FA7800]/5 transition-colors",
                    idx > 0 && "border-t border-[#F5F5F5]"
                  )}
                >
                  <span className="shrink-0 rounded bg-[#F5F5F5] px-2 py-0.5 text-xs font-bold text-[#888]">
                    {commune.code_postal}
                  </span>
                  <span className="font-medium text-[#464646]">
                    {commune.commune}
                  </span>
                </button>
              ))}
            </div>
          )}
          {showDropdown && communeSearch && filteredCommunes.length === 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white p-4 text-center text-sm text-muted-foreground shadow-lg">
              Aucune commune trouvée
            </div>
          )}
        </div>
        {/* Champs cachés pour le formulaire */}
        <input type="hidden" {...register("postal_code")} />
        <input type="hidden" {...register("city")} />
        {(errors.postal_code || errors.city) && (
          <p className="text-xs text-destructive">
            {errors.postal_code?.message || errors.city?.message || "Veuillez sélectionner une commune"}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="comments"
          className="text-sm font-medium leading-none"
        >
          Commentaires (optionnel)
        </label>
        <textarea
          id="comments"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          placeholder="Notes sur le client, observations..."
          {...register("comments")}
        />
      </div>

      <Button type="submit" className="w-full">
        Suivant
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
