This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

**If the dev server hangs on "Compiling..." or shows endless loading (Turbopack issue), use the stable dev script instead:**

```bash
npm run dev:stable
```

- `dev` – runs with Turbopack (default in Next.js 16).
- `dev:stable` – runs with webpack (`NEXT_DISABLE_TURBOPACK=1`). Use this if Turbopack hangs or you see lockfile/workspace root warnings.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Troubleshooting (Windows)

**Stuck dev server or "Unable to acquire lock .next/dev/lock":**

1. Stop the dev server (Ctrl+C in the terminal).
2. Kill any leftover Node process:
   ```powershell
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   ```
3. Remove the Next.js cache and lock:
   ```powershell
   Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
   ```
4. Start again: `npm run dev` or `npm run dev:stable`.

**Repo uses npm only.** Keep only `package-lock.json`; do not commit `pnpm-lock.yaml`, `yarn.lock`, or `bun.lockb` (they are in `.gitignore` to avoid Turbopack picking the wrong workspace root).

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
