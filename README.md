# AgroSmart – Smart Irrigation Management System

AgroSmart is a beginner-friendly full-stack precision-farming project. It helps a farmer manage fields and crops, enter simulated soil-moisture readings, review simple irrigation recommendations, and record water usage.

## Technology
- Frontend: React, Vite and plain CSS
- Backend: Node.js and Express
- Database: PostgreSQL
- ORM and migrations: Prisma
- Tests: Node.js built-in test runner and Vitest

## Features in this starter
- Overview dashboard with field, moisture and water-use summaries
- Field and crop catalogue
- Manual soil moisture simulation (no physical hardware)
- Crop-aware, explainable irrigation recommendation rules
- Simulated irrigation logging
- REST API and health endpoint
- PostgreSQL schema and an initial SQL migration

## Requirements
- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL 15+

## Setup
1. Install dependencies from the repository root: `npm run install:all`.
2. Copy `backend/.env.example` to `backend/.env` and set your PostgreSQL connection string.
3. Create a PostgreSQL database named `agrosmart`.
4. From `backend`, run `npx prisma generate` and `npx prisma migrate dev`.
5. Start both apps from the root with `npm run dev`.

Frontend: http://localhost:5173  
Backend: http://localhost:3000/api/health

## Database migration
The initial migration is in `backend/prisma/migrations/202611150001_init/migration.sql`. Prisma tracks applied migrations in `_prisma_migrations`. For later schema updates, edit `schema.prisma` and run:
```bash
cd backend
npx prisma migrate dev --name describe_change
```
For deployment, use `npx prisma migrate deploy`.

## Notes
This version uses manual sensor readings and an irrigation simulator. It does not control real pumps or provide agronomic guarantees. Moisture thresholds are editable sample values and should be calibrated for local soil, crop variety and growth stage before real-world use.

## Added features

- Irrigation planner to create future watering plans for a field.
- Schedule status can be changed to completed or cancelled.
- CSV export for the irrigation history table.
- The planner uses PostgreSQL when the API is connected and keeps temporary plans in the browser in demo mode.
- No pump is controlled and no automatic job runs at the scheduled time.

The planner adds the `IrrigationSchedule` table through the migration in
`backend/prisma/migrations/202611150002_add_irrigation_schedules/migration.sql`.
After starting PostgreSQL, apply it from the backend folder:

```bash
cd backend
npx prisma migrate dev
```

## Frontend deployment

The React app can be deployed as a Vite project on Vercel with `frontend` as
the Root Directory, `npm run build` as the build command, and `dist` as the
output directory. Set `VITE_API_URL` to the public URL of a separately hosted
AgroSmart API to use PostgreSQL from the deployed site. Without that API URL,
the app remains usable in demo mode; database changes will not be saved.
