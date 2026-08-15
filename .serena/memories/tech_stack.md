# Tech Stack

Backend (`backend/`): NestJS 11, TypeScript, Prisma 6 + PostgreSQL, Redis + BullMQ (`@nestjs/bullmq`), MinIO/S3 (`minio` SDK), JWT access+refresh via passport-jwt, class-validator/class-transformer DTOs, nestjs-pino logging, Helmet, `@nestjs/throttler` rate limiting, `@nestjs/swagger` (docs at `/api/docs`), Telegraf (Telegram bot foundation), Jest for tests.

Frontend (`frontend/`): React 19, TypeScript, Vite 7, Ant Design 6 (primary UI kit — avoid competing UI libraries), Zustand (client state: auth/theme/sidebar), TanStack Query 5 (server state), React Router 7, Axios, React Hook Form + Zod, Lucide icons, Framer Motion, Day.js, Leaflet/react-leaflet (address picking, see `MapAddressPicker`).

No monorepo tool — backend and frontend are fully independent npm projects with separate lockfiles/node_modules; no shared TS types package (duplicate shape definitions between `backend` DTOs and `frontend/src/types` are expected, not a bug).
