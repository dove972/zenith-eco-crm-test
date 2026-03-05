"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSchema, type ClientFormData } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface StepClientProps {
  data: ClientFormData;
  onNext: (data: ClientFormData) => void;
}

const FIELDS = [
  { name: "first_name" as const, label: "Prénom", type: "text", autoComplete: "given-name" },
  { name: "last_name" as const, label: "Nom", type: "text", autoComplete: "family-name" },
  { name: "email" as const, label: "Email", type: "email", autoComplete: "email" },
  { name: "address" as const, label: "Adresse", type: "text", autoComplete: "street-address" },
  { name: "postal_code" as const, label: "Code postal", type: "text", autoComplete: "postal-code" },
  { name: "city" as const, label: "Ville", type: "text", autoComplete: "address-level2" },
  { name: "phone" as const, label: "Téléphone", type: "tel", autoComplete: "tel" },
] as const;

export default function StepClient({ data, onNext }: StepClientProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: data,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-4">
      {FIELDS.map((field) => (
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
