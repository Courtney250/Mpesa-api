# Courtney M-Pesa Pay

## Overview

This is an M-Pesa payment integration application that allows users to initiate STK Push payments and verify transaction statuses through Safaricom's M-Pesa API. The app provides a simple web interface where users enter their phone number and amount, triggering an M-Pesa payment prompt on their phone, and can then verify the transaction outcome.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; local React state for UI
- **UI Components**: shadcn/ui component library (new-york style) built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming; Inter font family
- **Build Tool**: Vite
- **Entry Point**: `client/src/main.tsx` → `client/src/App.tsx`
- **Pages**: Single main page at `/` (`client/src/pages/payment.tsx`) with a 404 fallback
- **Color Theme**: Green primary (#006400 dark green) on white background — M-Pesa branding

### Backend Architecture
- **Runtime**: Node.js with TypeScript (tsx for development, esbuild for production)
- **Framework**: Express 5
- **API Pattern**: REST API under `/api/` prefix
- **Key Endpoints**:
  - `POST /api/stk-push` — Initiates M-Pesa STK Push payment request
  - `POST /api/query` — Verifies transaction status by checkout request ID
- **M-Pesa Integration**: Direct HTTP calls to Safaricom's Daraja API (sandbox or production based on `MPESA_ENV`)
- **Authentication with M-Pesa**: OAuth2 client credentials flow using consumer key/secret

### Shared Code
- **Location**: `shared/schema.ts`
- **Purpose**: Zod validation schemas shared between client and server for STK Push requests and query requests
- **No database tables defined** — the schema only contains API validation types

### Database
- **Drizzle ORM** is configured with PostgreSQL dialect (`drizzle.config.ts`), but the schema file (`shared/schema.ts`) currently has no database tables — only Zod validation schemas for API payloads
- **DATABASE_URL** environment variable is required by the Drizzle config
- **connect-pg-simple** is listed as a dependency (for session storage) but not actively used yet
- `server/storage.ts` is empty — no database operations implemented yet

### Build & Development
- **Development**: `npm run dev` starts the Express server with Vite middleware for HMR
- **Production Build**: `npm run build` runs Vite build for client + esbuild for server, outputting to `dist/`
- **Production Start**: `npm start` serves the built files
- **Database Push**: `npm run db:push` uses drizzle-kit to push schema to PostgreSQL

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string
- `MPESA_CONSUMER_KEY` — Safaricom Daraja API consumer key
- `MPESA_CONSUMER_SECRET` — Safaricom Daraja API consumer secret
- `MPESA_ENV` — Set to `"production"` for live, otherwise uses sandbox
- `MPESA_SHORTCODE` — Business shortcode (used in STK Push)
- `MPESA_PASSKEY` — Lipa Na M-Pesa passkey
- `MPESA_CALLBACK_URL` — Callback URL for payment notifications

## External Dependencies

### Third-Party APIs
- **Safaricom M-Pesa Daraja API**: Core payment integration. Uses OAuth2 for authentication, STK Push for payment initiation, and transaction query for verification. Sandbox URL: `https://sandbox.safaricom.co.ke`, Production: `https://api.safaricom.co.ke`

### Database
- **PostgreSQL**: Configured via Drizzle ORM but not actively used for data storage yet. The Drizzle config expects a `DATABASE_URL` environment variable.

### Key NPM Packages
- **express** (v5): HTTP server framework
- **drizzle-orm** + **drizzle-kit**: ORM and migration tooling for PostgreSQL
- **zod** + **drizzle-zod**: Schema validation
- **@tanstack/react-query**: Async state management on the client
- **wouter**: Lightweight React routing
- **shadcn/ui** (Radix UI + Tailwind): Full component library
- **vite**: Frontend build tool with HMR
- **tsx**: TypeScript execution for development server
- **esbuild**: Server bundling for production