# ZENITH ECO - CRM Simulateur Toiture

## Documentation Technique & Guide de Déploiement

---

## 📋 Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Stack technique](#2-stack-technique)
3. [Architecture du projet](#3-architecture-du-projet)
4. [Accéder à l'application](#4-accéder-à-lapplication)
5. [Installation locale (développement)](#5-installation-locale-développement)
6. [Variables d'environnement](#6-variables-denvironnement)
7. [Base de données Supabase](#7-base-de-données-supabase)
8. [Déploiement sur Vercel](#8-déploiement-sur-vercel)
9. [Mettre à jour l'application](#9-mettre-à-jour-lapplication)
10. [Structure des fichiers](#10-structure-des-fichiers)
11. [Routes et pages](#11-routes-et-pages)
12. [API Routes](#12-api-routes)
13. [Rôles et permissions](#13-rôles-et-permissions)
14. [Tests](#14-tests)
15. [Historique des modifications](#15-historique-des-modifications)

---

## 1. Présentation du projet

**ZENITH ECO** est un CRM (Customer Relationship Management) développé pour **ENRFREE**, une entreprise d'énergie renouvelable basée en Martinique (Fort-de-France).

### Fonctionnalités principales :
- **Simulations de toiture** : calcul de devis pour installations solaires/toiture
- **Gestion des devis** : création, édition, export PDF
- **Gestion des clients/contacts**
- **Suivi des documents** : pièces justificatives, attestations
- **Gestion d'équipe** : admin, managers, commerciaux
- **Calcul automatique** : aides MPR, primes CEE, coûts chantier, taux de crédit
- **PWA** : installable sur mobile comme une application native

---

## 2. Stack technique

| Technologie | Version | Rôle |
|---|---|---|
| **Next.js** | 15.1+ | Framework React (App Router) |
| **React** | 19.0 | Bibliothèque UI |
| **TypeScript** | 5.7+ | Typage statique |
| **Supabase** | 2.49+ | Base de données PostgreSQL + Auth |
| **Tailwind CSS** | 3.4+ | Framework CSS utilitaire |
| **Shadcn/ui** | - | Composants UI (basés sur Radix) |
| **Radix UI** | - | Primitives UI accessibles |
| **React Hook Form** | 7.54+ | Gestion des formulaires |
| **Zod** | 3.24+ | Validation de schémas |
| **@react-pdf/renderer** | 4.3+ | Génération de PDF |
| **date-fns** | 4.1+ | Manipulation de dates |
| **Lucide React** | 0.469+ | Icônes |
| **Sonner** | 1.7+ | Notifications toast |
| **Vitest** | 2.1+ | Tests unitaires |
| **Playwright** | 1.49+ | Tests E2E |

---

## 3. Architecture du projet

Le projet utilise l'**App Router** de Next.js 15 avec des **Route Groups** pour séparer les layouts par rôle utilisateur :

```
src/
├── app/                    # Pages et routes (App Router)
│   ├── (admin)/           # Routes admin (layout admin)
│   ├── (auth)/            # Routes authentification (login/register)
│   ├── (commercial)/      # Routes commercial (layout commercial)
│   ├── (dashboard)/       # Routes tableau de bord
│   ├── (manager)/         # Routes manager (layout manager)
│   ├── api/               # API Routes (serverless)
│   ├── layout.tsx         # Layout racine
│   └── page.tsx           # Page d'accueil
├── components/            # Composants réutilisables
│   ├── ui/               # Composants Shadcn/ui
│   ├── layout/           # Navigation (AdminNav, CommercialNav, ManagerNav)
│   └── features/         # Composants métier (simulation, documents, PWA)
├── hooks/                 # Hooks personnalisés
├── lib/                   # Logique métier
│   ├── supabase/         # Clients Supabase (server, client, admin, middleware)
│   ├── pdf/              # Générateur de devis PDF
│   ├── calculations/     # Moteur de simulation et calculs
│   ├── utils.ts          # Utilitaires
│   └── validations.ts    # Schémas de validation Zod
├── types/                 # Types TypeScript (Database, etc.)
└── middleware.ts          # Middleware d'authentification
```

---

## 4. Accéder à l'application

### 🌐 URL de production
```
https://zenith-eco-crm-test.vercel.app
```

### Tableau de bord Vercel
```
https://vercel.com/dove972s-projects/zenith-eco-crm-test
```

### Dépôt GitHub
```
https://github.com/dove972/zenith-eco-crm-test
```

### Supabase Dashboard
```
https://supabase.com/dashboard/project/sljaakzyqbkzdlpzjbcu
```

---

## 5. Installation locale (développement)

### Prérequis
- **Node.js** >= 18.x
- **npm** >= 9.x (ou yarn/pnpm)
- **Git**

### Étapes

```bash
# 1. Cloner le dépôt
git clone https://github.com/dove972/zenith-eco-crm-test.git
cd zenith-eco-crm-test

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos vraies clés Supabase

# 4. Lancer le serveur de développement
npm run dev

# 5. Ouvrir dans le navigateur
# http://localhost:3000
```

### Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev` | Lance le serveur de développement (Turbopack) |
| `npm run build` | Compile le projet pour la production |
| `npm run start` | Démarre le serveur de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run type-check` | Vérifie les types TypeScript |
| `npm run test` | Lance les tests unitaires (Vitest) |
| `npm run test:e2e` | Lance les tests E2E (Playwright) |
| `npm run format` | Formate le code avec Prettier |

---

## 6. Variables d'environnement

### Fichier `.env.local` (NE PAS COMMITER)

```env
# Supabase - URL du projet
NEXT_PUBLIC_SUPABASE_URL="https://sljaakzyqbkzdlpzjbcu.supabase.co"

# Supabase - Clé anonyme (publique, côté client)
NEXT_PUBLIC_SUPABASE_ANON_KEY="votre-anon-key"

# Supabase - Clé Service Role (SECRÈTE, côté serveur uniquement)
SUPABASE_SERVICE_ROLE_KEY="votre-service-role-key"

# Application
NEXT_PUBLIC_APP_NAME="ZENITH ECO - Simulateur Toiture"
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # ou l'URL Vercel en production
```

### Où trouver les clés Supabase ?
1. Aller sur https://supabase.com/dashboard/project/sljaakzyqbkzdlpzjbcu
2. Menu **Settings** > **API**
3. Copier les clés :
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ SECRÈTE)

### Variables configurées sur Vercel
Les variables sont déjà configurées sur Vercel :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`

> ⚠️ **TODO** : Ajouter `SUPABASE_SERVICE_ROLE_KEY` sur Vercel pour que la création d'utilisateurs admin fonctionne.

---

## 7. Base de données Supabase

### Tables principales

| Table | Description |
|---|---|
| `profiles` | Profils utilisateurs (nom, rôle, téléphone, manager_id) |
| `simulations` | Simulations de toiture (client, surface, matériaux, aides) |
| `devis` | Devis générés (numéro, statut, mode de paiement) |
| `documents` | Documents justificatifs (identité, avis d'imposition, etc.) |
| `products` | Catalogue produits |
| `baremes_mpr` | Barèmes MaPrimeRénov' |
| `primes_cee` | Primes CEE (Certificats d'Économie d'Énergie) |
| `tarifs` | Grille tarifaire |
| `taux_credit` | Taux de crédit |
| `couts_chantier` | Coûts de chantier |

### Types principaux (TypeScript)

```typescript
type UserRole = "admin" | "manager" | "commercial";
type SimulationStatus = "brouillon" | "devis_envoye" | "accepte" | "refuse" | "expire";
type DevisStatus = "brouillon" | "envoye" | "accepte" | "refuse" | "expire";
type PaymentMode = "comptant" | "multipaiement" | "financement" | "cheque" | "especes";
type DocumentType = "identity" | "tax_notice" | "property_tax" | "payslips" | "rib" | "edf_invoice";
```

### Authentification
- Gérée par **Supabase Auth**
- Middleware Next.js pour la gestion des sessions (cookies SSR)
- Row Level Security (RLS) activé sur toutes les tables

---

## 8. Déploiement sur Vercel

### Configuration actuelle
- **Projet** : `zenith-eco-crm-test`
- **Équipe** : `dove972's projects`
- **Framework** : Next.js (détecté automatiquement)
- **Région** : `cdg1` (Paris, France)
- **Branche** : `main`

### Déploiement automatique
Chaque `git push` sur la branche `main` déclenche automatiquement un nouveau déploiement sur Vercel.

### Fichier `vercel.json`
```json
{
  "regions": ["cdg1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Fichier `next.config.ts`
```typescript
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};
```

> **Note** : `ignoreBuildErrors` et `ignoreDuringBuilds` sont activés pour permettre le déploiement. Le type-checking et le linting sont exécutés séparément via les scripts `npm run type-check` et `npm run lint`.

---

## 9. Mettre à jour l'application

### Workflow de mise à jour

```bash
# 1. Se placer dans le répertoire du projet
cd /chemin/vers/zenith-eco-crm-test

# 2. Vérifier l'état actuel
git status

# 3. Faire les modifications nécessaires dans le code

# 4. Ajouter les fichiers modifiés
git add .

# 5. Committer les changements
git commit -m "Description des changements"

# 6. Pousser sur GitHub (déclenche le déploiement automatique Vercel)
git push origin main

# 7. Vérifier le déploiement sur :
# https://vercel.com/dove972s-projects/zenith-eco-crm-test
```

### Vérifier le déploiement
1. Aller sur le [Dashboard Vercel](https://vercel.com/dove972s-projects/zenith-eco-crm-test)
2. L'onglet **Deployments** montre l'historique
3. Chaque déploiement a ses logs de build
4. En cas d'erreur, consulter les **Build Logs**

### Rollback
Si un déploiement pose problème :
1. Dashboard Vercel > Deployments
2. Trouver le dernier déploiement fonctionnel
3. Cliquer sur les 3 points > **Promote to Production**

---

## 10. Structure des fichiers

```
zenith-eco-crm-test/
├── public/                 # Fichiers statiques (images, manifest PWA)
├── src/
│   ├── app/
│   │   ├── (admin)/       # 🔴 Zone Admin
│   │   │   └── admin/
│   │   │       ├── page.tsx              # Dashboard admin
│   │   │       ├── profil/               # Profil admin
│   │   │       ├── produits/             # Gestion produits
│   │   │       ├── baremes-mpr/          # Barèmes MPR
│   │   │       ├── primes-cee/           # Primes CEE
│   │   │       ├── tarifs/               # Tarifs
│   │   │       ├── taux-credit/          # Taux de crédit
│   │   │       ├── couts-chantier/       # Coûts chantier
│   │   │       ├── utilisateurs/         # Gestion utilisateurs
│   │   │       └── simulations/          # Simulations (list, new, [id])
│   │   ├── (auth)/        # 🔑 Authentification
│   │   │   ├── login/                    # Page de connexion
│   │   │   └── register/                 # Page d'inscription
│   │   ├── (commercial)/  # 🟢 Zone Commercial
│   │   │   └── commercial/
│   │   │       ├── profil/               # Profil commercial
│   │   │       └── simulations/          # Simulations (list, new, [id])
│   │   ├── (manager)/     # 🔵 Zone Manager
│   │   │   └── manager/
│   │   │       ├── page.tsx              # Dashboard manager
│   │   │       ├── profil/               # Profil manager
│   │   │       └── equipe/               # Gestion d'équipe
│   │   └── api/           # 🔗 API Routes
│   │       ├── auth/signout/             # Déconnexion
│   │       ├── devis/                    # CRUD devis + PDF
│   │       ├── health/                   # Health check
│   │       ├── admin/users/              # Création utilisateur (admin)
│   │       ├── contacts/                 # Contacts
│   │       └── deals/                    # Deals
│   ├── components/
│   │   ├── ui/            # Shadcn/ui (button, card, input, badge, etc.)
│   │   ├── layout/        # Navbars par rôle
│   │   └── features/      # Composants métier
│   │       ├── simulation/               # Steps du wizard simulation
│   │       └── documents/                # Upload et checklist documents
│   ├── hooks/             # use-auth, use-simulation-paths, etc.
│   ├── lib/
│   │   ├── supabase/      # Clients Supabase (server, client, admin, middleware)
│   │   ├── pdf/           # Génération de devis PDF
│   │   └── calculations/  # Moteur de simulation
│   └── types/             # Types TypeScript (Database, etc.)
├── .env.example           # Template des variables d'environnement
├── .env.local             # Variables réelles (NE PAS COMMITER)
├── next.config.ts         # Configuration Next.js
├── vercel.json            # Configuration Vercel
├── tailwind.config.ts     # Configuration Tailwind CSS
├── tsconfig.json          # Configuration TypeScript
└── package.json           # Dépendances et scripts
```

---

## 11. Routes et pages

### Authentification
| Route | Description |
|---|---|
| `/login` | Page de connexion |
| `/register` | Page d'inscription |

### Admin
| Route | Description |
|---|---|
| `/admin` | Dashboard administrateur |
| `/admin/profil` | Profil admin |
| `/admin/produits` | Gestion des produits |
| `/admin/baremes-mpr` | Barèmes MaPrimeRénov' |
| `/admin/primes-cee` | Primes CEE |
| `/admin/tarifs` | Grille tarifaire |
| `/admin/taux-credit` | Taux de crédit |
| `/admin/couts-chantier` | Coûts de chantier |
| `/admin/utilisateurs` | Gestion des utilisateurs |
| `/admin/simulations` | Liste des simulations |
| `/admin/simulations/new` | Nouvelle simulation |
| `/admin/simulations/[id]` | Détail simulation |
| `/admin/simulations/[id]/devis` | Devis de la simulation |
| `/admin/simulations/[id]/devis/edit` | Édition du devis |
| `/admin/simulations/[id]/documents` | Documents de la simulation |

### Manager
| Route | Description |
|---|---|
| `/manager` | Dashboard manager |
| `/manager/profil` | Profil manager |
| `/manager/equipe` | Gestion de l'équipe |

### Commercial
| Route | Description |
|---|---|
| `/commercial/profil` | Profil commercial |
| `/commercial/simulations` | Mes simulations |
| `/commercial/simulations/new` | Nouvelle simulation |
| `/commercial/simulations/[id]` | Détail simulation |
| `/commercial/simulations/[id]/devis` | Devis |
| `/commercial/simulations/[id]/devis/edit` | Édition devis |
| `/commercial/simulations/[id]/documents` | Documents |

---

## 12. API Routes

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/api/devis` | Créer un devis |
| `PATCH` | `/api/devis` | Modifier le statut d'un devis |
| `GET` | `/api/devis/[id]/pdf` | Générer le PDF d'un devis |
| `POST` | `/api/auth/signout` | Déconnexion |
| `GET` | `/api/health` | Health check (statut de l'app) |
| `POST` | `/api/admin/users` | Créer un utilisateur (admin uniquement) |
| `*` | `/api/contacts` | Gestion des contacts |
| `*` | `/api/deals` | Gestion des deals |

---

## 13. Rôles et permissions

| Rôle | Accès | Description |
|---|---|---|
| **admin** | Tout | Accès complet : utilisateurs, produits, tarifs, toutes simulations |
| **manager** | Équipe + simulations | Voit son équipe, peut superviser les simulations de ses commerciaux |
| **commercial** | Ses simulations | Crée et gère ses propres simulations et devis |

Le middleware Supabase gère l'authentification et les sessions. Les Row Level Security (RLS) policies dans Supabase contrôlent l'accès aux données au niveau de la base.

---

## 14. Tests

```bash
# Tests unitaires avec Vitest
npm run test

# Tests E2E avec Playwright
npm run test:e2e

# Couverture de code
npm run test -- --coverage
```

Le moteur de simulation dispose de tests unitaires dans :
```
src/lib/calculations/simulationEngine.test.ts
```

---

## 15. Historique des modifications

### 2026-03-04 - Déploiement initial sur Vercel
**Modifications effectuées :**
1. **Suppression de `output: "standalone"`** dans `next.config.ts` (incompatible avec Vercel)
2. **Suppression de `render.yaml`** (vestige d'un précédent hébergement sur Render)
3. **Mise à jour de `.env.example`** avec les bonnes variables pour Vercel
4. **Création du dépôt GitHub** : `dove972/zenith-eco-crm-test`
5. **Push de 107 fichiers** (25,744 lignes de code)
6. **Création du projet Vercel** avec les variables d'environnement
7. **Déploiement réussi** sur https://zenith-eco-crm-test.vercel.app

### TODO post-déploiement
- [ ] Ajouter `SUPABASE_SERVICE_ROLE_KEY` aux variables Vercel (pour la création d'utilisateurs admin)
- [ ] Configurer les URL autorisées dans Supabase Auth (Settings > Authentication > URL Configuration) :
  - Site URL : `https://zenith-eco-crm-test.vercel.app`
  - Redirect URLs : `https://zenith-eco-crm-test.vercel.app/**`
- [ ] Tester la connexion / inscription en production
- [ ] Ajouter un domaine personnalisé si nécessaire

---

## ℹ️ Informations entreprise

```
ZENITH ECO By ENRFREE
32 rue du Bocage, FORT DE FRANCE
SIRET : 901 309 518 00032
NUM TVA : FR22901309518
RCS : 901 309 518 R.C.S. Fort-de-France
Tél : 0696 66 94 44
```

---

*Documentation générée le 04/03/2026*
