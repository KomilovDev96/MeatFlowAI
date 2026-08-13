# MeatFlow AI Frontend Graphify

Compact context for the frontend foundation.

## Goal

Build `frontend/` as a React/Vite TypeScript foundation for MeatFlow AI. Do not implement heavy business modules yet.

## Stack

React, TypeScript, Vite, Ant Design, Zustand, TanStack Query, React Router, Axios, React Hook Form, Zod, Lucide React, Framer Motion, Day.js, Ant Design Charts/ECharts.

## UX Direction

Minimal, modern, professional, clean business dashboard for meat-product company operations. Avoid overloaded ERP visuals. Ant Design is the primary UI framework.

## Design System

Centralized tokens:

```text
primary, secondary, success, warning, error, info
background, surface, border, text, muted text
light theme, dark theme
spacing scale, typography scale, radius scale
```

Files:

```text
src/styles/tokens.ts
src/styles/theme.ts
src/styles/global.css
```

## Architecture

```text
src/
  app/
  api/
  components/
    ui/
    layout/
    forms/
    tables/
    charts/
  features/
    auth/
    super-admin/
    admins/
    companies/
    clients/
    products/
    analytics/
    client/
  routes/
  stores/
  styles/
  types/
```

## State

Zustand: auth state, current user, theme mode, sidebar state.

TanStack Query: future server state for admins, companies, clients, products, analytics, audit logs.

## API Layer

Axios instance in `src/api/client.ts`:

```text
base URL
Bearer access token
401 handling
common error path
```

Feature API files exist for auth, admins, companies, clients, products, analytics.

## Layout

Application shell:

```text
Header
Collapsible sidebar with icons
Main content
Role-aware navigation
Light/dark switch
Logout
```

## Roles

SUPER_ADMIN routes:

```text
Dashboard, Admins, Companies, Analytics, Audit Logs
```

ADMIN routes:

```text
Dashboard, Clients, Products, Analytics, Profile, Company
```

CLIENT routes:

```text
Dashboard/Profile foundation
```

Backend authorization remains the source of truth.

## Components

Current foundation:

```text
PageHeader
StatCard
LoadingState
EmptyState
ErrorState
DataTable
ChartCard
FormShell
AppLayout
ProtectedRoute
```

## Pages

```text
/login
/
/admins
/companies
/clients
/products
/analytics
/audit
/profile
```

## Quality Checks

Run:

```text
npm run build
npm run lint
```

Current known improvement: Vite warns about a large JS chunk due to Ant Design and charts. Add lazy routes/manual chunks later.
