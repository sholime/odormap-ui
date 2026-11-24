# odormap-ui

Mobile-friendly web app for OdorMap: residents of Bačka Topola report bad odors from their phones. Each report
is sent to [odormap-api](https://github.com/sholime/odormap-api), which adds the location's weather. Shared types
and translations come from [odormap-common](https://github.com/sholime/odormap-common).

Built with React and Vite. The screens are in Serbian (Latin script) and Hungarian.

## Screens

1. **Sign in**: continue without an account (guest), log in or create an account with email, or use Google.
   The privacy notice must be accepted first.
2. **Report**: the phone's location is found automatically. Pick how strong the odor is (1 to 5) and send.
   Odor kind and a comment are optional, each folded away until opened.

3. **My account**: name, email, account type and date joined; log out; delete the account (reports stay on the map, unlinked and without comments)
   (asks a second time before deleting).

A guest can create an account later from the report screen and keeps their reports.

## Folders

```
src/
  main.tsx          starts the app
  App.tsx           header, language switch, and which screen to show
  api.ts            every call to the API, and keeping the login tokens
  texts.ts          all on-screen text in sr and hu
  views/            the screens: SignIn, ReportForm and Account
  components/       PrivacyNotice and the Google button
  styles.css        all styles, mobile first
```

## Running it on your computer

1. Start the API: in odormap-api, `npm run dev` (runs on http://localhost:3000).
2. Here: `cp .env.example .env.local`, then `npm install` and `npm run dev`.
3. Open http://localhost:5173. Browsers allow the location only on `localhost` or `https`.

`npm test` runs the tests, `npm run build` makes the files Vercel serves.

## Deploying (Vercel)

Vercel builds and hosts the web app. Once set up, it deploys by itself:

- every merge into `main` updates the live site;
- every pull request gets its own preview address (it can't log in, because the API only
  accepts the addresses listed in `ALLOWED_ORIGINS`).

One-time setup:

1. Sign in at [vercel.com](https://vercel.com) with GitHub (the free Hobby plan is enough).
2. **Add New → Project**, import `odormap-ui`. Vercel detects Vite; leave the build settings as they are.
3. Under **Environment Variables**, add:

   | Name | Value |
   |---|---|
   | `VITE_API_URL` | The API's address (the `ApiUrl` output of the odormap-api deploy), without a trailing `/` |
   | `VITE_GOOGLE_CLIENT_ID` | The Google OAuth client id, or leave empty to hide the Google button |

4. Click **Deploy** and note the address Vercel gives (e.g. `https://odormap-ui.vercel.app`).
5. Add that address to the API's `ALLOWED_ORIGINS` (GitHub → odormap-api → Settings → Environments)
   and to the Google client's **Authorized JavaScript origins**, then re-run the API deploy
   (odormap-api → Actions → Deploy → Run workflow) so it picks up the new setting.

Changing an environment variable later only takes effect after a new deploy
(Vercel → Deployments → ⋯ → Redeploy).

## Before launch

- Name who is responsible for the data in `src/components/PrivacyNotice.tsx`.
- Have native speakers check the Serbian and Hungarian texts in `src/texts.ts`.
