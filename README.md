# IAUE-ITE Research Project Validator Frontend

React frontend for the IAUE ITE postgraduate research-project validator. It
uses the NestJS API in `../research-validator-api` for public title validation,
administrator authentication, project records, reports, and administrator
management.

## Local development

1. Start the backend from `../research-validator-api` with its Neon database
   configuration. It listens on `http://localhost:3000` by default.
2. In the backend `.env`, either leave `CORS_ORIGIN` unset for local
   development or set it to `http://localhost:8080`.
3. Copy `.env.example` to `.env` if you need to override the API URL. Without
   it, the frontend defaults to `http://localhost:3000`.
4. Install and start the frontend.

   ```bash
   npm install
   npm run dev
   ```

The Vite app runs on `http://localhost:8080`.

## Deployment

Set `VITE_API_BASE_URL` in Vercel to the public Render backend URL, for
example `https://your-api.onrender.com`. Configure the backend's `CORS_ORIGIN`
with the Vercel frontend URL before deploying it.
