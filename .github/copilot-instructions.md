# Respondent-Driven Sampling (RDS) App - AI Coding Instructions

## Project Overview

This is a **monolithic React + Node.js application** for homelessness research data collection via Respondent-Driven Sampling. The backend (Express + MongoDB) serves the frontend (React) as static files in production.

**Research Context**: Volunteers conduct surveys with homeless individuals using QR code-based referral chains. Each survey generates 3 child referral codes, creating a social network sampling structure for population estimation.

## Architecture & Key Patterns

### Monorepo Structure

-   **`client/`**: React SPA (Vite + TypeScript + Material-UI)
-   **`server/`**: Express API (TypeScript + MongoDB via Mongoose)
-   **Shared types**: Client imports server permission constants via `@/permissions/*` path alias (see `client/tsconfig.json`)

### Backend Architecture: Domain-Driven Controllers

The backend uses a **layered domain structure** distinct from typical Express apps:

```
server/src/database/{domain}/
  ├── mongoose/          # Mongoose models + hooks
  │   ├── {domain}.model.ts
  │   └── {domain}.hooks.ts
  ├── zod/               # Zod validation schemas
  │   ├── {domain}.base.ts      # Base schema
  │   └── {domain}.validator.ts # Request validators
  ├── {domain}.controller.ts    # Business logic (called from routes)
  └── {domain}.utils.ts         # Domain utilities
```

**Critical**: Controllers in `database/{domain}/*.controller.ts` contain business logic, NOT routes. Routes in `routes/v2/{domain}.ts` call controller functions. See `server/src/database/survey/survey.controller.ts` (generates unique survey codes) vs `server/src/routes/v2/surveys.ts`.

### Authentication & Authorization Flow

1. **Token Storage**: Client uses Zustand persistent store (`useAuthStore`) → stores JWT in localStorage
2. **Auth Middleware** (`server/src/middleware/auth.ts`):
    - Verifies JWT signature
    - Checks user approval status (must be `APPROVED`)
    - Fetches user's latest survey location for location-based permissions
    - Injects CASL `Ability` into `req.authorization`
3. **CASL Permissions** (`server/src/permissions/`):
    - Role-based + attribute-based (conditions like `IS_CREATED_BY_SELF`, `HAS_SAME_LOCATION`)
    - Permissions are MongoDB query conditions (see `CONDITION_QUERIES` in `constants.ts`)
    - Frontend mirrors permission checks via `useAbility` hook

**Example**: Volunteers can only update surveys they created today at their current location:

```typescript
// server/src/permissions/permissions.ts
can(ACTIONS.CASL.UPDATE, SUBJECTS.SURVEY, {
	conditions: [CONDITIONS.IS_CREATED_BY_SELF, CONDITIONS.WAS_CREATED_TODAY],
});
```

### Survey Referral Chain System

**Core Concept**: Each survey has `surveyCode` (its own ID) and `parentSurveyCode` (referrer). Upon creation, generates 3 unique `childSurveyCodes` for participants to refer others.

**Key Controller Functions** (`server/src/database/survey/survey.controller.ts`):

-   `generateUniqueChildSurveyCodes()`: Creates 3 collision-free 8-char hex codes
-   `getParentSurveyCode()`: Finds parent survey by searching `childSurveyCodes` arrays

**QR Code Workflow**:

1. Survey completion → QR page (`client/src/pages/QrPage/`) displays `childSurveyCodes`
2. Participant scans code → `ApplyReferral` page sets `parentSurveyCode` for new survey

## Development Workflows

### Local Development

```bash
# Terminal 1 - Backend (port 1234)
cd server
npm install
npm run dev  # tsx with --watch flag

# Terminal 2 - Frontend (port 3000, proxies API to :1234)
cd client
npm install
npm run dev  # Vite dev server
```

**Environment Setup**: Copy `server/.env.example` to `server/.env` with MongoDB URI (Azure Cosmos DB), Twilio credentials, JWT secret.

### Testing

```bash
cd server
npm test              # Jest with ts-jest
npm run test:watch    # Watch mode
npm run test:coverage # Coverage reports
```

**Test Structure**: Tests live alongside source in `__tests__/` folders (e.g., `server/src/database/survey/__tests__/`). Use `@jest/globals` imports for describe/test/expect.

### API Versioning

-   **v1 routes** (`/api/auth`, `/api/surveys`): Legacy, being deprecated
-   **v2 routes** (`/api/v2/users`, `/api/v2/surveys`): Current, use these for new features
-   All v2 routes use Zod validation middleware: `validate(createSurveySchema)` before handler

### Path Aliases (Critical)

Both client and server use `@/*` for imports:

-   **Server**: `tsconfig.json` + `tsc-alias` build step resolves to `src/*`
-   **Client**: Vite resolves `@/*` to `src/*`, plus special `@/permissions/*` → `../server/src/permissions/*` for shared constants

## Deployment (Azure App Service)

**Build Process**:

```bash
cd client && npm run build  # Outputs to client/dist/
cp -r client/dist server/   # Server serves static files
cd server && npm run build  # TypeScript compilation to server/build/
node build/index.js         # Production server
```

**GitHub Actions**: See `docs/deployment.md`. Workflow builds client, copies to `server/dist/`, deploys `server/` folder to Azure. Uses `AZURE_PUBLISH_PROFILE` secret.

**Manual Deploy**: VSCode Azure extension deploys `server/` folder (configured in `.vscode/settings.json`). Delete `node_modules` before deploy to save bandwidth.

## Security Requirements

**Headers**: Extensive security middleware in `server/src/index.ts`:

-   CSP, HSTS, X-Frame-Options, XSS-Protection enforced on ALL responses
-   Custom middleware re-applies headers per-route (lines 76-89)
-   Do NOT modify security headers without team review

**CORS**: Currently set to `origin: '*'` (line 137) - CHANGE in production to specific domains.

## Common Gotchas

1. **Survey Code Uniqueness**: `childSurveyCodes` must be unique within array AND globally. Controller retries 3 times before throwing `SURVEY_CODE_GENERATION_ERROR`.

2. **Location Context**: Auth middleware derives user's "latest location" from their most recent survey, NOT user profile. This affects permission queries for reading/updating surveys.

3. **SWR Cache**: Frontend uses SWR for data fetching. After mutations (create/update), manually call `mutate()` to invalidate cache (see `client/src/hooks/useApi.tsx` lines 145-148).

4. **Approval Flow**: New users register with `approvalStatus: PENDING`. Admins approve via `/api/v2/users/:id` PATCH. Auth middleware blocks non-approved users at 403.

5. **Mongoose Hooks**: Pre-save validation in `{domain}.hooks.ts` files (e.g., `survey.hooks.ts` validates survey code existence, referral chain validity). These run BEFORE Zod validation.

## Project-Specific Conventions

-   **Route handlers**: Return explicit `res.status().json()`, never implicit returns
-   **Error responses**: Use domain errors from `server/src/database/utils/errors.ts`, e.g., `throw errors.SURVEY_NOT_FOUND`
-   **Zod schemas**: Base schemas in `zod/*.base.ts` (full document), validators in `zod/*.validator.ts` (API requests)
-   **Component exports**: Use barrel exports `index.ts` files (e.g., `client/src/pages/index.ts` exports all pages)
-   **Styling**: Material-UI theme in `client/src/theme/muiTheme.ts` + legacy CSS files (being migrated)

## Key Files for Context

-   **Backend entry**: `server/src/index.ts` - security setup, route registration
-   **Auth flow**: `server/src/middleware/auth.ts`, `client/src/contexts/AuthContext.tsx`
-   **Permissions**: `server/src/permissions/constants.ts`, `client/src/hooks/useAbility.tsx`
-   **Survey logic**: `server/src/database/survey/survey.controller.ts`
-   **API client**: `client/src/hooks/useApi.tsx` - all fetch logic with auth
-   **Routes**: `server/src/routes/v2/` - RESTful API endpoints
