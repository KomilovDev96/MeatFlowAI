# Frontend Core (`frontend/`)

React/Vite SPA. `src/` layout: `app/` (providers, bootstrap), `api/` (one file per feature domain, Axios client in `api/client.ts`), `components/{ui,layout,forms,tables}`, `features/{auth,super-admin,admins,companies,clients,products,client}`, `routes/`, `stores/` (Zustand), `styles/` (design tokens/theme), `types/`.

`features/analytics/AnalyticsPage.tsx` and `components/charts/ChartCard.tsx` were removed (see git status) — analytics UI is being reworked/relocated rather than absent from the product; check `dashboard`-related backend module (`mem:backend/core`) and current routes before assuming analytics has no frontend surface.

Role-aware routing (backend remains source of truth for authorization, frontend routing is UX-only):
- SUPER_ADMIN: Dashboard, Admins, Companies, Analytics, Audit Logs
- ADMIN: Dashboard, Clients, Products, Analytics, Profile, Company
- CLIENT: Dashboard/Profile foundation only

Auth state (current user, tokens) lives in `stores/auth.store.ts` (Zustand); theme/sidebar UI state in `stores/ui.store.ts`. Server state goes through TanStack Query, not component-local fetch.

Known perf caveat (from `docs/FRONTEND_GRAPHIFY.md`): Vite warns about a large JS chunk from Ant Design + charts — lazy routes/manual chunking not yet done.
