import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Minimum 6 caractères"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const clientSchema = z.object({
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  address: z.string().min(1, "Adresse requise"),
  postal_code: z.string().min(1, "Code postal requis"),
  city: z.string().min(1, "Ville requise"),
  phone: z.string().min(1, "Téléphone requis"),
  comments: z.string().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;

export const eligibilitySchema = z.object({
  is_owner: z.boolean(),
  is_primary_residence: z.boolean(),
  house_over_2_years: z.boolean(),
  tax_persons_count: z.number().min(1).max(20),
  tax_reference_income: z.number().min(0),
  mpr_account_amount: z.number().min(0),
  already_isolated_106: z.boolean(),
  already_isolated_109: z.boolean(),
});

export type EligibilityFormData = z.infer<typeof eligibilitySchema>;

export const projectSchema = z.object({
  sheet_type: z.enum(["acier", "alu"]),
  roof_panels_count: z.number().min(1),
  needs_framework: z.boolean(),
  surface_m2: z.number().min(1, "Surface requise"),
  products: z.array(
    z.object({
      product_id: z.string(),
      quantity: z.number().min(0),
    })
  ),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

export const financingSchema = z.object({
  payment_mode: z.enum([
    "comptant",
    "multipaiement",
    "financement",
    "cheque",
    "especes",
  ]),
  report_type: z.enum(["30j", "90j"]).optional(),
  financing_months: z.number().min(10).max(180).optional(),
  deposit_amount: z.number().min(0),
  payment_schedule: z
    .array(
      z.object({
        label: z.string(),
        percentage: z.number().min(0).max(100),
      })
    )
    .optional(),
});

export type FinancingFormData = z.infer<typeof financingSchema>;

export const salePriceSchema = z.object({
  price_per_m2: z.number().min(0, "Prix invalide"),
});

export const productSchema = z.object({
  name: z.string().min(1, "Nom requis"),
  category: z.enum([
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
    "autre",
  ]),
  unit_price_sell: z.number().min(0),
  unit_price_cost: z.number().min(0),
  tva_rate: z.number().min(0).max(100),
  unit_label: z.string().min(1),
  active: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;

export const userSchema = z.object({
  email: z.string().email("Email invalide"),
  first_name: z.string().min(1, "Prénom requis"),
  last_name: z.string().min(1, "Nom requis"),
  role: z.enum(["admin", "manager", "commercial"]),
  manager_id: z.string().nullable().optional(),
  phone: z.string().optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
