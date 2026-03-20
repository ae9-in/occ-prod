# OCC Backend

Practical Express + Prisma + PostgreSQL backend for Off Campus Clubs.

## Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL / Railway
- JWT auth
- Multer uploads
- Zod validation

## Quick start

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## Render deployment

The repository now includes Render blueprints at:

- [`render.yaml`](/D:/occ%20application%203/render.yaml) for the actual Git repo root
- [`occ/render.yaml`](/D:/occ%20application%203/occ/render.yaml) if you ever deploy from the nested `occ` directory directly

The root-level blueprint provisions:

- `occ-backend` web service
- `occ-db` PostgreSQL database
- persistent disk mounted at `/var/data` for uploads

Required manual env values on Render before going live:

- `CORS_ORIGIN`
- `APP_URL`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

Recommended values:

- `CORS_ORIGIN`: your Vercel frontend URL, for example `https://occ-frontend-next.vercel.app`
- `APP_URL`: your Render backend public URL
- `ADMIN_EMAIL`: your real admin email
- `ADMIN_PASSWORD`: a strong rotated admin password, not the default local seed value

## Scripts

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run typecheck`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:deploy`
- `npm run prisma:seed`
- `npm run db:check`
