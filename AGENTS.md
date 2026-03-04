# AGENTS.md - ZENITH ECO CRM Simulateur Toiture

## Overview

Application mobile-first de simulation de toiture pour commerciaux ZENITH ECO. Back-office admin, moteur de calcul, génération de devis officiels, capture de documents.

## Architecture

- **Framework**: Next.js 15 avec App Router
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth (roles: admin, manager, commercial)
- **Storage**: Supabase Storage (documents, devis PDF)
- **Styling**: TailwindCSS + shadcn/ui
- **Validation**: Zod + react-hook-form
- **PDF**: @react-pdf/renderer
- **Testing**: Vitest + React Testing Library + Playwright

## Coding Standards

### TypeScript
- Strict mode enabled, no `any` types
- Use interfaces for object shapes, types for unions/intersections
- All functions must have explicit return types for public APIs

### React / Next.js
- Server Components by default, `'use client'` only when needed
- Custom hooks for reusable stateful logic
- Error boundaries for graceful error handling

### API Routes
- Always validate inputs with Zod
- Return consistent response format: `{ success: boolean, data?: T, error?: string }`
- Handle all errors with proper HTTP status codes

### Database
- All queries through Supabase client (@supabase/ssr)
- RLS policies enforce access control per role
- Use transactions for multi-step operations

## File Structure

```
src/app/(auth)/        → Login page
src/app/(admin)/       → Admin back-office (tarifs, barèmes, utilisateurs)
src/app/(manager)/     → Manager dashboard
src/app/(commercial)/  → Commercial wizard + simulations
src/app/api/           → API routes
src/components/ui/     → Generic UI components (shadcn)
src/components/features/ → Business components
src/lib/               → Utilities, Supabase config, calculations
src/lib/supabase/      → Supabase client/server/middleware
src/lib/calculations/  → Simulation engine
src/hooks/             → Custom React hooks
src/types/             → TypeScript types + database types
```

## Roles & Permissions

- **Admin**: Full access (barèmes, tarifs, coûts/marges, users, all simulations)
- **Manager**: Team view (assigned commercials, their simulations/devis)
- **Commercial**: Own simulations only (no margins/costs visibility)

## Git Workflow

- Branch from `develop`, never from `main` directly
- Commit format: `type(scope): description`
- Never commit `.env` files
