# FocusGuard web

The web application uses the Spring Boot API for authentication and application data. Supabase remains in use by the Flutter app during its separate migration.

## Run locally

1. Start the Spring backend and PostgreSQL from `D:\focusguard-backend` with `docker compose up --build -d`.
2. Copy `.env.example` to `.env.local`. Set `BACKEND_API_URL=http://localhost:8081` to match the backend's published API port.
3. Set the backend's `EMAIL_VERIFICATION_BASE_URL` to `http://localhost:3000/api/auth/verify-email` so email links return through the web app.
4. Install the web dependencies with `npm install`, then run `npm run dev`.

The browser talks to same-origin Next.js route handlers. Those handlers keep Spring access and refresh tokens in HttpOnly cookies and forward API requests to `BACKEND_API_URL`.
