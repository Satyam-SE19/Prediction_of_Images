<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/temp/1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file and set your Gemini API key. The server supports these env var names (in order): `API_KEY`, `GEMINI_API_KEY`, or `GOOGLE_API_KEY`. Example: `API_KEY=ya29_xxx`. Optionally you can set `GEMINI_NEXT_GEN_API_BASE_URL` to override the API base URL.
3. Install dependencies and run the app:
   ```bash
   npm install
   npm start
   ```

4. (Optional) Run a small API smoke test after the server is running:
   ```bash
   npm run test:api
   ```

5. (Optional) If your key is valid but you see model-not-found errors, list available models with:
   ```bash
   node scripts/list_models.js
   ```
   You can override models with env vars in `.env.local`:
   - `IMAGE_MODEL` (default: `models/gemini-flash-latest`)
   - `TEXT_MODEL` (default: `models/gemini-pro-latest`)
   If you need to change the Gemini API base URL (rare), set `GEMINI_NEXT_GEN_API_BASE_URL` in `.env.local`.
