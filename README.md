# Food Delivery Web

College final project — food delivery web application.

## Tech stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma ORM
- PostgreSQL

## Prerequisites

- Node.js 22+ (see `.nvmrc`)
- PostgreSQL 14+ (local install, Docker, or cloud)
- npm

## Quick start

```bash
# Use the correct Node version
nvm use

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start PostgreSQL, then run migrations
npm run db:migrate

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
src/
  app/              # App Router pages, layouts, route handlers
    api/            # Next.js Route Handlers
  components/
    ui/             # Shared UI components
  lib/              # Utilities (e.g. Prisma client singleton)
  types/            # Shared TypeScript types
prisma/
  schema.prisma     # Database schema
  migrations/       # SQL migrations (created after first migrate)
```

## Database scripts

| Command | Description |
|---|---|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Create and apply migrations (dev) |
| `npm run db:push` | Push schema without migration files |
| `npm run db:studio` | Open Prisma Studio GUI |

## Environment variables

See `.env.example` for required variables.
