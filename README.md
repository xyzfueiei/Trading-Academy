# Trading Academy

Trading Academy is a premium education platform for structured market learning. It is **not** a trading or exchange platform: the website does not execute trades, hold assets, provide personalized financial advice, or make performance promises.

## What is included

- React + Vite single-page application in JavaScript.
- Supabase Auth and PostgreSQL integration using the existing project.
- Role-aware routing for learners and administrators.
- Payment-gated course access using the existing `profiles.payment_status` and RLS policies.
- USDT payment submission with TXID stored as `pending` until manual admin review.
- Admin management for users, payments, payment methods, courses, modules, and YouTube lessons.
- Payment queue reads the existing schema without assuming a `payments.created_at` column; where no payment timestamp exists, the UI shows `—` rather than inventing a date.
- Manual YouTube lesson workflow: paste a YouTube URL, the app extracts the video ID and generates the standard thumbnail URL. No YouTube Data API key is required.
- Lesson completion/progress tracking through `user_lesson_progress`.
- Responsive public site, authentication screens, learner dashboard, and admin dashboard.
- Cloudflare Pages SPA fallback and security headers.

## Stack

- React 18 + JavaScript
- Vite 5
- Tailwind CSS 4 + `@tailwindcss/vite`
- React Router
- Framer Motion
- Lucide React
- Supabase JavaScript client
- YouTube embeds
- GitHub
- Cloudflare Pages

No Docker, Python backend, custom video hosting, YouTube Data API, blockchain verifier, or service-role key is included.

## Project structure

```text
Trading-Academy-Website/
├── public/
│   ├── _headers
│   └── _redirects
├── src/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── pages/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
└── README.md
```

## Supabase

The app points to this existing Supabase project URL:

```text
https://usvjsxsiwdkomudkfkqv.supabase.co
```

The shipped `.env.example` contains the public publishable client key supplied for this project. A public/publishable/anon key is expected in the browser. **Never put a Supabase `service_role` or other secret key into React source, `.env` committed to GitHub, or Cloudflare client configuration.**

The existing database tables are expected to be:

- `profiles`
- `payment_methods`
- `payments`
- `courses`
- `modules`
- `lessons`
- `user_lesson_progress`

The `lessons` table also has the additional YouTube fields added during setup:

- `youtube_url`
- `youtube_video_id`

The application does not reset or recreate your database.

## Windows + VS Code local setup

### 1. Check Node.js

Install Node.js 18+; Node.js 20+ is recommended. In VS Code open **Terminal → New Terminal** and run:

```powershell
node -v
npm -v
```

### 2. Install dependencies

From the extracted project root:

```powershell
npm install
```

### 3. Create the local environment file

```powershell
copy .env.example .env
```

Open `.env` and confirm the values are correct. A typical file is:

```env
VITE_SUPABASE_URL=https://usvjsxsiwdkomudkfkqv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-public-key
VITE_DEMO_MODE=false
```

The repository intentionally ignores `.env`.

### 4. Start the local server

```powershell
npm run dev
```

The Vite server is configured for port `3000` and normally opens at:

```text
http://127.0.0.1:3000
```

If Vite reports a different address/port, use the address printed in the terminal.

### 5. Test a production build

```powershell
npm run build
npm run preview
```

The production bundle is written to `dist/`. `dist/` is ignored by Git and is not included in the source ZIP.

### 6. Run the deterministic unit tests

```powershell
npm run test
```

The current test suite covers the pure YouTube URL helpers, date handling, and payment timestamp fallback. It does not require network access.

## Authentication flow

### Learner

`/signup` → Supabase Auth account → profile record → `/dashboard`

### Admin

`/login` → Supabase Auth → profile loaded from `profiles` → if `role = 'admin'`, redirect to `/admin`.

Admin status is never taken from localStorage or a hardcoded email/password.

## Payment flow

1. Learner signs in.
2. Learner opens `/payment`.
3. Active USDT methods are loaded from `payment_methods`.
4. Learner sends USDT externally using the selected network/wallet.
5. Learner submits amount + TXID.
6. A `payments` record is created with `status = 'pending'`.
7. An authorized admin reviews the record.
8. Approval changes the payment to `approved` and updates the user's `profiles.payment_status` to `approved`.
9. Rejection does not grant access.

The application does **not** claim automatic blockchain verification.

## Admin workflow

The admin workspace at `/admin` contains:

- Overview metrics from Supabase.
- Users: search/filter and account/access status.
- Payments: search/filter, approve/reject.
- Payment methods: add, edit, activate/deactivate, reorder, delete.
- Courses: add, edit, publish/unpublish, reorder, delete.
- Modules: add, edit, reorder, delete.
- Lessons: add, edit, publish/unpublish, reorder, delete.
- Settings: read-only configuration summary.

## YouTube lesson workflow

The admin enters only the lesson title, description, module, order, publish status, and YouTube URL.

Supported formats include:

```text
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://www.youtube.com/embed/VIDEO_ID
https://www.youtube.com/shorts/VIDEO_ID
```

The app extracts the 11-character video ID, stores it in `youtube_video_id`, stores the original URL in `youtube_url`, and generates:

```text
https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg
```

for `thumbnail_url`. The student lesson page embeds the actual YouTube video with a privacy-enhanced `youtube-nocookie.com` player.

## Course access

An authenticated learner may browse course descriptions, but protected lesson content is gated. The student lesson route checks the profile access status before rendering. Administrators are treated as having access by role.

## Progress

Learners can mark lessons complete. Course progress is calculated from the number of completed published lessons available in the course. The app does not claim to track exact YouTube watch time.

## Routes

Public:

- `/`
- `/courses`
- `/login`
- `/signup`
- `/privacy`
- `/terms`

Authenticated:

- `/dashboard`
- `/payment`
- `/profile`
- `/courses/:courseId`

Approved/admin content:

- `/lessons/:lessonId`

Admin:

- `/admin`

## GitHub

After local testing:

```powershell
git init
git add .
git commit -m "Initial Trading Academy website"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPOSITORY.git
git push -u origin main
```

Before `git push`, confirm `.env` is not staged:

```powershell
git status
git ls-files .env
```

`git ls-files .env` should return nothing.

## Cloudflare Pages

Create a Cloudflare Pages project from the GitHub repository.

Build command:

```text
npm run build
```

Build output directory:

```text
dist
```

Add these environment variables in Cloudflare Pages for Preview and Production:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_DEMO_MODE=false
```

Do not upload `.env` to GitHub and do not add a service-role key to Cloudflare client-side environment variables.

The `public/_redirects` file supplies an SPA fallback so routes such as `/login`, `/dashboard`, and `/admin` can be refreshed after deployment.

After you have the final Cloudflare Pages domain, add it to the appropriate Supabase Auth Site URL and Redirect URL settings. Keep your local development URL configured as well.

## Security and production notes

- The browser uses only the public Supabase client key.
- RLS remains the database security boundary; the frontend never uses a service-role key to bypass it.
- Never trust a frontend-only admin flag or payment status. The app reads role/access from Supabase.
- Wallet addresses are loaded from `payment_methods`, not hardcoded.
- TXIDs are user-submitted values and are not automatically verified.
- The ZIP intentionally excludes `.env`, `node_modules`, `dist`, caches, and credentials.
- Replace the Privacy and Terms template pages with final reviewed policies before production launch.
- Keep payment and educational disclosures accurate and avoid profit guarantees.

## Troubleshooting

### Login opens a blank page

This source package includes a fix for the original render-time error in `Login.jsx`. The login route now reads query parameters with React Router's location object correctly and waits for Supabase profile restoration before redirecting. An application error boundary also shows a recovery screen instead of leaving a blank page.

If the local browser still shows stale assets, stop Vite, delete the browser tab/cache if needed, then run `npm run dev` again.

### Supabase profile error after login

Check that:

- the user exists in Supabase Auth;
- a matching `profiles` row exists;
- the existing profile trigger/RLS policies are still present;
- the browser is using the correct Supabase project URL/public key.

### Courses or lessons are empty

Check that published rows exist and that the current Supabase RLS policies allow the expected user to read them. The frontend does not bypass RLS.

## Project verification note

This repair pass included a codebase review and static consistency checks. A full Vite production build could not be completed in the build environment used for this repair because the uploaded project originally contained Windows-specific `node_modules` binaries and this environment did not have working npm-registry access to reinstall Linux-compatible dependencies. The final ZIP therefore contains source/configuration only, without `node_modules` or `dist`. Run `npm install`, `npm run test`, and `npm run build` locally on your Windows machine to perform the final runtime verification.

## SETUP CHECKLIST

- [ ] Install Node.js
- [ ] Extract the ZIP
- [ ] Open the folder in VS Code
- [ ] Run `npm install`
- [ ] Create `.env` from `.env.example`
- [ ] Confirm the Supabase public client configuration
- [ ] Run `npm run test`
- [ ] Run `npm run dev`
- [ ] Test homepage
- [ ] Test login
- [ ] Test signup
- [ ] Test dashboard
- [ ] Test payment submission
- [ ] Test admin login
- [ ] Test admin dashboard
- [ ] Test payment approval/rejection
- [ ] Test payment-method management
- [ ] Test course CRUD
- [ ] Test module CRUD
- [ ] Test lesson CRUD
- [ ] Test YouTube URL parsing/preview
- [ ] Test lesson completion
- [ ] Test Privacy and Terms routes
- [ ] Run `npm run build`
- [ ] Create GitHub repository
- [ ] Push source to GitHub
- [ ] Create Cloudflare Pages project
- [ ] Add Cloudflare environment variables
- [ ] Configure Supabase Auth URLs
- [ ] Deploy
