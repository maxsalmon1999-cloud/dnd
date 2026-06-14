# Deploying the React app to Cloudflare Pages

The app is fully prepared for Cloudflare Pages. Two things only **you** can do are left,
because they need your Cloudflare login (this environment can't log in for you).

Your old app stays live and untouched at `https://maxsalmon1999-cloud.github.io/dnd/` no matter
what — this publishes the *new* app to a *separate* Cloudflare URL.

---

## Recommended: connect the repo in the Cloudflare dashboard (auto-deploys on every push)

This is the simplest long-term setup — no commands, no secrets, and it redeploys automatically
every time we push to GitHub.

1. Go to **https://dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Authorise GitHub and pick the **`maxsalmon1999-cloud/dnd`** repository.
3. On the build-settings screen, enter **exactly** these (the important ones):
   - **Production branch:** `react-migration` (switch to `main` later, once the rebuild is merged)
   - **Framework preset:** `Vite`
   - **Root directory:** `react`   ← important: our app lives in this sub-folder
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Click **Save and Deploy**.

After ~1 minute you'll get a live URL like `https://dnd-react.pages.dev`. From then on, every
`git push` redeploys automatically.

> SPA routing (deep links like `/dm`) already works — `public/_redirects` handles it.

---

## Alternative: quick one-off deploy from your terminal

If you just want a live URL right now without the dashboard, run these in a terminal on your Mac:

```bash
# 1. Log in to Cloudflare (opens your browser once)
npx wrangler login

# 2. From the repo, build + deploy
cd ~/Documents/claude/dnd/react
npm run deploy
```

`npm run deploy` builds the app and uploads it to a Pages project called `dnd-react`
(created automatically on first run). It prints the live URL when done.

> Note: a project can be **either** Git-connected (dashboard method) **or** CLI-uploaded — not
> both. Pick one method and stick with it. The dashboard method above is recommended.

---

## Nothing secret is exposed

The Firebase config and worker URL baked into the build are **client-side public values** (the
same ones already in the old `index.html`). The Anthropic API key is **not** in the app — it
stays a secret inside the Cloudflare *worker*. So publishing this build is safe.
