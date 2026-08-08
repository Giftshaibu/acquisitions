# Acquisitions API

The application uses the Neon serverless HTTP driver with Drizzle ORM. Development runs the app beside [Neon Local](https://neon.com/docs/local/neon-local), while production connects directly to a managed Neon Cloud database.

Neon Local is a local proxy, not a fully local Postgres server. It uses your Neon API credentials to create an ephemeral child branch when the container starts and deletes that branch when the container stops. Using `PARENT_BRANCH_ID` enables this lifecycle.

## Prerequisites

- Docker with Docker Compose
- A Neon project
- A Neon API key, project ID, and parent branch ID for local development

## Local development with Neon Local

Create the ignored development environment file:

```bash
cp .env.development.example .env.development
```

Fill in `NEON_API_KEY`, `NEON_PROJECT_ID`, `PARENT_BRANCH_ID`, `ARCJET_KEY`, and `JWT_SECRET`. Do not commit this file.

Start the application and Neon Local:

```bash
docker compose --env-file .env.development -f docker-compose.dev.yml up --build
```

The application is available at `http://localhost:3000`. From inside the Compose network it connects with:

```text
postgres://neon:npg@neon-local:5432/neondb?sslmode=no-verify
```

The Neon serverless driver also uses `http://neon-local:5432/sql` as its HTTP query endpoint. From a database tool running directly on the host, use `localhost` instead of `neon-local`.

Apply the Drizzle migrations after the services start:

```bash
docker compose --env-file .env.development -f docker-compose.dev.yml exec app npm run db:migrate
```

Stop the environment and delete its ephemeral Neon branch:

```bash
docker compose --env-file .env.development -f docker-compose.dev.yml down
```

Source files are mounted into the development container, and Node watch mode restarts the app after changes.

## Production with Neon Cloud

Production does not run Neon Local or a Postgres container. Neon Serverless is managed by Neon; the Compose stack runs the application and injects its Neon Cloud URL.

Create the ignored production environment file:

```bash
cp .env.production.example .env.production
```

Replace every placeholder. `DATABASE_URL` must be a real Neon Cloud URL ending in `neon.tech` and should include `sslmode=require`. Never bake this file into the image or commit it.

Run migrations as a separate release step:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml --profile migration run --rm migrate
```

The migration service uses a dedicated image target containing Drizzle Kit. The application runtime image excludes development dependencies. Run migrations as an explicit release step, not automatically in every application replica.

Build and start production:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up --build -d
```

View logs or stop the deployment:

```bash
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml down
```

For a managed deployment platform, build the `production` target and inject the same variables through the platform's secret manager:

```bash
docker build --target production -t acquisitions-api .
```

## Environment switching

| Environment | Compose file | Database endpoint | Local proxy |
| --- | --- | --- | --- |
| Development | `docker-compose.dev.yml` | `neon-local:5432` plus `http://neon-local:5432/sql` | Yes |
| Production | `docker-compose.prod.yml` | Neon Cloud `*.neon.tech` URL | No |

The application always reads `DATABASE_URL`. Only development sets `NEON_LOCAL_FETCH_ENDPOINT`; when it is absent, the Neon driver derives the cloud HTTP endpoint from `DATABASE_URL`.

## Secret handling

`.env`, `.env.development`, and `.env.production` are ignored. Only sanitized `.example` templates are committed. If a secret has ever been pushed to Git, rotate it; adding the file to `.gitignore` does not remove it from Git history.
