export interface CommuneMartinique {
  code_postal: string;
  commune: string;
}

export const COMMUNES_MARTINIQUE: CommuneMartinique[] = [
  { code_postal: "97200", commune: "Fort-de-France" },
  { code_postal: "97232", commune: "Le Lamentin" },
  { code_postal: "97234", commune: "Fort-de-France (Dillon)" },
  { code_postal: "97233", commune: "Schoelcher" },
  { code_postal: "97224", commune: "Ducos" },
  { code_postal: "97228", commune: "Sainte-Luce" },
  { code_postal: "97215", commune: "Rivière-Salée" },
  { code_postal: "97231", commune: "Le Robert" },
  { code_postal: "97220", commune: "La Trinité" },
  { code_postal: "97230", commune: "Sainte-Marie" },
  { code_postal: "97214", commune: "Le Lorrain" },
  { code_postal: "97218", commune: "Basse-Pointe" },
  { code_postal: "97210", commune: "Le Prêcheur" },
  { code_postal: "97250", commune: "Saint-Pierre" },
  { code_postal: "97260", commune: "Le Morne-Rouge" },
  { code_postal: "97222", commune: "Case-Pilote" },
  { code_postal: "97221", commune: "Le Carbet" },
  { code_postal: "97226", commune: "Le Marin" },
  { code_postal: "97211", commune: "Rivière-Pilote" },
  { code_postal: "97223", commune: "Le Diamant" },
  { code_postal: "97217", commune: "Les Anses-d'Arlet" },
  { code_postal: "97229", commune: "Les Trois-Îlets" },
  { code_postal: "97227", commune: "Sainte-Anne" },
  { code_postal: "97240", commune: "Le François" },
  { code_postal: "97213", commune: "Gros-Morne" },
  { code_postal: "97216", commune: "L'Ajoupa-Bouillon" },
  { code_postal: "97212", commune: "Saint-Joseph" },
  { code_postal: "97225", commune: "Marigot" },
  { code_postal: "97219", commune: "Sainte-Marie (Bezaudin)" },
  { code_postal: "97235", commune: "Bellefontaine" },
  { code_postal: "97236", commune: "Le Morne-Vert" },
  { code_postal: "97270", commune: "Saint-Esprit" },
  { code_postal: "97280", commune: "Le Vauclin" },
  { code_postal: "97290", commune: "Le Marin (Sainte-Anne)" },
  { code_postal: "97238", commune: "Fort-de-France (Terres-Sainville)" },
];

// Liste unique des codes postaux
export const CODES_POSTAUX_MARTINIQUE = [
  ...new Set(COMMUNES_MARTINIQUE.map((c) => c.code_postal)),
].sort();

// Recherche par code postal
export function getCommunesByCodePostal(codePostal: string): CommuneMartinique[] {
  return COMMUNES_MARTINIQUE.filter((c) => c.code_postal === codePostal);
}

// Recherche par commune (fuzzy)
export function searchCommunes(query: string): CommuneMartinique[] {
  if (!query) return COMMUNES_MARTINIQUE;
  const lower = query.toLowerCase();
  return COMMUNES_MARTINIQUE.filter(
    (c) =>
      c.commune.toLowerCase().includes(lower) ||
      c.code_postal.includes(lower)
  );
}
