## Uptimedpin

**Uptimedpin** is a polyrepo/monorepo-style project for monitoring website uptime using a combination of a Next.js frontend, an Express API, a Bun-powered hub and validator workers, and a shared Prisma/PostgreSQL database package.

### Project structure

- **apps/frontend** – Next.js app that provides the user-facing dashboard for managing monitored websites and viewing status.
- **apps/api** – Express-based HTTP API (`/api/v1/...`) for CRUD operations on websites and querying their status. Uses the shared `db` package.
- **apps/hub** – Bun server that coordinates validators over WebSockets, assigns validation work, and records validation results in the database.
- **apps/validator** – Bun worker app that connects to the hub, performs website checks, and sends signed validation results back.
- **packages/db** – Shared Prisma + PostgreSQL database client and schema, exported as a `db` package used by the other apps.
- **packages/common** – Shared types/utilities used across the apps (for example request/response message types).
- **packages/eslint-config** – Shared linting configuration for the workspace.

### Tech stack

- **Runtime / tooling**: Bun, Node.js, TypeScript, Turbo (monorepo orchestration)
+- **Frontend**: Next.js (App Router)
+- **Backend API**: Express
+- **Realtime / workers**: Bun WebSockets (hub + validator)
+- **Database**: PostgreSQL + Prisma Client

### Getting started

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Configure the database**

   In `packages/db/.env`, set `DATABASE_URL` to your PostgreSQL connection string. Then run migrations and generate the Prisma client:

   ```bash
   cd packages/db
   npx prisma migrate dev
   npx prisma generate
   cd ../..
   ```

3. **Run individual services**

   - **Frontend (Next.js dashboard)**

     ```bash
     cd apps/frontend
     bun dev
     ```

     Visit `http://localhost:3000` in your browser.

   - **API (Express)**

     ```bash
     cd apps/api
     bun run index.ts
     ```

   - **Hub (WebSocket coordinator)**

     ```bash
     cd apps/hub
     bun run index.ts
     ```

   - **Validator (worker)**

     ```bash
     cd apps/validator
     bun run index.ts
     ```

### Development scripts

From the repo root you can also use the Turbo-powered scripts defined in `package.json`:

- **`bun run dev`** – Run `turbo run dev` across apps that define a `dev` script.
- **`bun run build`** – Build all apps/packages that define `build`.
- **`bun run lint`** – Run shared linting.

### Contributing

1. Fork and clone the repository.
2. Create a feature branch off `main`.
3. Make your changes with suitable tests or manual verification.
4. Open a pull request describing the change and how to test it.

### License

This project is currently unlicensed; if you plan to use it in production or redistribute it, consider adding an appropriate license file (e.g. MIT, Apache-2.0) at the repo root.

# Turborepo starter

This Turborepo starter is maintained by the Turborepo core team.

## Using this example

Run the following command:

```sh
npx create-turbo@latest
```

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `docs`: a [Next.js](https://nextjs.org/) app
- `web`: another [Next.js](https://nextjs.org/) app
- `@repo/ui`: a stub React component library shared by both `web` and `docs` applications
- `@repo/eslint-config`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`)
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

### Build

To build all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
