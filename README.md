# AIAGENTSAGE — Multipage Web App

This repository contains a fast, intuitive website for **AIAGENTSAGE** along with a small serverless proxy that protects your OpenAI API key. The front‑end runs on **GitHub Pages**; the proxy runs on Cloudflare Workers (or any similar serverless environment). Together, they let you offer 12 plug‑and‑play agents to help startups and SMEs move faster with AI.

## Project structure

```
aiagentsage_site/
├─ index.html           # Landing page introducing the business and benefits
├─ agents.html          # Agent hub (email gate + 12 agents)
├─ assets/
│  ├─ app.js           # Front‑end logic: renders agents and calls proxy
│  └─ styles.css       # Optional extra styles
├─ worker.js            # Cloudflare Worker that calls the OpenAI API
└─ README.md            # This file
```

## Why a serverless proxy?

GitHub Pages only serves static files; it cannot securely store secrets. Directly exposing your OpenAI key in the browser would allow anyone to steal it and rack up charges. Instead, the client sends requests to a tiny serverless function (`worker.js`). The proxy adds your key, calls the OpenAI API, and returns results. You set the key as an environment variable on the serverless platform.

## Setup and deployment

### 1. Front‑end (GitHub Pages)

1. **Create a new repository** on GitHub, e.g. `aiagentsage-site`.
2. Copy the contents of `aiagentsage_site` into the repository root. Commit and push.
3. **Enable GitHub Pages**: go to **Settings → Pages**, set **Source** to **Deploy from a branch**, choose the `main` branch and the root (`/`) folder, then save.
4. After a minute or two, your landing page will be live at:

   ```
   https://<username>.github.io/<repo>/
   ```

### 2. Serverless proxy (Cloudflare Workers example)

You can use any platform (Vercel, Netlify Functions, Deno Deploy, etc.) that supports serverless functions. Below is a Cloudflare Workers example.

1. **Install the Workers CLI** and create a new project:

   ```bash
   npm create cloudflare@latest aiagentsage-proxy
   cd aiagentsage-proxy
   ```

   Choose the minimal (Hello World) template.

2. Replace the generated `worker.js` file with the one provided in this repo (`aiagentsage_site/worker.js`). Adjust the `wrangler.toml` if necessary (set `name` and `compatibility_date`).

3. Authenticate and set your OpenAI API key as a secret:

   ```bash
   npx wrangler login
   npx wrangler secret put OPENAI_API_KEY
   # paste your OpenAI key when prompted
   ```

4. Deploy the worker:

   ```bash
   npx wrangler deploy
   ```

   Note the deployed URL, e.g. `https://aiagentsage-proxy.<handle>.workers.dev`.

5. **Update the front‑end**: edit `/assets/app.js` and set the `BACKEND_URL` constant to your worker URL followed by `/api/agent`, like this:

   ```js
   const BACKEND_URL = "https://aiagentsage-proxy.<handle>.workers.dev/api/agent";
   ```

   Commit and push this change to GitHub so the front‑end points at your proxy.

### 3. Test the agents

1. Open `https://<username>.github.io/<repo>/agents.html` in your browser.
2. Enter a valid email when prompted.
3. Choose an agent, provide context in the textarea, and click **Run**.
4. The result will appear below the card. You can copy or save the output as needed.

## Customize

- **Add or modify agents**: edit the `AGENTS` array in `/assets/app.js`. Each agent has an `id`, `name`, `hint`, `system` message, and a `template` function that builds the prompt sent to the API.
- **Change the UI**: update `index.html` and `agents.html` or adjust Tailwind classes for different colors, spacing, or layouts.
- **Capture emails**: currently, emails are stored in the browser’s `localStorage` only. For marketing or analytics, integrate a form submission (e.g. using Formspree, Beehiiv, ConvertKit) or write to a database in the worker.

## Security reminder

Never commit your OpenAI API key to source control and never embed it in client-side code. Always store it as a secret in your serverless environment (e.g. Cloudflare Worker Secrets, Vercel Environment Variables, Netlify Secrets).