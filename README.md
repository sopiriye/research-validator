# IAUE-ITE Research Project Validator Frontend

React frontend for the IAUE ITE postgraduate research-project validator. It
uses the NestJS API in `../research-validator-api` for public title validation,
administrator authentication, project records, reports, and administrator
management.

## Local development

1. Start the backend from `../research-validator-api` with its Neon database
   configuration, or set `VITE_API_PROXY_TARGET` to a deployed API such as
   `https://your-api.onrender.com`.
2. Copy `.env.example` to `.env` and set `VITE_API_PROXY_TARGET`. The browser
   calls the local `/api` path; Vite forwards it to that target, so local
   development does not depend on the target API's CORS configuration.
4. Install and start the frontend.

   ```bash
   npm install
   npm run dev
   ```

The Vite app runs on `http://localhost:8080`.

## Deployment

Set `VITE_API_BASE_URL` in Vercel to the public Render backend URL, for
example `https://your-api.onrender.com`. Configure the backend's `CORS_ORIGIN`
with the Vercel frontend URL before deploying it; Vite's local proxy is not
present in a Vercel production build.
